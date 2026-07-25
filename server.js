const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const crypto = require('crypto');
const { fetch, Agent, ProxyAgent } = require('undici');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, Nginx, Cloudflare, etc.)


// ==================== PROXY POOL ====================
const PROXIES_FILE = path.join(__dirname, 'proxies.json');

class ProxyPool {
  constructor() {
    this._settings = { useDirectConnection: true, maxBotsPerProxy: 10 };
    this._proxies = [];
    this._assignments = {}; // line_uid -> proxy_id | 'direct'
    this._agents = {};      // proxy_id -> ProxyAgent instance
    this._directAgent = new Agent({
      connect: { timeout: 10000 },
      keepAliveTimeout: 30000,
      keepAliveMaxTimeout: 60000,
      pipelining: 1,
      connections: 50,
    });
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(PROXIES_FILE)) {
        const data = JSON.parse(fs.readFileSync(PROXIES_FILE, 'utf8') || '{}');
        this._settings = { useDirectConnection: true, maxBotsPerProxy: 10, ...(data.settings || {}) };
        this._proxies = data.list || [];
        this._agents = {};
        for (const p of this._proxies) {
          if (p.active && p.url) this._agents[p.id] = this._createAgent(p.url);
        }
      }
    } catch (e) {
      console.error('ProxyPool load error:', e.message);
    }
  }

  _save() {
    try {
      fs.writeFileSync(PROXIES_FILE, JSON.stringify({ settings: this._settings, list: this._proxies }, null, 2), 'utf8');
    } catch (e) {
      console.error('ProxyPool save error:', e.message);
    }
  }

  _createAgent(url) {
    return new ProxyAgent({
      uri: url,
      connect: { timeout: 10000 },
      keepAliveTimeout: 30000,
      keepAliveMaxTimeout: 60000,
      pipelining: 1,
      connections: 50,
    });
  }

  _getCounts() {
    const counts = { direct: 0 };
    for (const p of this._proxies) counts[p.id] = 0;
    for (const slot of Object.values(this._assignments)) {
      counts[slot] = (counts[slot] || 0) + 1;
    }
    return counts;
  }

  // Bin-packing: fill cheapest slots first, then fill each proxy fully before opening next
  assignBot(line_uid) {
    if (this._assignments[line_uid]) return this._assignments[line_uid];
    const max = this._settings.maxBotsPerProxy || 10;
    const counts = this._getCounts();

    // 1. Direct connection (free) — fill first
    if (this._settings.useDirectConnection && (counts['direct'] || 0) < max) {
      this._assignments[line_uid] = 'direct';
      return 'direct';
    }

    // 2. Fill existing proxy slots before opening new ones (sort DESC by current count)
    const active = this._proxies.filter(p => p.active && p.url);
    active.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    for (const p of active) {
      if ((counts[p.id] || 0) < max) {
        this._assignments[line_uid] = p.id;
        return p.id;
      }
    }

    // 3. All full — overflow to least loaded proxy
    if (active.length > 0) {
      active.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
      this._assignments[line_uid] = active[0].id;
      return active[0].id;
    }

    // 4. Fallback: direct
    this._assignments[line_uid] = 'direct';
    return 'direct';
  }

  releaseBot(line_uid) {
    delete this._assignments[line_uid];
  }

  getDispatcher(line_uid) {
    const slot = this._assignments[line_uid] || this.assignBot(line_uid);
    if (slot === 'direct') return this._directAgent;
    if (this._agents[slot]) return this._agents[slot];
    // Proxy removed/inactive — reassign
    delete this._assignments[line_uid];
    return this.getDispatcher(line_uid);
  }

  // Default dispatcher for server-level requests (proxyRequest, fetchGameHtml, fetchGameAsset)
  getDefaultDispatcher() {
    if (this._settings.useDirectConnection) return this._directAgent;
    const p = this._proxies.find(p => p.active && p.url && this._agents[p.id]);
    return p ? this._agents[p.id] : this._directAgent;
  }

  _reassignFrom(proxyId) {
    for (const uid of Object.keys(this._assignments)) {
      if (this._assignments[uid] === proxyId) delete this._assignments[uid];
    }
  }

  addProxy(label, url) {
    const id = 'px_' + Date.now();
    const proxy = { id, label: label || url, url, active: true };
    this._proxies.push(proxy);
    this._agents[id] = this._createAgent(url);
    this._save();
    return proxy;
  }

  updateProxy(id, fields) {
    const p = this._proxies.find(p => p.id === id);
    if (!p) return null;
    if (fields.label !== undefined) p.label = fields.label;
    if (fields.url !== undefined && fields.url !== p.url) {
      p.url = fields.url;
      try { if (this._agents[id]) this._agents[id].destroy(); } catch (e) {}
      this._agents[id] = (p.active && p.url) ? this._createAgent(p.url) : null;
    }
    if (fields.active !== undefined) {
      const wasActive = p.active;
      p.active = !!fields.active;
      if (p.active && p.url && !this._agents[id]) this._agents[id] = this._createAgent(p.url);
      if (!p.active && wasActive) {
        this._reassignFrom(id);
        try { if (this._agents[id]) this._agents[id].destroy(); } catch (e) {}
        delete this._agents[id];
      }
    }
    this._save();
    return p;
  }

  deleteProxy(id) {
    this._reassignFrom(id);
    try { if (this._agents[id]) this._agents[id].destroy(); } catch (e) {}
    delete this._agents[id];
    this._proxies = this._proxies.filter(p => p.id !== id);
    this._save();
  }

  getStats() {
    const counts = this._getCounts();
    const max = this._settings.maxBotsPerProxy || 10;
    const result = [];
    if (this._settings.useDirectConnection) {
      result.push({ id: 'direct', label: '🖥️ Kết nối trực tiếp (máy)', url: 'direct', active: true, botCount: counts['direct'] || 0, maxBots: max, isDirect: true });
    }
    for (const p of this._proxies) {
      result.push({ ...p, botCount: counts[p.id] || 0, maxBots: max, isDirect: false });
    }
    return result;
  }

  getBotProxyInfo(line_uid) {
    const slot = this._assignments[line_uid];
    if (!slot) return { label: '—', isDirect: true };
    if (slot === 'direct') return { id: 'direct', label: '🖥️ Direct', isDirect: true };
    const p = this._proxies.find(p => p.id === slot);
    return p ? { id: p.id, label: p.label, isDirect: false } : { label: '🖥️ Direct', isDirect: true };
  }

  getSettings() { return { ...this._settings }; }
  updateSettings(s) { this._settings = { ...this._settings, ...s }; this._save(); }
}

const proxyPool = new ProxyPool();

// Enable Gzip/Brotli compression for static and API responses (excluding image files)
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.path.match(/\.(png|jpg|gif|webp)$/i)) return false;
    return compression.filter(req, res);
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));

// Path to storage files
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// In-memory session store: token -> { userId, username, role, maxAccounts }
let userSessions = {};

// Password hashing helper using Node.js crypto (PBKDF2)
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Load users
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return [];
}

// Save users
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users file:', err);
  }
}

// Helper to check if a user account is expired
function isUserExpired(user) {
  if (!user || user.role === 'admin' || !user.expiresAt) return false;
  return new Date(user.expiresAt) < new Date();
}

// In-memory data store for bot instances
let botInstances = {};

// Load accounts
function loadAccounts() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error reading accounts file:', err);
  }
  return [];
}

// Save accounts
function saveAccounts(accounts) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing accounts file:', err);
  }
}

// Initialize default Admin and migrate accounts if needed
function initDefaultAdminAndMigrate() {
  let users = loadUsers();
  let admin = users.find(u => u.role === 'admin');
  if (!admin) {
    const salt = crypto.randomBytes(16).toString('hex');
    admin = {
      id: 'usr_admin',
      username: 'admin',
      passwordHash: hashPassword('admin123', salt),
      salt: salt,
      role: 'admin',
      maxAccounts: 999,
      createdAt: new Date().toISOString()
    };
    users.push(admin);
    saveUsers(users);
    console.log('🔑 Created default Admin account (Username: admin, Password: admin123)');
  }

  // Migrate existing accounts to admin if userId is missing
  const accounts = loadAccounts();
  let updated = false;
  accounts.forEach(acc => {
    if (!acc.userId) {
      acc.userId = admin.id;
      updated = true;
    }
  });
  if (updated) {
    saveAccounts(accounts);
    console.log('🔄 Migrated existing accounts to Admin user ownership');
  }
}

initDefaultAdminAndMigrate();

// Game formulas
function tierGold(lv) {
  lv = Math.max(1, lv);
  const START = [100, 2000, 5000, 10000, 19000, 36000, 69000, 134000, 263000, 520000];
  const END   = [1000, 3000, 6000, 11000, 20000, 37000, 70000, 135000, 264000, 521000];
  let b = Math.floor((lv - 1) / 10);
  if (b > 9) b = 9;
  const pos = (lv - 1) % 10;
  return Math.round((START[b] + pos * (END[b] - START[b]) / 9) / 100) * 100;
}

function tierRes(lv) {
  lv = Math.max(1, lv);
  let b = Math.floor((lv - 1) / 10);
  if (b > 9) b = 9;
  return lv * (10 + 20 * b);
}

function _upgCostMult(t) {
  if (t < 20) return 1.0;
  const band = Math.floor(t / 10);
  return 1.1 + 0.25 * (band - 2);
}

function getArmorUpgradeCost(armorLv) {
  const nextLv = armorLv + 1;
  const mult = _upgCostMult(nextLv);
  return {
    gold: Math.ceil(tierGold(nextLv) * mult),
    stone: Math.ceil(tierRes(nextLv) * mult)
  };
}

function getCatUpgradeCost(catLv) {
  const nextLv = catLv + 1;
  const mult = _upgCostMult(nextLv);
  return {
    gold: Math.ceil(tierGold(nextLv) * mult),
    stone: Math.ceil(tierRes(nextLv) * mult)
  };
}

function getDroneUpgradeCost(droneLv) {
  const nextLv = droneLv + 1;
  const mult = _upgCostMult(nextLv);
  return {
    gold: Math.ceil(tierGold(nextLv) * mult),
    copper: Math.ceil(tierRes(nextLv) * mult)
  };
}

function getMineUpgradeCost(mineLv) {
  const nextLv = mineLv + 1;
  const mult = _upgCostMult(nextLv);
  const res = Math.ceil(tierRes(nextLv) * mult);
  return {
    gold: Math.ceil(tierGold(nextLv) * mult),
    wood: res,
    stone: res,
    iron: res,
    copper: res
  };
}

// Skill prerequisites checking helper
const SKILL_REQS = {
  crit_shot: { player_lv: 1 },
  kill_shot: { player_lv: 1, skill: 'crit_shot', lv: 3 },
  explosive_shot: { player_lv: 30, skills: [{ skill: 'crit_shot', lv: 5 }, { skill: 'kill_shot', lv: 5 }] },
  lock_on: { player_lv: 40, skill: 'explosive_shot', lv: 5 },
  triple_knife: { player_lv: 50, skill: 'lock_on', lv: 5 },
  tough_body: { player_lv: 1 },
  armor_up: { player_lv: 1, skill: 'tough_body', lv: 3 },
  hp_regen: { player_lv: 1, skill: 'tough_body', lv: 5 },
  pull_monster: { player_lv: 30, skills: [{ skill: 'hp_regen', lv: 5 }, { skill: 'armor_up', lv: 5 }] },
  melee_return: { player_lv: 40, skill: 'pull_monster', lv: 5 },
  melee_charge: { player_lv: 50, skill: 'melee_return', lv: 5 },
  knife_atk: { player_lv: 1 },
  double_attack: { player_lv: 1, skill: 'knife_atk', lv: 5 },
  spin_attack: { player_lv: 30, skills: [{ skill: 'knife_atk', lv: 5 }, { skill: 'double_attack', lv: 5 }] },
  sword_cross: { player_lv: 40, skill: 'spin_attack', lv: 5 },
  sword_x: { player_lv: 50, skill: 'sword_cross', lv: 5 },
  deploy_turret: { player_lv: 1 },
  turret_rapid: { player_lv: 1, skill: 'deploy_turret', lv: 3 },
  twin_turret: { player_lv: 30, skills: [{ skill: 'deploy_turret', lv: 5 }, { skill: 'turret_rapid', lv: 5 }] }
};

function isSkillUnlocked(skillId, playerLv, skills) {
  const req = SKILL_REQS[skillId];
  if (!req) return true;
  
  if (req.player_lv && playerLv < req.player_lv) return false;
  
  if (req.skills) {
    return req.skills.every(c => (skills[c.skill] || 0) >= c.lv);
  }
  if (req.skill) {
    return (skills[req.skill] || 0) >= req.lv;
  }
  return true;
}

// Map definitions (mirror of MAP_DEFS in xhrpg_canvas.js)
const MAP_DEFS = [
  { id: 1, name: 'Thung lũng Trung tâm',  emoji: '🌿', req: 1  },
  { id: 2, name: 'Sa mạc Vĩnh hằng',      emoji: '🏜️', req: 25 },
  { id: 3, name: 'Vùng đất Băng giá',     emoji: '❄️', req: 40 },
  { id: 4, name: 'Đấu trường Arena (PVP)', emoji: '🏛️', req: 20 },
];

// Background poller manager
class BotInstance {
  constructor(account) {
    this.line_uid = account.line_uid;
    this.session_token = account.session_token;
    this.name = account.name;
    this.userId = account.userId || 'usr_admin';
    this.settings = account.settings || this.getDefaultSettings();
    
    this.player = null;
    this.logs = [];
    this.lastUpdate = null;
    this.error = null;
    this.status = 'idle';
    this.pollCount = 0;
    this.timer = null;
    this.isPolling = false;
    this.arrivedAtZoneCenter = false;
    this.targetedMvp = false;
    this.lastTargetedBossId = null;
    this.lootLogs = [];

    proxyPool.assignBot(this.line_uid);
    this.addLog('SYSTEM', `Khởi tạo bot cho tài khoản: ${this.name}`);
  }

  getDefaultSettings() {
    return {
      bot: 1,
      lock_pos: 0,
      explore_radius: 300,
      explore_cx: 1125,
      explore_cy: 1125,
      auto_potion_threshold: 50,
      lang: 'vi',
      autoStats: false,
      statsPriority: ['str', 'agi', 'vit', 'intel', 'dex', 'luk'],
      autoGear: false,
      autoSkills: false,
      skillsPriority: ['crit_shot', 'tough_body', 'hp_regen', 'armor_up', 'knife_atk'],
      autoCompanion: false,
      autoMines: false,
      defaultOre: 'stone',
      autoMap: false,
      targetMap: 1,
      autoZone: false,
      lock_zone_center: false,
      targetZone: 0,
      autoMVP: false,
      mvpPriorityMode: 'distance',
      mvpNamePriority: '',
      mvpNameBlacklist: '',
      autoArena: false
    };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.addLog('SYSTEM', 'Cập nhật cấu hình bot thành công');
  }

  addLog(type, msg) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    this.logs.push({
      time: timestamp,
      type: type.toLowerCase(),
      msg: msg
    });
    if (this.logs.length > 200) {
      this.logs.shift();
    }
  }

  addLootLog(msg) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    this.lootLogs.push({
      time: timestamp,
      msg: msg
    });
    if (this.lootLogs.length > 200) {
      this.lootLogs.shift();
    }
  }

  start() {
    if (this.timer) return;
    this.status = 'running';
    this.pollCount = 0;
    this.addLog('SYSTEM', 'Bắt đầu hoạt động (đang kết nối...)');
    
    const runPoll = async () => {
      if (this.status !== 'running') return;

      // Pause polling if client is active (heartbeat in last 12 seconds)
      if (this.lastClientActive && (Date.now() - this.lastClientActive < 12000)) {
        if (!this.clientActivePaused) {
          this.clientActivePaused = true;
          this.addLog('SYSTEM', '🎮 Phát hiện bạn đang mở Client Game. Tạm ngưng chạy bot ngầm để tránh xung đột...');
        }
        this.isPolling = false;
        if (this.status === 'running') {
          this.timer = setTimeout(runPoll, 2000);
        }
        return;
      }

      if (this.clientActivePaused) {
        this.clientActivePaused = false;
        this.addLog('SYSTEM', '🔌 Đã đóng Client Game. Tự động kích hoạt lại bot chạy ngầm...');
      }

      this.isPolling = true;
      try {
        await this.pollGame();
      } catch (err) {
        console.error(`Poll error for ${this.name}:`, err);
        this.error = err.message;
        this.addLog('ERROR', `Lỗi kết nối: ${err.message}`);
      } finally {
        this.isPolling = false;
        // Schedule next poll staggering
        if (this.status === 'running') {
          this.timer = setTimeout(runPoll, 2000);
        }
      }
    };

    // Stagger startup
    this.timer = setTimeout(runPoll, Math.random() * 1000);
  }

  stop(status = 'idle') {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.status = status;
    if (status === 'idle') {
      this.addLog('SYSTEM', 'Đã dừng hoạt động bot');
    }
  }

  async sendRequest(url, payload) {
    // Throttle requests: Đảm bảo khoảng cách tối thiểu 1.1s giữa các request của bot để tránh lỗi "too_fast"
    const now = Date.now();
    const timeSinceLast = now - (this.lastRequestAt || 0);
    if (timeSinceLast < 1100) {
      await new Promise(r => setTimeout(r, 1100 - timeSinceLast));
    }
    this.lastRequestAt = Date.now();

    const headers = {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept': '*/*',
      'origin': 'https://ragnalok.online',
      'referer': 'https://ragnalok.online/human/'
    };

    const searchParams = new URLSearchParams(payload);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: searchParams.toString(),
        dispatcher: proxyPool.getDispatcher(this.line_uid),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        // If it returns HTML or Cloudflare challenge
        if (text.includes('cf-challenge') || text.includes('Cloudflare')) {
          throw new Error('Bị chặn bởi Cloudflare (Rate Limit/JS Challenge)');
        }
        throw new Error('Dữ liệu máy chủ trả về không hợp lệ (Không phải JSON)');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Yêu cầu kết nối quá hạn (Timeout 10s)');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async pollGame() {
    // Check if system user account is expired
    const users = loadUsers();
    const owner = users.find(u => u.id === this.userId);
    if (isUserExpired(owner)) {
      this.status = 'failed';
      this.error = 'Tài khoản hệ thống đã hết hạn sử dụng';
      this.addLog('ERROR', '⛔ Tài khoản hệ thống của bạn đã hết hạn sử dụng. Bot tự động dừng.');
      this.stop('failed');
      return;
    }

    this.pollCount++;
    // Request full payload on every 5th poll to keep cold values fresh
    const isFull = (this.pollCount % 5 === 0) ? 1 : 0;
    
    let exploreCx = this.player ? (this.settings.explore_cx || this.player.x) : this.settings.explore_cx;
    let exploreCy = this.player ? (this.settings.explore_cy || this.player.y) : this.settings.explore_cy;
    let exploreRadius = this.settings.explore_radius;
    let traveling = 0;
    this.targetedMvp = false;
    let lockPos = this.settings.lock_pos ? 1 : 0;

    // 1. Auto MVP Hunting (Priority 1)
    if (this.settings.autoMVP && this.bosses && this.bosses.length > 0) {
      let aliveBosses = this.bosses.filter(b => (b.hp || 0) > 0);

      // Filter out blacklisted bosses
      if (this.settings.mvpNameBlacklist) {
        const blacklist = this.settings.mvpNameBlacklist.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (blacklist.length > 0) {
          aliveBosses = aliveBosses.filter(b => {
            const name = (b.name || '').toLowerCase();
            return !blacklist.some(term => name.includes(term));
          });
        }
      }

      if (aliveBosses.length > 0) {
        // Filter priority bosses
        let priorityBosses = [];
        if (this.settings.mvpNamePriority) {
          const whitelist = this.settings.mvpNamePriority.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
          if (whitelist.length > 0) {
            priorityBosses = aliveBosses.filter(b => {
              const name = (b.name || '').toLowerCase();
              return whitelist.some(term => name.includes(term));
            });
          }
        }

        let targetPool = priorityBosses.length > 0 ? priorityBosses : aliveBosses;

        // Sort target pool based on settings
        const px = this.player ? this.player.x : 0;
        const py = this.player ? this.player.y : 0;

        if (this.settings.mvpPriorityMode === 'level_asc') {
          targetPool.sort((a, b) => (a.lv || 0) - (b.lv || 0));
        } else if (this.settings.mvpPriorityMode === 'level_desc') {
          targetPool.sort((a, b) => (b.lv || 0) - (a.lv || 0));
        } else {
          // Default: distance
          targetPool.sort((a, b) => {
            const distA = Math.sqrt((px - a.x) * (px - a.x) + (py - a.y) * (py - a.y));
            const distB = Math.sqrt((px - b.x) * (px - b.x) + (py - b.y) * (py - b.y));
            return distA - distB;
          });
        }

        const activeBoss = targetPool[0];
        if (activeBoss) {
          this.targetedMvp = true;

          // Log when a new boss is first targeted
          if (this.lastTargetedBossId !== activeBoss.id) {
            this.lastTargetedBossId = activeBoss.id;
            this.addLog('SYSTEM', `⚔️ [Auto MVP] Phát hiện Boss MVP: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (Lv.${activeBoss.lv || 1} - HP: ${Math.round((activeBoss.hp || 0) / (activeBoss.hp_max || 1) * 100)}%) -> Bắt đầu săn Boss!`);
          }

          if (this.player) {
            const dx = this.player.x - activeBoss.x;
            const dy = this.player.y - activeBoss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 40) {
              exploreCx = activeBoss.x;
              exploreCy = activeBoss.y;
              exploreRadius = 300;
              traveling = 1;
              lockPos = 0; // Force unlock to allow movement
              if (this.pollCount % 10 === 0) {
                this.addLog('SYSTEM', `⚔️ [Auto MVP] Đang di chuyển săn Boss: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (Khoảng cách: ${Math.round(dist)}m)`);
              }
            } else {
              exploreCx = this.player.x;
              exploreCy = this.player.y;
              exploreRadius = 100;
              traveling = 0;
              if (this.pollCount % 10 === 0) {
                this.addLog('SYSTEM', `⚔️ [Auto MVP] Đang tấn công Boss: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (HP: ${Math.round((activeBoss.hp || 0) / (activeBoss.hp_max || 1) * 100)}%)`);
              }
            }
          } else {
            exploreCx = activeBoss.x;
            exploreCy = activeBoss.y;
          }
        }
      }
    }

    // Clear targeted boss state and log when done
    if (!this.targetedMvp && this.lastTargetedBossId !== null) {
      this.addLog('SYSTEM', `✅ [Auto MVP] Đã tiêu diệt hoặc mất dấu Boss MVP. Quay lại hoạt động tự động.`);
      this.lastTargetedBossId = null;
    }

    // 2. Auto Zone checking (Priority 2, only runs if no MVP is being targeted)
    if (!this.targetedMvp && this.settings.autoZone && this.spots) {
      const spotsList = Object.values(this.spots);
      const targetIdx = parseInt(this.settings.targetZone) || 0;
      if (spotsList[targetIdx]) {
        const spot = spotsList[targetIdx];
        if (this.player) {
          const dx = this.player.x - spot.cx;
          const dy = this.player.y - spot.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (this.settings.lock_zone_center) {
            // Lock zone center active: walk to center and lock position
            if (dist > 30) {
              exploreCx = spot.cx;
              exploreCy = spot.cy;
              exploreRadius = 300;
              traveling = 1;
              lockPos = 0; // Force unlock to walk to center
              if (this.arrivedAtZoneCenter) {
                this.arrivedAtZoneCenter = false;
              }
              if (this.pollCount % 10 === 0) {
                this.addLog('SYSTEM', `🏃 [Tự động] Đang di chuyển đến tâm Zone: ${spot.name} để khóa vị trí (Khoảng cách: ${Math.round(dist)}m)`);
              }
            } else {
              exploreCx = this.player.x;
              exploreCy = this.player.y;
              exploreRadius = 100;
              traveling = 0;
              lockPos = 1; // Force lock at player's current position to freeze movement
              if (!this.arrivedAtZoneCenter) {
                this.arrivedAtZoneCenter = true;
                this.addLog('SYSTEM', `🔒 [Tự động] Đã đến tâm Zone: ${spot.name}, kích hoạt khóa vị trí tại chỗ.`);
              }
            }
          } else {
            // Normal Auto Zone logic
            if (dist > 90) {
              exploreCx = spot.cx;
              exploreCy = spot.cy;
              exploreRadius = 300;
              traveling = 1;
              lockPos = 0; // Force unlock to allow movement
              if (this.pollCount % 10 === 0) {
                this.addLog('SYSTEM', `🏃 [Tự động] Đang di chuyển đến Zone: ${spot.name} (Khoảng cách: ${Math.round(dist)}m)`);
              }
            } else {
              exploreCx = this.player.x;
              exploreCy = this.player.y;
              exploreRadius = 100; // Farm close when arrived
              traveling = 0;
            }
          }
        } else {
          exploreCx = spot.cx;
          exploreCy = spot.cy;
        }
      }
    }

    const payload = {
      line_uid: this.line_uid,
      session_token: this.session_token,
      manual_dir: '',
      act: 1,
      full: isFull,
      bot: this.settings.bot ? 1 : 0,
      lock_pos: lockPos,
      explore_radius: exploreRadius,
      explore_cx: exploreCx,
      explore_cy: exploreCy,
      traveling: traveling,
      auto_potion_threshold: this.settings.auto_potion_threshold,
      have_static: this.spots ? 1 : 0,
      lang: 'vi'
    };

    const d = await this.sendRequest('https://ragnalok.online/human/xhrpg_game.php', payload);

    if (d.kicked) {
      this.status = 'failed';
      this.error = 'Tài khoản bị kick hoặc đăng nhập từ thiết bị khác';
      this.addLog('ERROR', 'Tài khoản bị đăng xuất (đăng nhập từ nơi khác)');
      this.stop('failed');
      return;
    }

    if (!d.ok) {
      this.error = d.error || 'Yêu cầu game trả về thất bại';
      this.addLog('ERROR', `Lỗi: ${this.error}`);
      return;
    }

    // Save spots list for map
    if (d.spots) {
      this.spots = d.spots;
    }

    // Save bosses list
    if (d.bosses) {
      this.bosses = d.bosses;
    }

    // Update player
    const prevP = this.player;
    this.player = d.player;
    this.lastUpdate = new Date().toISOString();
    this.error = null;

    // Detect map change
    if (prevP && prevP.map !== this.player.map) {
      this.spots = null; // Force reload static zone details for the new map
      this.bosses = null; // Clear bosses list to refresh on new map
      this.settings.autoZone = false;
      this.settings.lock_zone_center = false;
      this.settings.targetZone = 0;
      
      // Save settings changes to accounts.json
      const currentAccounts = loadAccounts();
      const idx = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
      if (idx !== -1) {
        currentAccounts[idx].settings = this.settings;
        saveAccounts(currentAccounts);
      }
      this.addLog('SYSTEM', `🗺️ Bản đồ thay đổi sang Map ${this.player.map}. Đã thiết lập lại mục tiêu khu vực.`);
    }

    // Carry forward cold fields if hot-only response
    if (prevP) {
      const COLD_FIELDS = [
        'module_inventory','sniper_module_inventory','knife_module_inventory','axe_module_inventory',
        'robot_module_inventory','robot_gun_module_inventory','railgun_module_inventory',
        'armor_module_inventory','house_module_inventory','turret_module_inventory',
        'cards','eggs','treasures','treasures_qty','hardware','hardware_qty','weapon_parts','weapon_parts_qty',
        'house_parts','house_parts_qty','stat_parts','stat_parts_qty'
      ];
      for (const f of COLD_FIELDS) {
        if (this.player[f] === undefined && prevP[f] !== undefined) {
          this.player[f] = prevP[f];
        }
      }
    }

    // Process events
    if (d.events && d.events.length) {
      const filtered = d.events.filter(e =>
        e.type !== 'beam' && e.type !== 'explosion' && e.type !== 'orion' && e.type !== 'cannon' &&
        e.type !== 'lockon' && e.type !== 'tri_knife' && e.type !== 'shock_ring' && e.type !== 'sword_skill' &&
        e.type !== 'arrow' && e.type !== 'mon_atk' &&
        !(e.type === 'hit' && !(e.icon && e.icon.startsWith('✨')))
      );
      
      filtered.forEach(e => {
        if (e.msg) {
          // Clean HTML tags from messages
          const cleanMsg = e.msg.replace(/<[^>]*>/g, '');
          this.addLog(e.type, cleanMsg);

          // Check if this is a valuable loot/drop event (Cards, Eggs, Gear, Gems/Treasures)
          const isValuableLoot = (e.type === 'drop' || e.type === 'loot' || 
                                 cleanMsg.includes('Nhận được') || 
                                 cleanMsg.includes('nhận được') || 
                                 cleanMsg.startsWith('+')) &&
                                 /🎴|🥚|💎|🔮|👑|🏆|🎁|⚔️|🛡️|💍|card|egg|trang bị/i.test(cleanMsg);
                         
          if (isValuableLoot) {
            this.addLootLog(cleanMsg);
          }
        }
      });
    }

    // Execute automation
    await this.runAutomation();
  }

  async runAutomation() {
    if (!this.player) return;

    // Pause all automation tasks (upgrades, mines, arena, map warp) while hunting MVP boss
    if (this.targetedMvp) {
      return;
    }

    // TEMPORARILY DISABLED AUTOMATION (Stats, Gear, Skills, Companion, Mines)
    // We haven't developed them yet. Set to false to disable.
    const enableUpgrades = false;
    if (enableUpgrades) {
      // 1. Auto allocation of stats
      if (this.settings.autoStats && this.player.stat_pts > 0) {
      const targetStat = this.settings.statsPriority.find(s => s === 'str' || s === 'agi' || s === 'vit' || s === 'intel' || s === 'dex' || s === 'luk');
      if (targetStat) {
        const amount = this.player.stat_pts;
        this.addLog('SYSTEM', `⚡ [Tự động] Tăng ${amount} điểm vào ${targetStat.toUpperCase()}`);
        try {
          const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
            line_uid: this.line_uid,
            session_token: this.session_token,
            action: 'stat_up',
            param: targetStat,
            amount: amount
          });
          if (res.ok) {
            this.player = res.player;
            this.addLog('SUCCESS', `Tăng điểm ${targetStat.toUpperCase()} thành công`);
          } else {
            this.addLog('WARNING', `Tăng điểm thất bại: ${res.error}`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi tăng điểm: ${e.message}`);
        }
      }
    }

    // 2. Auto upgrading Gear/Armor
    if (this.settings.autoGear && (this.player.armor_lv || 0) < 50) {
      const armLv = this.player.armor_lv || 0;
      const cost = getArmorUpgradeCost(armLv);
      if ((this.player.gold || 0) >= cost.gold && (this.player.stone || 0) >= cost.stone) {
        this.addLog('SYSTEM', `🛡️ [Tự động] Nâng cấp Armor lên Lv.${armLv + 1} (Chi phí: 💰${cost.gold} 🪨${cost.stone})`);
        try {
          const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
            line_uid: this.line_uid,
            session_token: this.session_token,
            action: 'upgrade_armor'
          });
          if (res.ok) {
            this.player = res.player;
            this.addLog('SUCCESS', `Nâng cấp Armor lên Lv.${this.player.armor_lv} thành công`);
          } else {
            this.addLog('WARNING', `Nâng cấp Armor thất bại: ${res.error}`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi nâng cấp Armor: ${e.message}`);
        }
      }
    }

    // 3. Auto upgrading Skills
    if (this.settings.autoSkills && (this.player.skill_pts || 0) > 0) {
      let skills = {};
      try {
        skills = typeof this.player.skills === 'object' ? this.player.skills : JSON.parse(this.player.skills || '{}');
      } catch (err) {}

      const skillToUpgrade = this.settings.skillsPriority.find(skId => {
        const curLv = skills[skId] || 0;
        return curLv < 10 && isSkillUnlocked(skId, this.player.lv || 1, skills);
      });

      if (skillToUpgrade) {
        this.addLog('SYSTEM', `✨ [Tự động] Nâng cấp kỹ năng: ${skillToUpgrade}`);
        try {
          const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
            line_uid: this.line_uid,
            session_token: this.session_token,
            action: 'skill_up',
            skill_id: skillToUpgrade
          });
          if (res.ok) {
            this.player = res.player;
            this.addLog('SUCCESS', `Nâng cấp kỹ năng ${skillToUpgrade} thành công`);
          } else {
            this.addLog('WARNING', `Nâng cấp kỹ năng thất bại: ${res.error}`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi nâng cấp kỹ năng: ${e.message}`);
        }
      }
    }

    // 4. Auto Companions (Cat & Drone)
    if (this.settings.autoCompanion) {
      // Cat upgrade
      const catLv = this.player.cat_lv || 0;
      if (catLv < 30) {
        const cost = getCatUpgradeCost(catLv);
        if ((this.player.gold || 0) >= cost.gold && (this.player.stone || 0) >= cost.stone) {
          this.addLog('SYSTEM', `🐈 [Tự động] Nâng cấp Companion (Cat) lên Lv.${catLv + 1}`);
          try {
            const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
              line_uid: this.line_uid,
              session_token: this.session_token,
              action: 'upgrade_cat'
            });
            if (res.ok) {
              this.player = res.player;
              this.addLog('SUCCESS', `Nâng cấp Cat lên Lv.${this.player.cat_lv} thành công`);
            }
          } catch (e) {}
        }
      }

      // Drone upgrade
      const droneLv = this.player.drone_lv || 0;
      if (droneLv < 30) {
        const cost = getDroneUpgradeCost(droneLv);
        if ((this.player.gold || 0) >= cost.gold && (this.player.copper || 0) >= cost.copper) {
          this.addLog('SYSTEM', `🛸 [Tự động] Nâng cấp Drone lên Lv.${droneLv + 1}`);
          try {
            const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
              line_uid: this.line_uid,
              session_token: this.session_token,
              action: 'upgrade_drone'
            });
            if (res.ok) {
              this.player = res.player;
              this.addLog('SUCCESS', `Nâng cấp Drone lên Lv.${this.player.drone_lv} thành công`);
            }
          } catch (e) {}
        }
      }
    }

    // 5. Auto Mines management
    if (this.settings.autoMines && (this.player.house_lv || 0) >= 20) {
      const MINE_UNLOCK = [20, 40, 60, 999, 999, 999];
      let mlv = [], mor = [], mon = [];
      try {
        mlv = Array.isArray(this.player.mine_lv) ? this.player.mine_lv : JSON.parse(this.player.mine_lv || '[]');
        mor = Array.isArray(this.player.mine_ore) ? this.player.mine_ore : JSON.parse(this.player.mine_ore || '[]');
        mon = Array.isArray(this.player.mine_on) ? this.player.mine_on : JSON.parse(this.player.mine_on || '[]');
      } catch (err) {}

      // Check premium miner
      const hasPremMiner = (parseInt(this.player.premium_miner_expires) || 0) > Math.floor(Date.now() / 1000);
      if (hasPremMiner) {
        MINE_UNLOCK[3] = 20; // Unlock 4th slot at house_lv 20 with premium
      }

      for (let s = 0; s < 6; s++) {
        const unlock = MINE_UNLOCK[s];
        if (unlock >= 999 || (this.player.house_lv || 0) < unlock) continue;

        const level = mlv[s] | 0;
        const ore = mor[s] || '';
        const on = (mon[s] ?? 1) ? 1 : 0;

        // A. Build Mine
        if (level < 1) {
          const cost = getMineUpgradeCost(0);
          if ((this.player.gold || 0) >= cost.gold && (this.player.wood || 0) >= cost.wood && (this.player.stone || 0) >= cost.stone) {
            const selectOre = this.settings.defaultOre || 'stone';
            this.addLog('SYSTEM', `⛏️ [Tự động] Xây dựng mỏ khai thác tại ô ${s + 1} (${selectOre})`);
            try {
              const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
                line_uid: this.line_uid,
                session_token: this.session_token,
                action: 'mine_build',
                slot: s,
                ore: selectOre
              });
              if (res.player) {
                this.player = res.player;
                this.addLog('SUCCESS', `Xây dựng mỏ khai thác ô ${s + 1} thành công`);
              }
            } catch (e) {}
            break; // Do one mine action per poll
          }
        }
        // B. Upgrade Mine
        else if (level < 100 && level < (this.player.house_lv || 0)) {
          const cost = getMineUpgradeCost(level);
          if ((this.player.gold || 0) >= cost.gold && 
              (this.player.wood || 0) >= cost.wood && 
              (this.player.stone || 0) >= cost.stone &&
              (this.player.iron || 0) >= cost.iron &&
              (this.player.copper || 0) >= cost.copper) {
            
            this.addLog('SYSTEM', `⛏️ [Tự động] Nâng cấp mỏ khai thác ô ${s + 1} lên Lv.${level + 1}`);
            try {
              const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
                line_uid: this.line_uid,
                session_token: this.session_token,
                action: 'mine_up',
                slot: s
              });
              if (res.player) {
                this.player = res.player;
                this.addLog('SUCCESS', `Nâng cấp mỏ khai thác ô ${s + 1} thành công`);
              }
            } catch (e) {}
            break;
          }
        }
        // C. Toggle Mine On if disabled
        else if (level >= 1 && !on) {
          this.addLog('SYSTEM', `⛏️ [Tự động] Bật hoạt động mỏ khai thác ô ${s + 1}`);
          try {
            const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
              line_uid: this.line_uid,
              session_token: this.session_token,
              action: 'mine_toggle',
              slot: s
            });
            if (res.player) {
              this.player = res.player;
              this.addLog('SUCCESS', `Mỏ ô ${s + 1} hoạt động trở lại`);
            }
          } catch (e) {}
          break;
        }
      }
    }
    } // End of temporarily disabled automation

    // 6. Auto Map Warp
    if (this.settings.autoMap && Number(this.player.map) !== Number(this.settings.targetMap)) {
      const targetMapId = parseInt(this.settings.targetMap) || 1;
      const mapDef = MAP_DEFS.find(m => m.id === targetMapId);
      if (mapDef && (this.player.lv || 1) >= mapDef.req) {
        this.addLog('SYSTEM', `🗺️ [Tự động] Di chuyển sang bản đồ: ${mapDef.name}`);
        try {
          const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_warp.php', {
            line_uid: this.line_uid,
            session_token: this.session_token,
            target_map: targetMapId
          });
          if (res && res.ok) {
            this.player = res.player;
            this.addLog('SUCCESS', `Di chuyển sang bản đồ ${targetMapId} thành công`);
          } else {
            this.addLog('WARNING', `Di chuyển bản đồ thất bại: ${res.error || 'Lỗi không xác định'}`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi di chuyển bản đồ: ${e.message}`);
        }
      }
    }

    // 7. Auto Arena Mode
    if (this.settings.autoArena && this.pollCount % 150 === 0) {
      try {
        const info = await this.sendRequest('https://ragnalok.online/human/xhrpg_arena.php', {
          line_uid: this.line_uid,
          session_token: this.session_token,
          action: 'info'
        });
        if (info && info.ok && (info.free_runs || 0) > 0 && !info.in_arena) {
          const wonMonsters = (info.monsters || []).filter(m => m.won);
          if (wonMonsters.length > 0) {
            const target = wonMonsters.sort((a, b) => b.lv - a.lv)[0];
            this.addLog('SYSTEM', `🏟️ [Auto Arena] Thực hiện Skip Boss: ${target.name} (Lv.${target.lv})`);
            const skipRes = await this.sendRequest('https://ragnalok.online/human/xhrpg_arena.php', {
              line_uid: this.line_uid,
              session_token: this.session_token,
              action: 'skip',
              mid: target.mid,
              pay: 'g',
              count: 1
            });
            if (skipRes && skipRes.msg) {
              this.addLog('SUCCESS', `Skip Đấu trường thành công: ${skipRes.msg}`);
            }
          } else {
            const fightable = (info.monsters || []).filter(m => (this.player.lv || 1) >= m.lv);
            if (fightable.length > 0) {
              const target = fightable.sort((a, b) => a.lv - b.lv)[0];
              this.addLog('SYSTEM', `🏟️ [Auto Arena] Vào khiếu chiến Đấu trường Boss: ${target.name} (Lv.${target.lv})`);
              const enterRes = await this.sendRequest('https://ragnalok.online/human/xhrpg_arena.php', {
                line_uid: this.line_uid,
                session_token: this.session_token,
                action: 'enter',
                mid: target.mid,
                pay: 'g',
                count: 1
              });
              if (enterRes && enterRes.msg) {
                this.addLog('SUCCESS', `Vào Đấu trường thành công: ${enterRes.msg}`);
              }
            }
          }
        }
      } catch (err) {
        console.error(`Auto Arena error for ${this.name}:`, err);
      }
    }
  }
}

// Initialize active bots if run directly
if (require.main === module) {
  const accounts = loadAccounts();
  accounts.forEach(acc => {
    const instance = new BotInstance(acc);
    botInstances[acc.line_uid] = instance;
    instance.start();
  });
}

// Extract token helper
function getAuthToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/auth_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// Authentication middleware
function requireAuth(req, res, next) {
  const token = getAuthToken(req);
  if (!token || !userSessions[token]) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập hệ thống' });
  }
  const users = loadUsers();
  const session = userSessions[token];
  const user = users.find(u => u.id === session.userId);
  if (!user) {
    delete userSessions[token];
    return res.status(401).json({ error: 'Tài khoản người dùng không tồn tại' });
  }

  req.user = user;
  req.token = token;

  // Allow auth check and logout endpoints even if expired so UI displays correct state
  if (isUserExpired(user) && req.path !== '/api/auth/me' && req.path !== '/api/auth/logout') {
    const expiryStr = user.expiresAt ? new Date(user.expiresAt).toLocaleString('vi-VN') : '';
    return res.status(403).json({
      error: `Tài khoản đã hết hạn sử dụng (${expiryStr}). Vui lòng liên hệ Admin để gia hạn!`,
      expired: true
    });
  }

  next();
}

// Admin authorization middleware
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Quyền truy cập từ chối. Chỉ dành cho Admin.' });
    }
    next();
  });
}

// ==================== AUTH API ROUTES ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return res.status(400).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return res.status(400).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  if (isUserExpired(user)) {
    const expiryStr = user.expiresAt ? new Date(user.expiresAt).toLocaleDateString('vi-VN') : '';
    return res.status(400).json({ error: `Tài khoản đã hết hạn sử dụng vào ngày ${expiryStr}. Vui lòng liên hệ Admin để gia hạn!` });
  }

  const token = crypto.randomBytes(32).toString('hex');
  userSessions[token] = {
    userId: user.id,
    username: user.username,
    role: user.role,
    maxAccounts: user.maxAccounts || 1
  };

  res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      maxAccounts: user.maxAccounts || 1,
      expiresAt: user.expiresAt || null
    }
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const token = getAuthToken(req);
  if (token) {
    delete userSessions[token];
  }
  res.setHeader('Set-Cookie', 'auth_token=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true });
});

// Get current user info
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      maxAccounts: req.user.maxAccounts || 1,
      expiresAt: req.user.expiresAt || null
    }
  });
});

// ==================== ADMIN API ROUTES ====================

// Get all users (Admin only)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = loadUsers();
  const accounts = loadAccounts();

  const list = users.map(u => {
    const userBotCount = accounts.filter(acc => acc.userId === u.id).length;
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      maxAccounts: u.maxAccounts || 1,
      expiresAt: u.expiresAt || null,
      createdAt: u.createdAt,
      botCount: userBotCount
    };
  });
  res.json(list);
});

// Create new user (Admin only)
app.post('/api/admin/users', requireAdmin, (req, res) => {
  const { username, password, maxAccounts, days } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu Tên đăng nhập hoặc Mật khẩu' });
  }

  const users = loadUsers();
  if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại' });
  }

  const daysStr = String(days || '').trim();
  let expiresAt = null;
  if (daysStr === '1m' || daysStr === '0.00069444') {
    expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
  } else if (daysStr === '-1' || daysStr === 'unlimited') {
    expiresAt = null; // Unlimited
  } else {
    const daysNum = parseFloat(daysStr);
    if (!isNaN(daysNum) && daysNum > 0) {
      expiresAt = new Date(Date.now() + Math.round(daysNum * 86400000)).toISOString();
    } else {
      expiresAt = new Date(Date.now() + 30 * 86400000).toISOString(); // Default 30 days
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const newUser = {
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    username: username.trim(),
    passwordHash: hashPassword(password, salt),
    salt: salt,
    role: 'user',
    maxAccounts: parseInt(maxAccounts) > 0 ? parseInt(maxAccounts) : 1,
    expiresAt: expiresAt,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  res.json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      maxAccounts: newUser.maxAccounts,
      expiresAt: newUser.expiresAt,
      createdAt: newUser.createdAt,
      botCount: 0
    }
  });
});

// Update user settings/password/expiration (Admin only)
app.put('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { password, maxAccounts, extendDays, extendMinutes, expiresAt } = req.body;

  const users = loadUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  if (password) {
    const salt = crypto.randomBytes(16).toString('hex');
    users[index].salt = salt;
    users[index].passwordHash = hashPassword(password, salt);
  }

  if (maxAccounts !== undefined) {
    const parsed = parseInt(maxAccounts);
    if (isNaN(parsed) || parsed < 1) {
      return res.status(400).json({ error: 'Quota giới hạn bot không hợp lệ' });
    }
    users[index].maxAccounts = parsed;
  }

  if (extendMinutes !== undefined) {
    const addMins = parseFloat(extendMinutes);
    if (!isNaN(addMins)) {
      users[index].expiresAt = new Date(Date.now() + Math.round(addMins * 60000)).toISOString();
    }
  } else if (extendDays !== undefined) {
    const addDays = parseFloat(extendDays);
    if (!isNaN(addDays)) {
      const currentExp = users[index].expiresAt;
      const baseTime = (currentExp && new Date(currentExp) > new Date())
        ? new Date(currentExp).getTime()
        : Date.now();
      users[index].expiresAt = new Date(baseTime + Math.round(addDays * 86400000)).toISOString();
    }
  } else if (expiresAt !== undefined) {
    users[index].expiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
  }

  saveUsers(users);

  // Update live session quota if active
  Object.values(userSessions).forEach(sess => {
    if (sess.userId === userId) {
      sess.maxAccounts = users[index].maxAccounts;
    }
  });

  res.json({ success: true, user: { id: users[index].id, username: users[index].username, role: users[index].role, maxAccounts: users[index].maxAccounts } });
});

// Delete user (Admin only)
app.delete('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Không thể tự xóa tài khoản Admin đang sử dụng' });
  }

  const users = loadUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  if (filteredUsers.length === users.length) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }
  saveUsers(filteredUsers);

  // Remove and stop user's game bots
  Object.keys(botInstances).forEach(uid => {
    if (botInstances[uid].userId === userId) {
      botInstances[uid].stop();
      delete botInstances[uid];
    }
  });

  const accounts = loadAccounts();
  const filteredAccounts = accounts.filter(acc => acc.userId !== userId);
  saveAccounts(filteredAccounts);

  // Invalidate sessions
  Object.keys(userSessions).forEach(tok => {
    if (userSessions[tok].userId === userId) {
      delete userSessions[tok];
    }
  });

  res.json({ success: true });
});

// ==================== PROXY POOL ADMIN ROUTES ====================

app.get('/api/admin/proxies', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  res.json({ settings: proxyPool.getSettings(), list: proxyPool.getStats() });
});

app.post('/api/admin/proxies', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  const { label, url } = req.body;
  if (!url) return res.status(400).json({ error: 'Thiếu URL proxy' });
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('socks')) {
    return res.status(400).json({ error: 'URL proxy không hợp lệ (phải bắt đầu bằng http:// hoặc socks5://)' });
  }
  const proxy = proxyPool.addProxy(label || url, url);
  res.json({ success: true, proxy });
});

app.put('/api/admin/proxies/settings', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  const { useDirectConnection, maxBotsPerProxy } = req.body;
  const update = {};
  if (useDirectConnection !== undefined) update.useDirectConnection = Boolean(useDirectConnection);
  if (maxBotsPerProxy !== undefined) update.maxBotsPerProxy = Math.max(1, parseInt(maxBotsPerProxy) || 10);
  proxyPool.updateSettings(update);
  res.json({ success: true, settings: proxyPool.getSettings() });
});

app.put('/api/admin/proxies/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  const { id } = req.params;
  const { label, url, active } = req.body;
  const update = {};
  if (label !== undefined) update.label = label;
  if (url !== undefined) update.url = url;
  if (active !== undefined) update.active = Boolean(active);
  const result = proxyPool.updateProxy(id, update);
  if (!result) return res.status(404).json({ error: 'Proxy không tìm thấy' });
  res.json({ success: true, proxy: result });
});

app.delete('/api/admin/proxies/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  const { id } = req.params;
  proxyPool.deleteProxy(id);
  res.json({ success: true });
});

// ==================== AUTO ADD ACCOUNT BY PHPSESSID / GOOGLE LOGIN ====================

app.all('/api/add-by-phpsessid', requireAuth, async (req, res) => {
  let phpsessid = req.body.phpsessid || req.query.phpsessid || req.body.cookie || req.query.cookie;
  const customName = req.body.name || req.query.name;

  if (!phpsessid) {
    return res.status(400).json({ error: 'Thiếu PHPSESSID cookie' });
  }

  // Parse PHPSESSID if user pasted raw cookie string
  const match = String(phpsessid).match(/PHPSESSID=([^;\s]+)/i);
  if (match) phpsessid = match[1];
  phpsessid = String(phpsessid).trim();

  try {
    const response = await fetch('https://ragnalok.online/human/xhrpg_google_auth.php', {
      dispatcher: proxyPool.getDefaultDispatcher(),
      headers: {
        'cookie': `PHPSESSID=${phpsessid}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) {}

    if (!data || !data.ok || !data.player || !data.session_token) {
      if (req.method === 'GET') {
        return res.status(400).send('<h2 style="color:#ef4444; font-family:sans-serif; text-align:center; margin-top:50px;">⚠️ Mã PHPSESSID không hợp lệ hoặc chưa đăng nhập trên game! Vui lòng đăng nhập Google trên game trước.</h2>');
      }
      return res.status(400).json({ error: 'PHPSESSID không hợp lệ hoặc phiên đăng nhập trên game đã hết hạn!' });
    }

    const line_uid = String(data.player.line_uid);
    const session_token = String(data.session_token);
    const accountName = customName || data.player.name || `Google Acc (${line_uid.slice(-4)})`;

    // Check if account already exists
    if (botInstances[line_uid]) {
      const bot = botInstances[line_uid];
      if (bot.userId === req.user.id || req.user.role === 'admin') {
        bot.session_token = session_token;
        if (customName || data.player.name) bot.name = customName || data.player.name;
        const currentAccounts = loadAccounts();
        const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
        if (index !== -1) {
          currentAccounts[index].session_token = session_token;
          if (customName || data.player.name) currentAccounts[index].name = customName || data.player.name;
          saveAccounts(currentAccounts);
        }
        if (req.method === 'GET') {
          return res.send(`
            <div style="background:#0f172a; color:#fff; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
              <div style="font-size:60px; margin-bottom:10px;">🎉</div>
              <h2 style="color:#34d399; margin-bottom:10px;">CẬP NHẬT TOKEN THÀNH CÔNG!</h2>
              <p style="color:#94a3b8; font-size:16px;">Tài khoản <strong>${bot.name}</strong> đã được cập nhật Token mới.</p>
              <p style="color:#a78bfa; font-size:14px; margin-top:15px;">⏳ Đang quay về Bảng điều khiển...</p>
              <script>setTimeout(() => location.href='/', 1500);</script>
            </div>
          `);
        }
        return res.json({ success: true, name: bot.name, updated: true });
      } else {
        if (req.method === 'GET') {
          return res.status(400).send('⚠️ Tài khoản game này đã thuộc về người dùng khác!');
        }
        return res.status(400).json({ error: 'Tài khoản game này đã thuộc về người dùng khác trong hệ thống!' });
      }
    }

    // Check quota limit for non-admin users
    const userAccounts = Object.values(botInstances).filter(bot => bot.userId === req.user.id);
    const userQuota = req.user.maxAccounts || 1;
    if (req.user.role !== 'admin' && userAccounts.length >= userQuota) {
      if (req.method === 'GET') {
        return res.status(400).send(`⚠️ Bạn đã đạt giới hạn tối đa (${userQuota} bot). Vui lòng liên hệ Admin.`);
      }
      return res.status(400).json({ error: `Bạn đã đạt giới hạn tối đa (${userQuota} bot). Vui lòng liên hệ Admin để nâng Quota.` });
    }

    const newAcc = {
      name: accountName,
      line_uid,
      session_token,
      userId: req.user.id
    };

    const currentAccounts = loadAccounts();
    currentAccounts.push(newAcc);
    saveAccounts(currentAccounts);

    const bot = new BotInstance(newAcc);
    botInstances[line_uid] = bot;
    bot.start();

    if (req.method === 'GET') {
      return res.send(`
        <div style="background:#0f172a; color:#fff; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
          <div style="font-size:60px; margin-bottom:10px;">🎉</div>
          <h2 style="color:#34d399; margin-bottom:10px;">THÊM BOT THÀNH CÔNG!</h2>
          <p style="color:#94a3b8; font-size:16px;">Tài khoản <strong>${accountName}</strong> đã được thêm vào hệ thống.</p>
          <p style="color:#a78bfa; font-size:14px; margin-top:15px;">⏳ Đang quay về Bảng điều khiển...</p>
          <script>setTimeout(() => location.href='/', 1500);</script>
        </div>
      `);
    }

    res.json({ success: true, name: accountName, created: true });
  } catch (e) {
    console.error('Add by PHPSESSID error:', e.message);
    if (req.method === 'GET') return res.status(500).send('Lỗi kết nối tới máy chủ game');
    res.status(500).json({ error: 'Lỗi kết nối tới máy chủ game' });
  }
});

app.all('/api/auto-add-account', requireAuth, (req, res) => {
  const line_uid = req.body.line_uid || req.query.line_uid;
  const session_token = req.body.session_token || req.query.session_token;
  const name = req.body.name || req.query.name;

  if (!line_uid || !session_token) {
    return res.status(400).json({ error: 'Thiếu line_uid hoặc session_token' });
  }

  // Check if account already exists
  if (botInstances[line_uid]) {
    const bot = botInstances[line_uid];
    if (bot.userId === req.user.id || req.user.role === 'admin') {
      bot.session_token = session_token;
      if (name) bot.name = name;
      const currentAccounts = loadAccounts();
      const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
      if (index !== -1) {
        currentAccounts[index].session_token = session_token;
        if (name) currentAccounts[index].name = name;
        saveAccounts(currentAccounts);
      }
      if (req.method === 'GET') {
        return res.send(`
          <div style="background:#0f172a; color:#fff; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
            <div style="font-size:60px; margin-bottom:10px;">🎉</div>
            <h2 style="color:#34d399; margin-bottom:10px;">CẬP NHẬT TOKEN THÀNH CÔNG!</h2>
            <p style="color:#94a3b8; font-size:16px;">Tài khoản <strong>${bot.name}</strong> đã được cập nhật Token mới.</p>
            <p style="color:#a78bfa; font-size:14px; margin-top:15px;">⏳ Đang quay về Bảng điều khiển...</p>
            <script>setTimeout(() => location.href='/', 1500);</script>
          </div>
        `);
      }
      return res.json({ success: true, name: bot.name, updated: true });
    } else {
      if (req.method === 'GET') {
        return res.status(400).send('⚠️ Tài khoản game này đã thuộc về người dùng khác!');
      }
      return res.status(400).json({ error: 'Tài khoản game này đã thuộc về người dùng khác trong hệ thống!' });
    }
  }

  // Check quota limit for non-admin users
  const userAccounts = Object.values(botInstances).filter(bot => bot.userId === req.user.id);
  const userQuota = req.user.maxAccounts || 1;
  if (req.user.role !== 'admin' && userAccounts.length >= userQuota) {
    if (req.method === 'GET') {
      return res.status(400).send(`⚠️ Bạn đã đạt giới hạn tối đa (${userQuota} bot). Vui lòng liên hệ Admin.`);
    }
    return res.status(400).json({ error: `Bạn đã đạt giới hạn tối đa (${userQuota} bot). Vui lòng liên hệ Admin để nâng Quota.` });
  }

  const accountName = name || `Google Acc (${String(line_uid).slice(-4)})`;
  const newAcc = {
    name: accountName,
    line_uid: String(line_uid),
    session_token: String(session_token),
    userId: req.user.id
  };

  const currentAccounts = loadAccounts();
  currentAccounts.push(newAcc);
  saveAccounts(currentAccounts);

  const bot = new BotInstance(newAcc);
  botInstances[line_uid] = bot;
  bot.start();

  if (req.method === 'GET') {
    return res.send(`
      <div style="background:#0f172a; color:#fff; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
        <div style="font-size:60px; margin-bottom:10px;">🎉</div>
        <h2 style="color:#34d399; margin-bottom:10px;">THÊM BOT THÀNH CÔNG!</h2>
        <p style="color:#94a3b8; font-size:16px;">Tài khoản <strong>${accountName}</strong> đã được thêm vào hệ thống.</p>
        <p style="color:#a78bfa; font-size:14px; margin-top:15px;">⏳ Đang quay về Bảng điều khiển...</p>
        <script>setTimeout(() => location.href='/', 1500);</script>
      </div>
    `);
  }

  res.json({ success: true, name: accountName, created: true });
});

// ==================== GAME ACCOUNTS API ROUTES (Protected) ====================

app.get('/api/accounts', requireAuth, (req, res) => {
  res.setHeader('X-User-Expires-At', req.user.expiresAt || '');
  res.setHeader('X-User-Max-Accounts', req.user.maxAccounts || 1);
  const list = Object.values(botInstances)
    .filter(bot => req.user.role === 'admin' || bot.userId === req.user.id)
    .map(bot => ({
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      name: bot.name,
      userId: bot.userId,
      status: bot.status,
      clientActive: !!(bot.lastClientActive && (Date.now() - bot.lastClientActive < 12000)),
      error: bot.error,
      lastUpdate: bot.lastUpdate,
      settings: bot.settings,
      proxyInfo: proxyPool.getBotProxyInfo(bot.line_uid),
      spots: bot.spots || null,
      player: bot.player ? {
        lv: bot.player.lv,
        hp: bot.player.hp,
        hp_max: bot.player.hp_max,
        gold: bot.player.gold,
        wood: bot.player.wood,
        stone: bot.player.stone,
        iron: bot.player.iron,
        copper: bot.player.copper,
        herb: bot.player.herb,
        x: bot.player.x,
        y: bot.player.y,
        map: bot.player.map,
        armor_lv: bot.player.armor_lv,
        stat_pts: bot.player.stat_pts,
        skill_pts: bot.player.skill_pts,
        mine_lv: bot.player.mine_lv,
        house_lv: bot.player.house_lv,
        house_energy: bot.player.house_energy
      } : null
    }));
  res.json(list);
});

// Add account (Protected + Quota check)
app.post('/api/accounts', requireAuth, async (req, res) => {
  const { name, line_uid, session_token } = req.body;
  if (!name || !line_uid || !session_token) {
    return res.status(400).json({ error: 'Thiếu thông tin (Name, Line UID, Session Token)' });
  }

  // Quota Limit Check for non-admin users
  const userBotCount = Object.values(botInstances).filter(b => b.userId === req.user.id).length;
  if (req.user.role !== 'admin' && userBotCount >= (req.user.maxAccounts || 1)) {
    return res.status(400).json({
      error: `Bạn đã đạt giới hạn tối đa ${req.user.maxAccounts || 1} tài khoản game (Đang chạy ${userBotCount}/${req.user.maxAccounts || 1}). Vui lòng liên hệ Admin để nâng cấp Quota!`
    });
  }

  if (botInstances[line_uid]) {
    return res.status(400).json({ error: 'Line UID này đã tồn tại trong danh sách' });
  }

  // Create temporary bot to test credentials
  const tempBot = new BotInstance({ name, line_uid, session_token, userId: req.user.id });
  try {
    // Perform test request
    const check = await tempBot.sendRequest('https://ragnalok.online/human/xhrpg_game.php', {
      line_uid,
      session_token,
      act: 0,
      full: 0,
      bot: 1,
      lang: 'vi',
      have_static: 1
    });

    if (!check.ok) {
      return res.status(400).json({ error: check.error || 'Sai thông tin đăng nhập' });
    }

    // Save to file
    const currentAccounts = loadAccounts();
    const newAcc = {
      name,
      line_uid,
      session_token,
      userId: req.user.id,
      settings: tempBot.settings
    };
    currentAccounts.push(newAcc);
    saveAccounts(currentAccounts);

    // Initialize bot instance
    botInstances[line_uid] = tempBot;
    tempBot.player = check.player;
    tempBot.start();

    res.json({ success: true, account: newAcc });
  } catch (err) {
    res.status(400).json({ error: `Không thể kết nối đến máy chủ game: ${err.message}` });
  }
});

// Helper permission check for account actions
function checkAccountOwnership(req, res, bot) {
  if (!bot) {
    res.status(404).json({ error: 'Tài khoản không tìm thấy' });
    return false;
  }
  if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
    res.status(403).json({ error: 'Bạn không có quyền thao tác trên tài khoản game này' });
    return false;
  }
  return true;
}

// Update settings or credentials
app.put('/api/accounts/:line_uid', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  const { session_token, name, ...settings } = req.body;

  try {
    if (session_token && session_token !== bot.session_token) {
      const check = await bot.sendRequest('https://ragnalok.online/human/xhrpg_game.php', {
        line_uid,
        session_token,
        act: 0,
        full: 0,
        bot: 1,
        lang: 'vi',
        have_static: 1
      });

      if (!check.ok) {
        return res.status(400).json({ error: check.error || 'Sai Session Token mới' });
      }

      bot.session_token = session_token;
      bot.player = check.player;
      bot.error = null;
      bot.addLog('SYSTEM', 'Đã cập nhật Session Token mới thành công');
      
      if (bot.status !== 'running') {
        bot.start();
      }
    }

    if (name !== undefined) {
      bot.name = name;
    }

    if (Object.keys(settings).length > 0) {
      bot.updateSettings(settings);
    }

    const currentAccounts = loadAccounts();
    const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
    if (index !== -1) {
      currentAccounts[index].session_token = bot.session_token;
      currentAccounts[index].name = bot.name;
      currentAccounts[index].settings = bot.settings;
      saveAccounts(currentAccounts);
    }

    res.json({ success: true, settings: bot.settings, session_token: bot.session_token, name: bot.name });
  } catch (err) {
    res.status(400).json({ error: `Không thể kết nối đến máy chủ game: ${err.message}` });
  }
});

// Delete account
app.delete('/api/accounts/:line_uid', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  bot.stop();
  proxyPool.releaseBot(line_uid);
  delete botInstances[line_uid];

  const currentAccounts = loadAccounts();
  const filtered = currentAccounts.filter(acc => acc.line_uid !== line_uid);
  saveAccounts(filtered);

  res.json({ success: true });
});

// Start bot loop
app.post('/api/accounts/:line_uid/start', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;
  bot.start();
  res.json({ success: true, status: bot.status });
});

// Stop bot loop
app.post('/api/accounts/:line_uid/stop', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;
  bot.stop();
  res.json({ success: true, status: bot.status });
});

// Get logs
app.get('/api/accounts/:line_uid/logs', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;
  res.json({
    logs: bot.logs,
    lootLogs: bot.lootLogs || []
  });
});

// Get official drop logs from game server on-demand
app.get('/api/accounts/:line_uid/droplogs', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  try {
    const rawData = await bot.sendRequest('https://ragnalok.online/human/xhrpg_droplog.php', {
      line_uid: bot.line_uid,
      session_token: bot.session_token
    });

    if (rawData && rawData.ok && Array.isArray(rawData.drops)) {
      const formattedDrops = rawData.drops.map(item => {
        const actionType = item.a || '';
        const isOffline = actionType.startsWith('off_');
        
        let typeIcon = '🎁';
        let category = 'item';
        if (actionType.includes('card')) { typeIcon = '🎴'; category = 'card'; }
        else if (actionType.includes('egg')) { typeIcon = '🥚'; category = 'egg'; }
        else if (actionType.includes('module')) { typeIcon = '⚙️'; category = 'module'; }
        else if (actionType.includes('eq2')) { typeIcon = '⚔️'; category = 'equipment'; }
        else if (actionType.includes('diamond')) { typeIcon = '💎'; category = 'gem'; }

        // Format unix timestamp t (seconds) to HH:mm:ss DD/MM
        let timeStr = '';
        if (item.t) {
          const d = new Date(item.t * 1000);
          const hours = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          const secs = String(d.getSeconds()).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          timeStr = `${hours}:${mins}:${secs} ${day}/${month}`;
        }

        return {
          name: item.n || 'Vật phẩm không tên',
          quantity: item.q || 1,
          time: timeStr,
          timestamp: item.t || 0,
          isOffline,
          icon: typeIcon,
          category,
          rawAction: actionType
        };
      });

      return res.json({ ok: true, drops: formattedDrops });
    }

    res.json({ ok: true, drops: [] });
  } catch (err) {
    res.status(500).json({ error: `Không thể tải lịch sử rơi đồ: ${err.message}` });
  }
});

// Get detailed full player state
app.get('/api/accounts/:line_uid/status', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;
  res.json({
    status: bot.status,
    player: bot.player,
    error: bot.error,
    lastUpdate: bot.lastUpdate
  });
});

// Trigger manual action
app.post('/api/accounts/:line_uid/action', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const { action, param, extra } = req.body;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  try {
    let payload = {
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      action
    };
    if (param !== undefined) payload.param = param;
    if (extra && typeof extra === 'object') {
      payload = { ...payload, ...extra };
    }

    let url = 'https://ragnalok.online/human/xhrpg_upgrade.php';
    if (action === 'warp') {
      url = 'https://ragnalok.online/human/xhrpg_warp.php';
      delete payload.action;
      if (param !== undefined) {
        payload.target_map = param;
        delete payload.param;
      } else if (extra && extra.target_map !== undefined) {
        payload.target_map = extra.target_map;
      }

      if (payload.target_map !== undefined) {
        const targetMapNum = Number(payload.target_map);
        bot.updateSettings({ targetMap: targetMapNum, autoMap: true });
        const currentAccounts = loadAccounts();
        const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
        if (index !== -1) {
          currentAccounts[index].settings = bot.settings;
          saveAccounts(currentAccounts);
        }
      }
    }

    const response = await bot.sendRequest(url, payload);
    if (response.player) {
      bot.player = response.player;
      if (bot.player.map !== undefined) {
        const currentMapNum = Number(bot.player.map);
        bot.updateSettings({ targetMap: currentMapNum });
        const currentAccounts = loadAccounts();
        const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
        if (index !== -1) {
          currentAccounts[index].settings = bot.settings;
          saveAccounts(currentAccounts);
        }
      }
    }
    
    if (response.msg) {
      bot.addLog('ACTION', response.msg);
    } else if (response.error) {
      bot.addLog('ERROR', `Thao tác thất bại: ${response.error}`);
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy helper function
async function proxyRequest(req, res, targetUrl) {
  const headers = {
    'content-type': req.headers['content-type'] || 'application/x-www-form-urlencoded; charset=UTF-8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'accept': '*/*',
    'origin': 'https://ragnalok.online',
    'referer': 'https://ragnalok.online/human/',
    'connection': 'keep-alive'
  };

  try {
    let body = null;
    if (req.method === 'POST') {
      body = new URLSearchParams(req.body).toString();
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      dispatcher: proxyPool.getDefaultDispatcher()
    });

    res.status(response.status);
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json');

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('image') || contentType.includes('audio') || contentType.includes('font') || contentType.includes('octet-stream')) {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (err) {
    console.error(`Proxy error for ${targetUrl}:`, err);
    res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
}

async function fetchGameHtml(req) {
  const now = Date.now();
  const targetUrl = `https://ragnalok.online/human/index.php?_cb=${now}`;
  
  const response = await fetch(targetUrl, {
    dispatcher: proxyPool.getDefaultDispatcher(),
    headers: {
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let html = await response.text();
  
  if (!html.includes('xhrpg_canvas.js')) {
    throw new Error('Fetched HTML does not contain game scripts (likely Cloudflare block or redirect)');
  }
  
  // 1. Vá lỗi DOM: Đổi id log-list thành event-log (nếu có)
  html = html.replace('id="log-list"', 'id="event-log"');
  
  // 2. Vá lỗi DOM: Thêm login-overlay chống crash engine
  html = html.replace('</body>', '<div id="login-overlay" style="display:none"></div>\n</body>');
  
  // 3. Sửa đường dẫn canvas JS để đi qua Proxy và thêm cache buster
  html = html.replace(/src="js\/xhrpg_canvas\.js[^"]*"/, `src="/js/xhrpg_canvas.js?v=${now}"`);
  
  // 4. Inject file ngôn ngữ tiếng Việt (xhrpg_lang_vi.js) ngay sau xhrpg_canvas.js
  html = html.replace(
    /(<script src="\/js\/xhrpg_canvas\.js\?v=\d+"><\/script>)/,
    `$1\n<script src="/js/xhrpg_lang_vi.js?v=${now}"></script>`
  );

  // 5. Thay thế Script Khởi động LIFF bằng Proxy Startup Script
  const customScript = `
<script>
const BASE_URL = "/";
const CF_REGION = "VN";
const _L = true;
document.getElementById('loading-msg').textContent = 'Đang kết nối qua proxy chống ngắt kết nối...';

function startGame(player, token, offlineReward) {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('game-screen').style.display    = 'flex';
  xhrpg.init(player, BASE_URL, token);
  if (offlineReward && offlineReward.kills > 0) {
    setTimeout(() => xhrpg.showOfflineReward(offlineReward), 800);
  }
}

const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('line_uid');
const token = urlParams.get('session_token');

if (uid && token) {
  $.post('/xhrpg_game.php', {
    line_uid: uid,
    session_token: token,
    act: 1,
    full: 1,
    bot: 1,
    lang: 'vi',
    have_static: 0
  })
  .done(res => {
    const data = typeof res === 'string' ? JSON.parse(res) : res;
    if (data.ok) {
      startGame(data.player, token, data.offline_reward);
    } else {
      document.getElementById('loading-msg').textContent = 'Đăng nhập thất bại: ' + (data.error || 'Lỗi không xác định');
    }
  })
  .fail(() => {
    document.getElementById('loading-msg').textContent = 'Không thể kết nối tới máy chủ Proxy';
  });
} else {
  document.getElementById('loading-msg').textContent = 'Lỗi: Thiếu tham số line_uid hoặc session_token trên link';
}
</script>`;

  html = html.replace(/<script>[\s\S]*?LIFF_ID[\s\S]*?<\/script>/, customScript);
  
  return html;
}

async function fetchGameLoginHtml(req) {
  const now = Date.now();
  const targetUrl = `https://ragnalok.online/human/index.php?_cb=${now}`;
  
  const response = await fetch(targetUrl, {
    dispatcher: proxyPool.getDefaultDispatcher(),
    headers: {
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let html = await response.text();
  
  if (!html.includes('xhrpg_canvas.js')) {
    throw new Error('Fetched HTML does not contain game scripts (likely Cloudflare block or redirect)');
  }
  
  // 1. Fix DOM: Hide loading screen and show login overlay
  html = html.replace('id="log-list"', 'id="event-log"');
  html = html.replace('id="loading-screen"', 'id="loading-screen" style="display:none;"');
  html = html.replace('id="login-overlay" style="display:none"', 'id="login-overlay" style="display:flex; z-index:999999;"');
  
  html = html.replace(/src="js\/xhrpg_canvas\.js[^"]*"/, `src="/js/xhrpg_canvas.js?v=${now}"`);
  html = html.replace(
    /(<script src="\/js\/xhrpg_canvas\.js\?v=\d+"><\/script>)/,
    `$1\n<script src="/js/xhrpg_lang_vi.js?v=${now}"></script>`
  );

  // 2. Inject Head Guard Script
  const headGuard = `
<script>
window.ageGate = function() { return true; };
window.liff = {
  init: function() { return Promise.resolve(); },
  isLoggedIn: function() { return false; },
  login: function() {},
  logout: function() {}
};
(function() {
  const _origParse = JSON.parse;
  JSON.parse = function(text, reviver) {
    if (typeof text === 'string' && text.trim().startsWith('<')) {
      return { ok: false, error: 'Chưa đăng nhập' };
    }
    return _origParse(text, reviver);
  };
})();
</script>`;

  html = html.replace('<head>', '<head>\n' + headGuard);

  // 3. Inject Token Sniffer & Login Script
  const loginProxyScript = `
<script>
const BASE_URL = "/";
const CF_REGION = "VN";
const _L = true;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('login-overlay').style.display = 'flex';
  if (window.xhrpg && xhrpg.startDemo) {
    xhrpg.startDemo('/');
  }
});

(function() {
  let captured = false;
  function checkAndCapture(uid, token, name) {
    if (captured || !uid || !token || uid === 'demo') return;
    captured = true;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.95); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px; color:#fff;';
    loadingDiv.innerHTML = '<div style="font-size:48px; margin-bottom:12px;">⏳</div><h3 style="color:#a78bfa;">Đang lưu token và thêm tài khoản vào Manager...</h3>';
    document.body.appendChild(loadingDiv);

    fetch('/api/auto-add-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_uid: uid,
        session_token: token,
        name: name || ('Google Acc (' + String(uid).slice(-4) + ')')
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        loadingDiv.innerHTML = '<div style="font-size:48px; margin-bottom:12px;">❌</div><h3 style="color:#ef4444;">Lỗi: ' + data.error + '</h3><button onclick="location.href=\\'/\\'" style="margin-top:15px; padding:10px 20px; background:#7c3aed; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Quay lại Bảng điều khiển</button>';
      } else {
        loadingDiv.innerHTML = '<div style="font-size:60px; margin-bottom:12px;">🎉</div><h2 style="color:#34d399; margin-bottom:8px;">TỰ ĐỘNG LẤY TOKEN THÀNH CÔNG!</h2><p style="color:#94a3b8; font-size:15px;">' + (data.updated ? 'Đã cập nhật Token mới' : 'Đã thêm tài khoản mới') + ': <strong style="color:#fff;">' + (data.name || name || uid) + '</strong></p><p style="color:#a78bfa; font-size:13px; margin-top:12px;">⏳ Đang chuyển về Bảng điều khiển trong 1.5 giây...</p>';
        setTimeout(() => { window.location.href = '/'; }, 1500);
      }
    })
    .catch(err => {
      loadingDiv.innerHTML = '<div style="font-size:48px; margin-bottom:12px;">❌</div><h3 style="color:#ef4444;">Lỗi kết nối tới máy chủ Manager</h3><button onclick="location.href=\\'/\\'" style="margin-top:15px; padding:10px 20px; background:#7c3aed; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Quay lại Bảng điều khiển</button>';
    });
  }

  window.startGame = function(player, token, offlineReward) {
    if (player && player.line_uid && token) {
      checkAndCapture(player.line_uid, token, player.name);
    }
  };

  const checkJQuery = setInterval(() => {
    if (window.$ && $.post) {
      clearInterval(checkJQuery);
      const origPost = $.post;
      $.post = function(url, data, ...rest) {
        if (data && typeof data === 'object' && data.line_uid && data.session_token) {
          checkAndCapture(data.line_uid, data.session_token, data.name);
        }
        return origPost.apply(this, [url, data, ...rest]);
      };
    }
  }, 100);
})();
</script>`;

  html = html.replace(/<script>[\s\S]*?LIFF_ID[\s\S]*?<\/script>/, loginProxyScript);
  return html;
}

// Local game client routes (Protected)
app.get('/login-helper', requireAuth, async (req, res) => {
  try {
    const html = await fetchGameLoginHtml(req);
    res.send(html);
  } catch (e) {
    console.error('Fetch Login Helper HTML error:', e.message);
    res.status(500).send('<h2 style="color:#ef4444; font-family:sans-serif; text-align:center; margin-top:50px;">⚠️ Không thể kết nối tới máy chủ game để lấy token!</h2>');
  }
});

app.get('/play', requireAuth, async (req, res) => {
  const uid = req.query.line_uid;
  if (uid && botInstances[uid]) {
    if (req.user.role !== 'admin' && botInstances[uid].userId !== req.user.id) {
      return res.status(403).send('<h2 style="color:#ef4444; font-family:sans-serif; text-align:center; margin-top:50px;">⚠️ Bạn không có quyền truy cập tài khoản game này!</h2>');
    }
  }
  try {
    const html = await fetchGameHtml(req);
    res.send(html);
  } catch (e) {
    console.error('Fetch HTML error:', e.message);
    // Tạm fallback về file tĩnh nếu server gốc lỗi
    let fallback = fs.readFileSync(path.join(__dirname, 'play.html'), 'utf8');
    fallback = fallback.replace(/\?v=\d+/g, `?v=${Date.now()}`);
    res.send(fallback);
  }
});

// Asset Cache Map
const assetCache = {};

async function fetchGameAsset(urlPath) {
  const now = Date.now();
  // 30 mins cache to balance between real-time updates and performance
  if (assetCache[urlPath] && (now - assetCache[urlPath].time < 1800000)) {
    return assetCache[urlPath].data;
  }
  
  // Thêm cache-buster để tránh tải nhầm bản cũ từ Cloudflare Cache của server game
  const targetUrl = `https://ragnalok.online/human${urlPath}?_cb=${now}`;
  const response = await fetch(targetUrl, {
    dispatcher: proxyPool.getDefaultDispatcher(),
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'referer': 'https://ragnalok.online/human/'
    }
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let text = await response.text();
  
  if (text && text.trim().startsWith('<')) {
    throw new Error(`Fetched asset ${urlPath} is HTML, not JavaScript (likely blocked by Cloudflare or redirected)`);
  }
  
  // Inject bypass into main game engine file
  if (urlPath === '/js/xhrpg_canvas.js') {
    const patchTarget = `if (_pollStopped || _inflight) return;`;
    const bypassCode = `if (_pollStopped || _inflight) return;\n    _lastInputAt = Date.now(); // Bypass idle timeout\n    _tabHiddenAt = 0; // Bypass hidden tab timeout`;
    
    if (text.includes(patchTarget)) {
      text = text.replace(patchTarget, bypassCode);
    }
  }
  
  assetCache[urlPath] = { time: now, data: text };
  return text;
}

app.get('/js/xhrpg_canvas.js', async (req, res) => {
  try {
    const data = await fetchGameAsset('/js/xhrpg_canvas.js');
    res.set({
      'Cache-Control': 'public, max-age=1800',
      'Content-Type': 'application/javascript; charset=utf-8'
    });
    res.send(data);
  } catch (e) {
    console.error('Fetch canvas error:', e.message);
    res.sendFile(path.join(__dirname, 'xhrpg_canvas.js')); // fallback
  }
});

app.get('/js/xhrpg_lang_vi.js', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=1800',
    'Content-Type': 'application/javascript; charset=utf-8'
  });
  res.sendFile(path.join(__dirname, 'xhrpg_lang_vi.js'));
});

app.get('/js/jquery-3.6.0.min.js', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=31536000',
    'ETag': 'jquery-3.6.0-v1'
  });
  res.sendFile(path.join(__dirname, 'jquery-3.6.0.min.js'));
});

app.get('/js/sdk.js', async (req, res) => {
  try {
    const data = await fetchGameAsset('/js/sdk.js');
    res.set({
      'Cache-Control': 'public, max-age=1800',
      'Content-Type': 'application/javascript; charset=utf-8'
    });
    res.send(data);
  } catch (e) {
    console.error('Fetch sdk error:', e.message);
    res.sendFile(path.join(__dirname, 'sdk.js'));
  }
});

// Proxy PHP endpoints
app.all('/xhrpg_*.php', async (req, res) => {
  const targetUrl = `https://ragnalok.online/human${req.originalUrl}`;
  
  // Track client activity to pause bot loop
  const uid = req.body.line_uid || req.query.line_uid;
  if (uid && botInstances[uid]) {
    botInstances[uid].lastClientActive = Date.now();
  }
  
  const startTime = Date.now();
  console.log(`[Proxy Req Start] ${req.method} ${req.originalUrl} | uid: ${uid || 'N/A'}`);
  try {
    await proxyRequest(req, res, targetUrl);
    console.log(`[Proxy Req Success] ${req.method} ${req.originalUrl} | Time: ${Date.now() - startTime}ms`);
  } catch (err) {
    console.log(`[Proxy Req Error] ${req.method} ${req.originalUrl} | Error: ${err.message} | Time: ${Date.now() - startTime}ms`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Lỗi máy chủ trung gian (Proxy failed)', details: err.message });
    }
  }
});

// Redirect assets directly to the official game CDN to prevent proxy lag and connection queuing
app.all('/assets/*', (req, res) => {
  console.log(`[Redirect Asset] ${req.originalUrl}`);
  res.redirect(`https://ragnalok.online/human${req.originalUrl}`);
});

// Redirect styles directly to the official game CDN to prevent proxy lag and connection queuing
app.all('/css/*', (req, res) => {
  console.log(`[Redirect CSS] ${req.originalUrl}`);
  res.redirect(`https://ragnalok.online/human${req.originalUrl}`);
});

// Health check endpoint for cron-job.org to prevent server from sleeping
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Serve public static folder fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Ragnalok Headless Dashboard running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

module.exports = {
  tierGold,
  tierRes,
  _upgCostMult,
  getArmorUpgradeCost,
  getCatUpgradeCost,
  getDroneUpgradeCost,
  getMineUpgradeCost
};
