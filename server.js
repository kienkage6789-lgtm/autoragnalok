const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const crypto = require('crypto');
const { fetch, Agent, ProxyAgent } = require('undici');
const AdmZip = require('adm-zip');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, Nginx, Cloudflare, etc.)


// ==================== PROXY POOL ====================
const PROXIES_FILE = path.join(__dirname, 'proxies.json');

class ProxyPool {
  static parseProxyInput(url, type, label) {
    if (!url) throw new Error('Thiếu URL proxy');
    url = url.trim();
    const proxyType = (type === 'socks5') ? 'socks5' : 'http';
    let newUrl = url;
    let newLabel = label;

    // Auto-parse raw proxy format (IP:PORT:USER:PASS or IP:PORT)
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://') && !newUrl.startsWith('socks')) {
      const parts = newUrl.split(':');
      if (parts.length === 4) {
        const [ip, port, user, pass] = parts;
        newUrl = `${proxyType}://${user}:${pass}@${ip}:${port}`;
        if (!newLabel) {
          newLabel = `${ip}:${port}`;
        }
      } else if (parts.length === 2) {
        const [ip, port] = parts;
        newUrl = `${proxyType}://${ip}:${port}`;
        if (!newLabel) {
          newLabel = `${ip}:${port}`;
        }
      } else {
        throw new Error('Định dạng proxy không hợp lệ. Vui lòng nhập http://..., socks5://... hoặc dạng IP:PORT:USER:PASS hoặc IP:PORT');
      }
    }

    if (!newLabel) {
      try {
        const parsed = new URL(newUrl);
        newLabel = parsed.host;
      } catch (e) {
        newLabel = newUrl;
      }
    }

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://') && !newUrl.startsWith('socks')) {
      throw new Error('URL proxy không hợp lệ (phải bắt đầu bằng http:// hoặc socks5://)');
    }

    return { url: newUrl, label: newLabel };
  }

  constructor() {
    this._settings = { useDirectConnection: true, maxBotsPerProxy: 10 };
    this._proxies = [];
    this._assignments = {}; // line_uid -> proxy_id | 'direct'
    this._agents = {};      // proxy_id -> ProxyAgent instance
    this._directAgent = new Agent({
      connect: { timeout: 5000 },
      keepAliveTimeout: 10000,
      keepAliveMaxTimeout: 30000,
      pipelining: 1,
      connections: 4,              // Giảm từ 100 xuống 4 để tiết kiệm RAM tối đa
    });
    this._load();

    // Start periodic proxy recovery loop
    // Checks inactive proxies every 3 minutes (180 seconds)
    setInterval(() => {
      this.checkAndRecoverProxies().catch(err => {
        console.error('[Proxy recovery interval error]:', err.message);
      });
    }, 3 * 60 * 1000);
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
      connect: { timeout: 5000 },
      keepAliveTimeout: 10000,
      keepAliveMaxTimeout: 30000,
      pipelining: 1,
      connections: 2,              // Mỗi proxy phục vụ 1 bot, đặt 2 kết nối để tối ưu triệt để bộ nhớ RAM
    });
  }

  async testProxyConnection(url) {
    const start = Date.now();
    let dispatcher;
    if (url === 'direct') {
      dispatcher = this._directAgent;
    } else {
      dispatcher = this._createAgent(url);
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout
    
    try {
      const response = await fetch('https://ragnalok.online/human/index.php', {
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        dispatcher,
        signal: controller.signal
      });
      return response.ok;
    } catch (e) {
      return false;
    } finally {
      clearTimeout(timeout);
      if (url !== 'direct') {
        try { dispatcher.destroy(); } catch (e) {}
      }
    }
  }

  async checkAndRecoverProxies() {
    const inactiveProxies = this._proxies.filter(p => !p.active);
    if (inactiveProxies.length === 0) return;

    const counts = this._getCounts();
    const directCount = counts['direct'] || 0;
    const maxDirect = this._settings.maxBotsPerProxy || 10;
    const isCongested = directCount > maxDirect;

    console.log(`[Proxy Health Check] Direct: ${directCount}/${maxDirect} bots. Congested: ${isCongested}`);

    let recoveredAny = false;
    for (const p of inactiveProxies) {
      console.log(`[Proxy Health Check] Testing inactive proxy "${p.label}"...`);
      const isWorking = await this.testProxyConnection(p.url);
      if (isWorking) {
        console.log(`[Proxy Health Check] Proxy "${p.label}" has recovered! Re-enabling...`);
        this.updateProxy(p.id, { active: true });
        recoveredAny = true;
      }
    }

    if (recoveredAny) {
      console.log(`[Proxy Health Check] Proxy pool updated. Triggering load rebalancing...`);
      this.rebalance();
    }
  }

  rebalance() {
    const activeProxies = this._proxies.filter(p => p.active && p.url);
    const slots = [];
    if (this._settings.useDirectConnection) slots.push('direct');
    for (const p of activeProxies) slots.push(p.id);

    if (slots.length === 0) return;

    let accounts;
    try {
      accounts = loadAccounts();
    } catch (e) {
      console.error('[Rebalance] Failed to load accounts:', e.message);
      return;
    }

    // Filter bots using Auto mode (isManualProxy !== true)
    const autoBots = accounts.filter(acc => !acc.isManualProxy);
    if (autoBots.length === 0) return;

    // Count current load for manual assignments
    const counts = { direct: 0 };
    for (const s of slots) counts[s] = 0;
    const manualBots = accounts.filter(acc => acc.isManualProxy);
    for (const acc of manualBots) {
      const slot = this._assignments[acc.line_uid] || acc.proxyId || 'direct';
      if (counts[slot] !== undefined) counts[slot]++;
    }

    // Release old assignments for auto bots in RAM
    for (const acc of autoBots) {
      delete this._assignments[acc.line_uid];
    }

    const rebalanceLogs = [];
    // Allocate auto bots to slots with the least current bot count (Round-Robin/Least-Loaded)
    for (const acc of autoBots) {
      slots.sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
      const chosenSlot = slots[0];
      const oldProxyId = acc.proxyId;

      this._assignments[acc.line_uid] = chosenSlot;
      counts[chosenSlot] = (counts[chosenSlot] || 0) + 1;
      acc.proxyId = chosenSlot;

      if (typeof botInstances !== 'undefined' && botInstances[acc.line_uid]) {
        botInstances[acc.line_uid].proxyId = chosenSlot;
      }

      if (oldProxyId !== chosenSlot) {
        rebalanceLogs.push(`${acc.name || acc.line_uid}: ${oldProxyId} -> ${chosenSlot}`);
      }
    }

    try {
      saveAccounts(accounts);
      if (rebalanceLogs.length > 0) {
        console.log(`[Proxy Rebalance] Successfully rebalanced ${rebalanceLogs.length} bots:\n` + rebalanceLogs.join('\n'));
      }
    } catch (e) {
      console.error('[Rebalance] Failed to save accounts:', e.message);
    }
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
  assignBot(line_uid, preferredProxyId) {
    if (this._assignments[line_uid]) return this._assignments[line_uid];
    const max = this._settings.maxBotsPerProxy || 10;
    const counts = this._getCounts();

    // Check preferred proxy first
    if (preferredProxyId) {
      if (preferredProxyId === 'direct') {
        this._assignments[line_uid] = 'direct';
        return 'direct';
      }
      const found = this._proxies.find(p => p.id === preferredProxyId && p.active && p.url);
      if (found) {
        this._assignments[line_uid] = preferredProxyId;
        return preferredProxyId;
      }
    }

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

  forceAssignBot(line_uid, proxyId) {
    if (proxyId === 'direct') {
      this._assignments[line_uid] = 'direct';
    } else if (proxyId === 'auto') {
      delete this._assignments[line_uid];
      this.assignBot(line_uid);
    } else {
      const found = this._proxies.find(p => p.id === proxyId && p.active && p.url);
      if (found) {
        this._assignments[line_uid] = proxyId;
      } else {
        delete this._assignments[line_uid];
        this.assignBot(line_uid);
      }
    }
    return this._assignments[line_uid];
  }

  failoverAssignment(line_uid, failedProxyId) {
    if (failedProxyId && failedProxyId !== 'direct') {
      const p = this._proxies.find(x => x.id === failedProxyId);
      if (p) {
        p.errorCount = (p.errorCount || 0) + 1;
        if (p.errorCount >= 3) {
          p.active = false;
          try { if (this._agents[failedProxyId]) this._agents[failedProxyId].destroy(); } catch (e) {}
          delete this._agents[failedProxyId];
          this._save();
          console.log(`Proxy ${p.label} has been deactivated due to consecutive failures.`);
        }
      }
    }
    delete this._assignments[line_uid];
    return this.assignBot(line_uid);
  }

  resetErrorCount(id) {
    if (id && id !== 'direct' && id !== 'auto') {
      const p = this._proxies.find(x => x.id === id);
      if (p) {
        p.errorCount = 0;
      }
    }
  }

  recordProxyFailure(id) {
    if (id && id !== 'direct' && id !== 'auto') {
      const p = this._proxies.find(x => x.id === id);
      if (p) {
        p.errorCount = (p.errorCount || 0) + 1;
        console.log(`[Proxy Failure Recorded] Proxy ${p.label} errorCount: ${p.errorCount}/3`);
        if (p.errorCount >= 3) {
          p.active = false;
          try { if (this._agents[id]) this._agents[id].destroy(); } catch (e) {}
          delete this._agents[id];
          this._save();
          console.log(`Proxy ${p.label} has been deactivated due to consecutive failures (recorded globally).`);
          this._reassignFrom(id);
        }
      }
    }
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
      if (this._assignments[uid] === proxyId) {
        delete this._assignments[uid];
        const newAssigned = this.assignBot(uid);
        
        if (typeof botInstances !== 'undefined' && botInstances[uid]) {
          botInstances[uid].proxyId = newAssigned;
          
          try {
            const currentAccounts = loadAccounts();
            const index = currentAccounts.findIndex(acc => acc.line_uid === uid);
            if (index !== -1) {
              currentAccounts[index].proxyId = newAssigned;
              saveAccounts(currentAccounts);
            }
          } catch (e) {
            console.error('Error saving accounts during proxy reassignment:', e.message);
          }
        }
      }
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
      if (p.active) {
        p.errorCount = 0;
      }
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

// ==================== MONSTER MASTERS CACHE & TRANSLATION ====================
const MON_MASTERS_CACHE_FILE = path.join(__dirname, 'mon_masters_cache.json');
let viDict = {};
try {
  const langPath = path.join(__dirname, 'xhrpg_lang_vi.js');
  if (fs.existsSync(langPath)) {
    const fakeWindow = { XHRPG_I18N: {} };
    const code = fs.readFileSync(langPath, 'utf8');
    const fn = new Function('window', code);
    fn(fakeWindow);
    viDict = fakeWindow.XHRPG_I18N.vi || {};
  }
} catch(e) {
  console.error('Failed to load xhrpg_lang_vi.js dictionary:', e.message);
}

Object.assign(viDict, {
  'วัตถุดิบสำหรับยานบิน': 'Nguyên liệu phi thuyền',
  'วัตถุดิบสำหรับอาวุธ/มีดสั้น': 'Nguyên liệu vũ khí/dao găm',
  'วัตถุดิบสำหรับมีดสั้น': 'Nguyên liệu dao găm',
  'วัตถุดิบสำหรับยา': 'Nguyên liệu chế thuốc',
  'ตีบวกโมดูล (ทุกระดับ)': 'Cường hóa Module (mọi cấp)',
  'ตีบวกโมดูล +6 ขึ้นไป': 'Cường hóa Module +6 trở lên',
  'ตีบวกโมดูล +12 ขึ้นไป': 'Cường hóa Module +12 trở lên',
  'ใช้บริจาคอัพเลเวลกิล': 'Cống hiến nâng cấp Guild',
  'ขุดเจอตอนเก็บเกี่ยวผัก': 'Khai thác từ nông trại',
  'เพชรฟ้า': 'Kim cương xanh',
  'เพชรแดง': 'Kim cương đỏ',
  'เพชรเขียว': 'Kim cương lục',
  'ไม้': 'Gỗ',
  'หิน': 'Đá',
  'เหล็ก': 'Sắt',
  'ทองแดง': 'Đồng',
  'สมุนไพร': 'Thảo dược'
});

function translateThaiText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // 1. Exact match lookup
  if (viDict[text]) return viDict[text];
  
  let translated = text;
  
  // 2. Perform word/phrase translation using keys of viDict
  if (!global.sortedViKeys) {
    global.sortedViKeys = Object.keys(viDict)
      .filter(k => k.trim().length > 1 && /[\u0e00-\u0e7f]/.test(k)) // Thai characters only
      .sort((a, b) => b.length - a.length); // Longest first to avoid partial replacements
  }
  
  for (const key of global.sortedViKeys) {
    if (translated.includes(key)) {
      translated = translated.split(key).join(viDict[key]);
    }
  }
  
  // 3. Additional common replacements for combat logs & market items if still containing Thai
  const commonReplacements = [
    { raw: 'วัตถุดิบสำหรับยานบิน', val: 'Nguyên liệu phi thuyền' },
    { raw: 'วัตถุดิบสำหรับอาวุธ/มีดสั้น', val: 'Nguyên liệu vũ khí/dao găm' },
    { raw: 'วัตถุดิบสำหรับมีดสั้น', val: 'Nguyên liệu dao găm' },
    { raw: 'วัตถุดิบสำหรับยา', val: 'Nguyên liệu chế thuốc' },
    { raw: 'ตีบวกโมดูล (ทุกระดับ)', val: 'Cường hóa Module (mọi cấp)' },
    { raw: 'ตีบวกโมดูล +6 ขึ้นไป', val: 'Cường hóa Module +6 trở lên' },
    { raw: 'ตีบวกโมดูล +12 ขึ้นไป', val: 'Cường hóa Module +12 trở lên' },
    { raw: 'ใช้บริจาคอัพเลเวลกิล', val: 'Cống hiến nâng cấp Guild' },
    { raw: 'ขุดเจอตอนเก็บเกี่ยวผัก', val: 'Khai thác từ nông trại' },
    { raw: 'เพชรฟ้า', val: 'Kim cương xanh' },
    { raw: 'เพชรแดง', val: 'Kim cương đỏ' },
    { raw: 'เพชรเขียว', val: 'Kim cương lục' },
    { raw: 'ไม้', val: 'Gỗ' },
    { raw: 'หิน', val: 'Đá' },
    { raw: 'เหล็ก', val: 'Sắt' },
    { raw: 'ทองแดง', val: 'Đồng' },
    { raw: 'สมุนไพร', val: 'Thảo dược' },
    { raw: 'ได้รับ', val: 'Nhận được' },
    { raw: 'ซ้ำ', val: 'trùng' },
    { raw: 'ดื่มยา', val: 'Bơm thuốc' },
    { raw: 'ฟื้นฟู', val: 'Hồi phục' },
    { raw: 'หลบหลีก', val: 'Né' },
    { raw: 'หลบ', val: 'Né' },
    { raw: 'เป้าหมาย', val: 'Mục tiêu' },
    { raw: 'สำเร็จ', val: 'thành công' },
    { raw: 'ล้มเหลว', val: 'thất bại' },
    { raw: 'ยานบินผลิต', val: 'Phi thuyền sản xuất' },
    { raw: 'เลเวลเพิ่มเป็น', val: 'Lv tăng thành' },
    { raw: 'เพิ่มเป็น', val: 'tăng thành' },
    { raw: 'ระดับ', val: 'Bậc' },
    { raw: 'กล่องสุ่มไข่', val: 'Hộp trứng' },
    { raw: 'กล่องไข่', val: 'Hộp trứng' }
  ];
  
  for (const rep of commonReplacements) {
    if (translated.includes(rep.raw)) {
      translated = translated.split(rep.raw).join(rep.val);
    }
  }
  
  return translated;
}

let monMastersCache = {};
if (fs.existsSync(MON_MASTERS_CACHE_FILE)) {
  try {
    monMastersCache = JSON.parse(fs.readFileSync(MON_MASTERS_CACHE_FILE, 'utf8')) || {};
  } catch(e) {}
}

function processMonMasters(rawMasters) {
  if (!rawMasters || typeof rawMasters !== 'object') return;
  let updated = false;
  for (const mid in rawMasters) {
    const mm = rawMasters[mid];
    if (!mm) continue;
    const origName = mm.n || mm.name || '';
    const translatedName = viDict[origName] || origName;
    const cleanEntry = {
      n: translatedName,
      orig_n: origName,
      e: mm.e || '👾',
      lv: parseInt(mm.lv) || 1,
      cs: (mm.cs || 'str').toLowerCase(),
      c: mm.c || '#ef4444'
    };
    monMastersCache[mid] = cleanEntry;
    updated = true;
  }
  if (updated) {
    try {
      fs.writeFileSync(MON_MASTERS_CACHE_FILE, JSON.stringify(monMastersCache, null, 2), 'utf8');
    } catch(e) {}
  }
}

// ==================== MAPS & SPOTS CACHE & SYNC ENGINE ====================
const MAPS_CACHE_FILE = path.join(__dirname, 'maps_cache.json');
const SPOTS_CACHE_FILE = path.join(__dirname, 'spots_cache.json');

const DEFAULT_MAP_DEFS = [
  { id: 1, name: 'Thung lũng Trung tâm',  emoji: '🌿', req: 1  },
  { id: 2, name: 'Sa mạc Vĩnh hằng',      emoji: '🏜️', req: 25 },
  { id: 3, name: 'Vùng đất Băng giá',     emoji: '❄️', req: 40 },
  { id: 4, name: 'Đấu trường Arena (PVP)', emoji: '⚔️', req: 20 },
  { id: 5, name: 'Tàn tích Cổ đại',      emoji: '🏛️', req: 55 },
  { id: 6, name: 'Núi lửa Sôi trào',      emoji: '🌋', req: 70 },
];

let mapsCache = [];
let spotsCache = {}; // { [mapId]: { [spotId]: { id, name, lv, ... } } }
let lastMapSyncAt = null;

function loadMapsAndSpotsCache() {
  if (fs.existsSync(MAPS_CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(MAPS_CACHE_FILE, 'utf8'));
      if (data && Array.isArray(data.maps) && data.maps.length > 0) {
        mapsCache = data.maps;
        lastMapSyncAt = data.lastSyncedAt || null;
      }
    } catch(e) {}
  }
  if (!mapsCache.length) {
    mapsCache = [...DEFAULT_MAP_DEFS];
  }

  if (fs.existsSync(SPOTS_CACHE_FILE)) {
    try {
      spotsCache = JSON.parse(fs.readFileSync(SPOTS_CACHE_FILE, 'utf8')) || {};
    } catch(e) {}
  }
}
loadMapsAndSpotsCache();

function saveMapsCache() {
  try {
    fs.writeFileSync(MAPS_CACHE_FILE, JSON.stringify({
      maps: mapsCache,
      lastSyncedAt: lastMapSyncAt
    }, null, 2), 'utf8');
  } catch(e) {}
}

function saveSpotsCache() {
  try {
    fs.writeFileSync(SPOTS_CACHE_FILE, JSON.stringify(spotsCache, null, 2), 'utf8');
  } catch(e) {}
}

function getMapDefs() {
  return (mapsCache && mapsCache.length > 0) ? mapsCache : DEFAULT_MAP_DEFS;
}

async function syncMapsAndZonesFromGame() {
  let updatedMapsCount = 0;
  let updatedSpotsCount = 0;

  // Try to auto-download the latest xhrpg_canvas.js from the game server
  try {
    console.log('🔄 Downloader: Fetching latest xhrpg_canvas.js from game server...');
    const now = Date.now();
    const targetUrl = `https://ragnalok.online/human/js/xhrpg_canvas.js?_cb=${now}`;
    const response = await fetch(targetUrl, {
      dispatcher: proxyPool.getDefaultDispatcher(),
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://ragnalok.online/human/'
      }
    });
    if (response.ok) {
      const code = await response.text();
      if (code && !code.trim().startsWith('<')) {
        const canvasPath = path.join(__dirname, 'xhrpg_canvas.js');
        fs.writeFileSync(canvasPath, code, 'utf8');
        console.log('✅ Downloader: Updated local xhrpg_canvas.js on disk.');
      }
    }
  } catch(e) {
    console.error('❌ Downloader: Failed to auto-download latest game script:', e.message);
  }

  // 1. Parse maps from xhrpg_canvas.js if present
  try {
    const canvasPath = path.join(__dirname, 'xhrpg_canvas.js');
    if (fs.existsSync(canvasPath)) {
      const code = fs.readFileSync(canvasPath, 'utf8');
      const match = code.match(/MAP_DEFS\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
      if (match && match[1]) {
        const rawItems = match[1].match(/\{[^}]+\}/g);
        if (rawItems && rawItems.length > 0) {
          const mapEmojiMap = { 1: '🌿', 2: '🏜️', 3: '❄️', 4: '⚔️', 5: '🏛️', 6: '🌋', 7: '🏔️', 8: '🏰' };
          rawItems.forEach(itemStr => {
            try {
              const idMatch = itemStr.match(/id\s*:\s*(\d+)/);
              const nameMatch = itemStr.match(/name\s*:\s*['"]([^'"]+)['"]/);
              const emojiMatch = itemStr.match(/emoji\s*:\s*['"]([^'"]+)['"]/);
              const reqMatch = itemStr.match(/req\s*:\s*(\d+)/);
              if (idMatch) {
                const id = parseInt(idMatch[1]);
                const rawName = nameMatch ? nameMatch[1] : `Bản đồ #${id}`;
                const translatedName = viDict[rawName] || viDict[`${emojiMatch ? emojiMatch[1] : ''} ${rawName}`] || rawName;
                const emoji = emojiMatch ? emojiMatch[1] : (mapEmojiMap[id] || '🗺️');
                const req = reqMatch ? parseInt(reqMatch[1]) : 1;

                const existing = mapsCache.find(m => m.id === id);
                if (!existing) {
                  mapsCache.push({ id, name: translatedName, emoji, req });
                  updatedMapsCount++;
                } else {
                  existing.name = translatedName;
                  existing.emoji = emoji;
                  existing.req = req;
                }
              }
            } catch(err) {}
          });
        }
      }
    }
  } catch(e) {
    console.error('Error parsing MAP_DEFS from game script:', e.message);
  }

  mapsCache.sort((a, b) => a.id - b.id);
  lastMapSyncAt = new Date().toISOString();
  saveMapsCache();

  // 2. Save current active spots from memory to spotsCache & reset static flag for all active bots
  for (const uid in botInstances) {
    const bot = botInstances[uid];
    if (bot) {
      if (bot.spots && bot.player && bot.player.map) {
        spotsCache[bot.player.map] = bot.spots;
        updatedSpotsCount += Object.keys(bot.spots).length;
      }
      // Force next poll tick to fetch fresh static spots & mon_masters from game server
      bot.spots = null;
      bot.mon_masters = null;
    }
  }
  saveSpotsCache();

  return {
    success: true,
    maps: mapsCache,
    spotsCache: spotsCache,
    lastSyncedAt: lastMapSyncAt,
    updatedMapsCount,
    updatedSpotsCount
  };
}

function processPassiveMapDiscovery(mapId, spotsObj) {
  if (!mapId || !spotsObj || typeof spotsObj !== 'object') return;
  const spotsList = Object.values(spotsObj);
  if (spotsList.length === 0) return;

  const targetMapId = parseInt(mapId);
  if (isNaN(targetMapId) || targetMapId <= 0) return;

  let minLv = 999;
  spotsList.forEach(s => {
    if (!s) return;
    const l = parseInt(s.lv || s.req_lv || s.level || s.req);
    if (!isNaN(l) && l > 0 && l < minLv) minLv = l;
  });
  if (minLv === 999) minLv = 1;

  let existing = mapsCache.find(m => m.id === targetMapId);
  let updated = false;

  if (!existing) {
    const mapEmojiMap = { 1: '🌿', 2: '🏜️', 3: '❄️', 4: '⚔️', 5: '🏛️', 6: '🌋', 7: '🏔️', 8: '🏰', 9: '🌌', 10: '💎' };
    const newMapEntry = {
      id: targetMapId,
      name: `Bản đồ #${targetMapId}`,
      emoji: mapEmojiMap[targetMapId] || '🗺️',
      req: minLv,
      discoveredAt: new Date().toISOString(),
      source: 'passive_live_discovery'
    };
    mapsCache.push(newMapEntry);
    mapsCache.sort((a, b) => a.id - b.id);
    updated = true;
    console.log(`✨ [Passive Map Discovery] Đã tự động ghi nhận Bản đồ mới #${targetMapId} (Yêu cầu Lv.${minLv}+) từ Game Server!`);
  } else {
    if (existing.source === 'passive_live_discovery' && existing.req !== minLv) {
      existing.req = minLv;
      updated = true;
    }
  }

  if (updated) {
    lastMapSyncAt = new Date().toISOString();
    saveMapsCache();
  }
}

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
const PUBLIC_DIR = path.join(__dirname, 'public');

// Cache Busting: tính MD5 hash nội dung file — chỉ bust cache khi file thực sự thay đổi
function computeFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
  } catch {
    return Date.now().toString(36); // fallback nếu không đọc được file
  }
}

// Static files (JS/CSS/assets) với maxAge dài — hash đảm bảo cache bust tự động
// index: false để route bên dưới xử lý việc inject hash vào index.html
app.use(express.static(PUBLIC_DIR, {
  maxAge: '30d',
  etag: true,
  lastModified: true,
  index: false,
}));

// Serve index.html với asset version hash được inject động vào href/src
// Hash được tính lại mỗi request để hỗ trợ hot-reload (nodemon, v.v.)
app.get('/', (req, res) => {
  try {
    const cssHash = computeFileHash(path.join(PUBLIC_DIR, 'app.css'));
    const jsHash  = computeFileHash(path.join(PUBLIC_DIR, 'app.js'));
    let html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
    html = html.replace(
      /href="\/app\.css(\?[^"]*)?"/g,
      `href="/app.css?v=${cssHash}"`
    );
    html = html.replace(
      /src="\/app\.js(\?[^"]*)?"/g,
      `src="/app.js?v=${jsHash}"`
    );
    // index.html không bao giờ được cache — luôn trả về hash mới nhất
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('[Cache] Lỗi khi serve index.html:', err.message);
    res.status(500).send('Server error loading dashboard');
  }
});

// Path to storage files
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const ANNOUNCEMENTS_FILE = path.join(__dirname, 'announcements.json');

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

// Load announcements
function loadAnnouncements() {
  try {
    if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
      const data = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error reading announcements file:', err);
  }
  return [];
}

// Save announcements
function saveAnnouncements(ann) {
  try {
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(ann, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing announcements file:', err);
  }
}

// Helper to check if a user account is expired
function isUserExpired(user) {
  if (!user || user.role === 'admin' || !user.expiresAt) return false;
  return new Date(user.expiresAt) < new Date();
}

// In-memory data store for bot instances
let botInstances = {};

// In-memory cache for accounts to prevent blocking I/O on multiple reads
let accountsCache = null;
let saveAccountsTimeout = null;

// Load accounts
function loadAccounts() {
  if (accountsCache !== null) {
    return accountsCache;
  }
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
      accountsCache = JSON.parse(data || '[]');
      return accountsCache;
    }
  } catch (err) {
    console.error('Error reading accounts file:', err);
  }
  accountsCache = [];
  return accountsCache;
}

// Save accounts (Debounced Async Write with In-memory Cache)
function saveAccounts(accounts) {
  accountsCache = accounts;
  
  if (saveAccountsTimeout) {
    clearTimeout(saveAccountsTimeout);
  }
  
  saveAccountsTimeout = setTimeout(() => {
    fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accountsCache, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing accounts file asynchronously:', err);
      }
    });
    saveAccountsTimeout = null;
  }, 1500); // 1.5s debounce
}

// Flush accounts cache to disk on shutdown to prevent data loss
function flushAccountsToDisk() {
  if (accountsCache !== null && saveAccountsTimeout !== null) {
    try {
      console.log('[Shutdown] Flushing accounts cache to disk...');
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accountsCache, null, 2), 'utf8');
      console.log('[Shutdown] Accounts cache flushed successfully.');
    } catch (e) {
      console.error('[Shutdown] Failed to flush accounts cache:', e.message);
    }
  }
}

process.on('SIGINT', () => {
  flushAccountsToDisk();
  process.exit(0);
});
process.on('SIGTERM', () => {
  flushAccountsToDisk();
  process.exit(0);
});
process.on('exit', () => {
  flushAccountsToDisk();
});

// 🛡️ Global Safety Net: Chống crash Node.js process khi gặp lỗi unhandled bất ngờ
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception caught by Safety Net:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Promise Rejection caught by Safety Net:', reason);
});

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
  return Math.ceil(lv * (10 + 20 * b) * (10 + b) / 10);
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

// Map definitions (dynamically loaded & cached)
const MAP_DEFS = getMapDefs();

const MONSTER_DICT = {
  1:  { n: 'Sứa Đỏ',             lv: 1 },
  2:  { n: 'Sâu Lá',              lv: 2 },
  3:  { n: 'Thỏ Trắng',          lv: 3 },
  4:  { n: 'Chim Khai Phá',       lv: 5 },
  5:  { n: 'Chuồn Chuồn',          lv: 7 },
  6:  { n: 'Mộc Yêu',             lv: 9 },
  7:  { n: 'Nấm Độc',             lv: 12 },
  8:  { n: 'Sói Xám',             lv: 15 },
  9:  { n: 'Cốt Binh',             lv: 18 },
  10: { n: 'Thây Ma',             lv: 22 },
  11: { n: 'Xác Ướp',             lv: 26 },
  12: { n: 'Rắn Độc',             lv: 30 },
  13: { n: 'Người Đá',            lv: 35 },
  14: { n: 'Băng Khổng Lồ',        lv: 40 },
  15: { n: 'Quỷ Tuyết',            lv: 45 },
  16: { n: 'Bò Thần',              lv: 50 },
  17: { n: 'Pháp Sư',             lv: 55 },
  18: { n: 'Thuyền Trưởng',       lv: 60 },
  19: { n: 'Quỷ Lửa',             lv: 65 },
  20: { n: 'Chúa Lửa',             lv: 70 },
  21: { n: 'Bọ Hoàng Kim',        lv: 75 },
  22: { n: 'Nữ Hoàng Maya',        lv: 80 },
  23: { n: 'Vua Bọ',              lv: 85 },
  24: { n: 'Chúa Tể Baphomet',    lv: 90 },
  25: { n: 'Chúa Tể Bóng Tối',    lv: 95 },
  26: { n: 'Nữ Thần Valkyrie',    lv: 100 }
};

function getCardStars(translatedName) {
  let monLv = 1;
  const nameLower = translatedName.toLowerCase();
  for (const mid in MONSTER_DICT) {
    const m = MONSTER_DICT[mid];
    if (nameLower.includes(m.n.toLowerCase())) {
      monLv = m.lv;
      break;
    }
  }
  return Math.ceil(monLv / 10);
}

function getModuleTier(translatedName) {
  if (!translatedName) return null;
  const match = translatedName.match(/\bT([1-5])\b/i) || translatedName.match(/tier\s*([1-5])\b/i) || translatedName.match(/bậc\s*([1-5])\b/i) || translatedName.match(/cấp\s*([1-5])\b/i);
  if (match) return `T${match[1]}`;
  const nameLower = translatedName.toLowerCase();
  for (let i = 5; i >= 1; i--) {
    if (nameLower.includes(`t${i}`) || nameLower.includes(`bậc ${i}`) || nameLower.includes(`cấp ${i}`)) {
      return `T${i}`;
    }
  }
  return null;
}

function getModuleType(translatedName) {
  const nameLower = translatedName.toLowerCase();
  if (nameLower.includes('dao găm') || nameLower.includes('knife')) return 'knife';
  if (nameLower.includes('kiếm') || nameLower.includes('dao dài') || nameLower.includes('sword') || nameLower.includes('blade')) return 'sword';
  if (nameLower.includes('rìu') || nameLower.includes('axe')) return 'axe';
  if (nameLower.includes('titan')) return 'titan';
  if (nameLower.includes('giáp') || nameLower.includes('armor')) return 'armor';
  if (nameLower.includes('phi thuyền') || nameLower.includes('spaceship') || nameLower.includes('thuyền')) return 'spaceship';
  if (nameLower.includes('pháo tháp') || nameLower.includes('pháo') || nameLower.includes('turret')) return 'turret';
  return 'other';
}

function getItemCategory(item) {
  if (!item) return 'resource';
  const type = (item.item_type || '').toLowerCase();
  const rawName = (item.item_name || '').toLowerCase();
  const transName = translateThaiText(item.item_name || '').toLowerCase();

  // 1. Card Box
  if (type === 'card_box' || rawName.includes('กล่องการ์ด') || transName.includes('hộp thẻ')) {
    return 'card_box';
  }
  // 2. Egg Box
  if (type === 'egg_box' || rawName.includes('กล่องไข่') || transName.includes('hộp trứng')) {
    return 'egg_box';
  }
  // 3. Module Box
  if (type === 'module_box' || rawName.includes('กล่องโมดูล') || transName.includes('hộp module')) {
    return 'module_box';
  }
  // 4. Card
  if (type === 'card' || rawName.includes('การ์ด') || transName.includes('thẻ')) {
    return 'card';
  }
  // 5. Egg
  if (type === 'egg' || rawName.includes('ไข่') || transName.includes('trứng')) {
    return 'egg';
  }
  // 6. Module
  if (type.startsWith('module_') || rawName.includes('โมดูล') || transName.includes('module')) {
    return 'module';
  }
  // 7. Collectible / Proof
  if (['stat_parts', 'hardware', 'weapon_parts', 'house_parts', 'treasure'].includes(type) || transName.includes('chứng') || transName.includes('sưu tầm') || transName.includes('linh kiện')) {
    return 'collectible';
  }
  // 8. Diamond
  if (type === 'diamond' || rawName.includes('เพชร') || transName.includes('kim cương')) {
    return 'diamond';
  }
  // 9. Resource / Material / Trash (default fallback)
  return 'resource';
}

// ==================== ANTI-DETECTION & HUMAN SIMULATION ENGINE ====================

const BROWSER_PROFILES = [
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    chUa: '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    platform: '"Windows"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    chUa: '"Not/A)Brand";v="8", "Chromium";v="125", "Microsoft Edge";v="125"',
    platform: '"Windows"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    chUa: '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    platform: '"macOS"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    chUa: null,
    platform: null,
    mobile: null
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    chUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    platform: '"Windows"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    chUa: '"Chromium";v="125", "Google Chrome";v="125", "Not.A/Brand";v="24"',
    platform: '"Linux"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    chUa: null,
    platform: null,
    mobile: null
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
    chUa: '"Chromium";v="123", "Opera";v="109", "Not.A/Brand";v="24"',
    platform: '"Windows"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36',
    chUa: '"Chromium";v="125", "Google Chrome";v="125", "Not.A/Brand";v="24"',
    platform: '"Android"',
    mobile: '?1'
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Vivaldi/6.8.3381.46',
    chUa: '"Chromium";v="126", "Vivaldi";v="6.8", "Not-A.Brand";v="99"',
    platform: '"Windows"',
    mobile: '?0'
  }
];

const ACCEPT_LANG_POOL = [
  'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  'vi,en-US;q=0.9,en;q=0.8',
  'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
  'en-US,en;q=0.9,vi;q=0.8',
  'vi-VN,vi;q=0.9,ja-JP;q=0.8,ja;q=0.7,en-US;q=0.6,en;q=0.5'
];

function getAccountFingerprint(line_uid) {
  let hash = 0;
  const str = String(line_uid || 'default');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);
  const profile = BROWSER_PROFILES[posHash % BROWSER_PROFILES.length];
  const lang = ACCEPT_LANG_POOL[posHash % ACCEPT_LANG_POOL.length];
  return {
    userAgent: profile.ua,
    chUa: profile.chUa,
    platform: profile.platform,
    mobile: profile.mobile,
    acceptLanguage: lang
  };
}

// Gaussian-like noise (triangular approximation) to mimic human non-exact coordinate clicks
function naturalCoordNoise(base, maxRange = 18) {
  if (base == null || isNaN(base)) return base;
  const u = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // [-1, 1] biased towards 0
  const noise = Math.round(u * maxRange);
  return Math.max(0, base + noise);
}

// Log-normal distribution for human interaction intervals:
// Natural rhythm around ~180-240s with wide natural variance (90s - 450s)
function logNormalActInterval(minMs = 90000, maxMs = 450000) {
  const mu = Math.log(200000); // ~200s median
  const sigma = 0.45;
  const u1 = Math.max(0.0001, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const val = Math.exp(mu + sigma * z);
  return Math.max(minMs, Math.min(maxMs, Math.round(val)));
}

// Background poller manager
class BotInstance {
  constructor(account) {
    this.line_uid = account.line_uid;
    this.session_token = account.session_token;
    this.phpsessid = account.phpsessid || null;
    this.name = account.name;
    this.userId = account.userId || 'usr_admin';
    this.fingerprint = getAccountFingerprint(this.line_uid);
    
    // Load user-level poll configuration
    const users = loadUsers();
    const user = users.find(u => u.id === this.userId);
    this.userPollInterval = user ? user.pollInterval : undefined;
    this.userIsAdmin = user ? (user.role === 'admin') : false;
    this.allowEditPollInterval = user ? (user.allowEditPollInterval === true) : false;

    const userSettings = account.settings || {};
    this.settings = { ...this.getDefaultSettings(), ...userSettings };
    if (this.settings.autoEventJoin) {
      if (userSettings.autoEventJoinInv === undefined) this.settings.autoEventJoinInv = true;
      if (userSettings.autoEventJoinGw === undefined) this.settings.autoEventJoinGw = true;
      if (userSettings.autoEventJoinCw === undefined) this.settings.autoEventJoinCw = true;
    }
    if (this.settings.bossHuntMode === undefined) {
      if (this.settings.autoMVP) {
        this.settings.bossHuntMode = this.settings.autoMvpCycle !== false ? 'type2' : 'type1';
      } else {
        this.settings.bossHuntMode = 'off';
      }
    }
    
    this.player = null;
    this.logs = [];
    this.lastUpdate = null;
    this.error = null;
    this.status = 'idle';
    this.ping = 0;
    this.pollCount = 0;
    this.timer = null;
    this.isPolling = false;
    this.arrivedAtZoneCenter = false;
    this.targetedMvp = false;
    this.lastTargetedBossId = null;
    this.manualTargetBossId = null; // Boss ID do user chọn thủ công từ Dashboard
    this.bossSpawnTimes = {}; // Tracker for when each boss starts appearing: bossId -> timestamp
    this._bossNameCache = {}; // Cache boss names for logging when they disappear
    this._lastBossStatusLogAt = 0; // Track last time boss status log was sent to prevent spamming
    this.guildDungeonActive = false;
    this.guildDungeonIsTeam = this.settings.guildDungeonIsTeam || false;
    this.monsters = null;
    this.bosses = null;
    this.gdunEmptyPolls = 0;
    this.gdunEnteredAt = 0;         // Timestamp khi vào Phụ Bản Guild (dùng cho timer-based auto-exit)
    this.gdunLastKillAt = 0;        // Timestamp khi hạ gục Boss Guild gần nhất
    this._exitingGuildDungeon = false; // Guard chống gọi exitGuildDungeon() liên tiếp
    this.isMvpCycling = false;
    this.mvpCycleMapIndex = 0;
    this.mvpCycleMapStayCount = 0;
    this.mvpConfirmClearCount = 0; // Số polls liên tiếp xác nhận map đã sạch boss
    this.mvpCycleOriginalMap = null;
    this.mvpCycleOriginalAutoMap = null;
    this.lastMvpCycleCheckHour = -1;
    this.lastGdunAutoEnterHour = -1;
    this.lootLogs = [];
    this.mvpHuntLog = []; // Nhật ký sự kiện săn Boss MVP
    this.currentMvpBossInfo = null; // Thông tin Boss đang được nhắm { id, name, emoji, lv, mapId, startTs }
    this.mvpCycleStats = { cycleStartTs: 0, mapStartTs: 0, bossKilledInCycle: 0, bossKilledInMap: 0 };
    this.weKilledCurrentMvp = false; // Đánh dấu bot kết liễu boss thành công
    this._bossSnipeActive = false;
    this._snipeLoggedOnce = false;
    this.proxyId = account.proxyId || null;
    this.isManualProxy = account.isManualProxy || false;
    const assigned = proxyPool.assignBot(this.line_uid, this.proxyId);
    this.proxyId = assigned;
    this.combatStatsHistory = [];
    this.startTime = null;
    this.lastPollStartedAt = 0;
    this.lastChpassSentAt = 0;
    // 😴 Anti-idle & Event-Driven Act-Flag Jitter Engine
    // Mô phỏng hành vi người dùng thật: act=1 khi có tương tác (Event) hoặc nhịp log-normal jitter tự nhiên (~2-6 phút)
    this.lastActSentAt = 0;
    this.nextActInterval = logNormalActInterval();
    this.pendingActFlag = false;
    this.lastSessionRefreshAt = Date.now(); // 🕒 Mốc làm mới session token gần nhất
    this.consecutiveErrors = 0;
    this.failedSeeds = {}; // Danh sách hạt giống bị lỗi gieo trồng
    this.lastHarvestFailedAt = 0;
    this.lastHomeUpgradeFailedAt = 0;
    this.marketBuyHistory = account.marketBuyHistory || [];
    this.offlineRewardsHistory = account.offlineRewardsHistory || [];
    this.eventWarHistory = [];
    this.inEventMode = false;
    this.currentEventKind = null;
    this.eventOriginalMap = null;
    this.eventOriginalAutoMap = null;
    this.eventOriginalAutoZone = null;
    this.eventOriginalLockZoneCenter = null;
    this.eventOriginalTargetZone = null;
    this.isEventReturning = false;
    this.eventReturnMapTarget = null;
    this.playerDefCache = {};
    this.lastInv = null;
    this.lastGw = null;
    this.lastCw = null;
    this.others = [];
    this.addLog('SYSTEM', `Khởi tạo bot cho tài khoản: ${this.name}${this.phpsessid ? ' (🔑 Có Auto-Relogin PHPSESSID)' : ''}`);
  }

  // 🔑 T62 Auto Session Renewal & Auto-Relogin Engine
  async refreshSession() {
    if (!this.phpsessid) {
      this.addLog('WARN', '🔑 Chưa cấu hình PHPSESSID nên không thể tự động gia hạn Session Token');
      return false;
    }
    try {
      this.addLog('SYSTEM', '🔄 Đang làm mới Session Token qua PHPSESSID từ game server...');
      const fetchOptions = {
        headers: {
          'cookie': `PHPSESSID=${this.phpsessid}`,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };
      if (typeof proxyPool !== 'undefined' && proxyPool.getDispatcherForBot) {
        const disp = proxyPool.getDispatcherForBot(this.line_uid);
        if (disp) fetchOptions.dispatcher = disp;
      }
      const response = await fetch('https://ragnalok.online/human/xhrpg_google_auth.php', fetchOptions);
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (e) {}
      if (data && data.ok && data.session_token) {
        this.session_token = String(data.session_token);
        this.lastSessionRefreshAt = Date.now();
        this.addLog('SYSTEM', `✅ Làm mới Session Token thành công! Token mới: ${this.session_token.slice(0, 8)}...`);

        // Cập nhật lại file accounts.json
        const currentAccounts = loadAccounts();
        const index = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
        if (index !== -1) {
          currentAccounts[index].session_token = this.session_token;
          currentAccounts[index].phpsessid = this.phpsessid;
          saveAccounts(currentAccounts);
        }
        return true;
      } else {
        const errMsg = (data && (data.msg || data.error)) || 'PHPSESSID không hợp lệ hoặc đã hết hạn trên game';
        this.addLog('ERROR', `❌ Làm mới Session Token thất bại: ${errMsg}`);
        return false;
      }
    } catch (err) {
      this.addLog('ERROR', `❌ Lỗi kết nối khi làm mới Session Token: ${err.message}`);
      return false;
    }
  }

  triggerActFlag() {
    this.pendingActFlag = true;
  }

  updatePlayerState(newPlayer) {
    if (!newPlayer) return;
    if (!this.player) {
      this.player = newPlayer;
    }
    const COLD_FIELDS = [
      'pistol_modules','sniper_modules','knife_modules','axe_modules','armor_modules','turret_modules',
      'robot_modules','robot_gun_modules','railgun_modules','house_modules',
      'active_gun','gun_pistol_lv','gun_sniper_lv','knife_lv','turret_lv','armor_lv',
      'ammo_pistol_t1','ammo_pistol_t2','ammo_pistol_t3','ammo_pistol_t4','ammo_pistol_t5','ammo_pistol_t6',
      'ammo_sniper_t1','ammo_sniper_t2','ammo_sniper_t3','ammo_sniper_t4','ammo_sniper_t5','ammo_sniper_t6',
      'auto_refill_pistol','auto_refill_sniper',
      'pistol_tier_enabled','sniper_tier_enabled','turret_tier_enabled','robot_tier_enabled',
      'gun_use_pistol','gun_use_sniper','gun_use_turret','gun_use_robot_gun',
      'auto_refill_robot_gun','ammo_robot_tiers','robot_ammo_extra',
      'ammo_robot_t1','ammo_robot_t2','ammo_robot_t3','ammo_robot_t4','ammo_robot_t5','ammo_robot_t6',
      'ammo_pistol_tiers','ammo_sniper_tiers','ammo_turret_tiers','ammo_extra','sniper_ammo_extra',
      'module_inventory','sniper_module_inventory','knife_module_inventory','axe_module_inventory',
      'robot_module_inventory','robot_gun_module_inventory','railgun_module_inventory',
      'armor_module_inventory','house_module_inventory','turret_module_inventory',
      'cards','eggs','treasures','treasures_qty','hardware','hardware_qty','weapon_parts','weapon_parts_qty',
      'house_parts','house_parts_qty','stat_parts','stat_parts_qty',
      'home_crops','home_seeds','home_lv','home_guards','home_return',
      'pet_mid','pet_exp','pet_mvp','pet_olv','pet_up_atk','pet_up_hp','pet_up_reco','pet_batk','pet_bhp',
      'pvp_today','pvp_won','pvp_lost','pvp_pts','gdun_in'
    ];
    for (const f of COLD_FIELDS) {
      if (newPlayer[f] === undefined && this.player[f] !== undefined) {
        newPlayer[f] = this.player[f];
      }
    }
    this.player = newPlayer;

    // Automatically sync guildDungeonActive with gdun_in status or Map 12
    if (this.player && (Number(this.player.gdun_in) === 1 || Number(this.player.map) === 12)) {
      this.guildDungeonActive = true;
    } else {
      this.guildDungeonActive = false;
      this.guildDungeonIsTeam = false;
      if (this.settings.guildDungeonIsTeam) {
        this.settings.guildDungeonIsTeam = false;
        const currentAccounts = loadAccounts();
        const idx = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
        if (idx !== -1) {
          currentAccounts[idx].settings = this.settings;
          saveAccounts(currentAccounts);
        }
      }
    }
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
      autoSyncOfflineZone: false,
      offlineTargetMap: 1,
      offlineTargetZones: [],
      bossHuntMode: 'off', // 'off' | 'type1' | 'type2'
      currentMvpMapIndex: 0,
      mvpPriorityMode: 'distance',
      mvpTargetMaps: '',
      autoArena: false,
      autoHomeHarvest: false,
      autoHomePlant: false,
      homePlantPriority: 'highest_tier',
      autoHomeUpgrade: false,
      bypassHomeWarp: false,
      teamRole: 'none',
      teamId: 'none',
      autoMarketBuy: false,
      marketMaxPrice: 10000,
      marketExactPrice: false,
      marketScanInterval: 10,
      marketCategories: {
        module: false,
        card: false,
        egg: false,
        collectible: false,
        resource: false,
        card_box: false,
        egg_box: false,
        module_box: false,
        diamond: false
      },
      marketSelectedCards: [],
      marketSelectedEggs: [],
      marketSelectedModuleTiers: [],
      marketSelectedCollectibles: [],
      marketSelectedModuleBoxes: [],
      marketSelectedCardBoxes: [],
      marketSelectedEggBoxes: [],
      marketCategoryMaxPrices: {},
      marketCategoryMaxQtys: {
        resource: 100,
        card: 1,
        egg: 1,
        module: 1,
        collectible: 1,
        diamond: 1,
        card_box: 1,
        egg_box: 1,
        module_box: 1
      },
      activeHealEnabled: false,
      activeHealThreshold: 50,
      autoEventJoin: false,
      autoEventJoinInv: false,
      autoEventJoinGw: false,
      autoEventJoinCw: false,
      eventPotionThreshold: 0,
      eventTargetMinDef: false,
      eventAttackRange: 300,
      autoEnterGdunAt30: false
    };
  }

  updateSettings(newSettings) {
    const oldBossHuntMode = this.settings.bossHuntMode;

    this.settings = { ...this.settings, ...newSettings };
    this.addLog('SYSTEM', 'Cập nhật cấu hình bot thành công');

    // Nếu đang trong chu kỳ săn boss mà bị tắt hoặc đổi sang chế độ khác Loại 2, hoặc xóa/đổi danh sách map
    if (this.isMvpCycling) {
      const turnedOffOrChanged = (newSettings.bossHuntMode !== undefined && newSettings.bossHuntMode !== 'type2' && oldBossHuntMode === 'type2');
      
      let mapsCleared = false;
      if (newSettings.mvpTargetMaps !== undefined) {
        const maps = newSettings.mvpTargetMaps.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (maps.length === 0) {
          mapsCleared = true;
        }
      }

      if (turnedOffOrChanged || mapsCleared) {
        this.isMvpCycling = false;
        this.mvpCycleMapIndex = 0;
        this.mvpCycleMapStayCount = 0;
        this.mvpConfirmClearCount = 0;
        this.bosses = null;
        this._bossNameCache = {};
        this._lastBossStatusLogAt = 0;
        
        // Khôi phục autoMap ban đầu
        if (this.mvpCycleOriginalAutoMap !== null) {
          this.settings.autoMap = this.mvpCycleOriginalAutoMap;
          this.mvpCycleOriginalAutoMap = null;
        }

        if (this.mvpCycleOriginalMap !== null) {
          const returnMap = this.mvpCycleOriginalMap;
          this.addLog('SYSTEM', `⏹️ [Auto Boss] Cấu hình thay đổi -> Hủy chu kỳ săn Boss xoay vòng, tự động quay về Map farm gốc (Map ${returnMap}).`);
        } else {
          this.addLog('SYSTEM', `⏹️ [Auto Boss] Cấu hình thay đổi -> Hủy chu kỳ săn Boss xoay vòng.`);
        }
      }
    }
  }

  addLog(type, msg) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    this.logs.push({
      time: timestamp,
      type: type.toLowerCase(),
      msg: translateThaiText(msg)
    });
    if (this.logs.length > 50) {
      this.logs.shift();
    }
  }

  addLootLog(msg) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    this.lootLogs.push({
      time: timestamp,
      msg: translateThaiText(msg)
    });
    if (this.lootLogs.length > 50) {
      this.lootLogs.shift();
    }
  }

  addMvpLog(eventType, data = {}) {
    const now = new Date();
    this.mvpHuntLog.push({
      time: now.toLocaleTimeString('vi-VN'),
      ts: now.getTime(),
      event: eventType, // 'cycle_start' | 'boss_found' | 'boss_killed' | 'map_clear' | 'map_timeout' | 'cycle_done' | 'warp'
      ...data
    });
    if (this.mvpHuntLog.length > 30) {
      this.mvpHuntLog.shift();
    }
  }

  logTargetBossCompletion() {
    if (this.lastTargetedBossId === null) return;
    const durationMs = this.currentMvpBossInfo ? (Date.now() - this.currentMvpBossInfo.startTs) : 0;
    const bInfo = this.currentMvpBossInfo || { name: 'Boss', emoji: '👾', lv: 1, mapId: Number(this.player ? this.player.map : 0) };

    if (this.weKilledCurrentMvp) {
      this.addLog('SUCCESS', `✅ [Auto Boss] Đã tiêu diệt Boss: ${bInfo.emoji || '👾'} ${bInfo.name} (Lv.${bInfo.lv})!`);
      this.addMvpLog('boss_killed', {
        bossName: bInfo.name,
        bossEmoji: bInfo.emoji,
        bossLv: bInfo.lv,
        mapId: bInfo.mapId,
        durationMs: durationMs
      });

      if (this.mvpCycleStats) {
        this.mvpCycleStats.bossKilledInCycle = (this.mvpCycleStats.bossKilledInCycle || 0) + 1;
        this.mvpCycleStats.bossKilledInMap = (this.mvpCycleStats.bossKilledInMap || 0) + 1;
      }
    } else {
      this.addLog('WARNING', `❌ [Auto Boss] Boss ${bInfo.emoji || '👾'} ${bInfo.name} đã bị người khác tiêu diệt hoặc mất dấu.`);
      this.addMvpLog('boss_lost', {
        bossName: bInfo.name,
        bossEmoji: bInfo.emoji,
        bossLv: bInfo.lv,
        mapId: bInfo.mapId,
        durationMs: durationMs
      });
    }

    // Clean up spawn time so it doesn't double-log in general cleanup
    if (this.currentMvpBossInfo && this.currentMvpBossInfo.id) {
      delete this.bossSpawnTimes[this.currentMvpBossInfo.id];
    }

    this.lastTargetedBossId = null;
    this.currentMvpBossInfo = null;
    this._bossSnipeActive = false;
    this._snipeLoggedOnce = false;
    this.weKilledCurrentMvp = false;
  }

  getCombatRates() {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minute window
    const cutoff = now - windowMs;
    
    // Prune history entries older than 5 minutes
    this.combatStatsHistory = (this.combatStatsHistory || []).filter(h => h.time >= cutoff);
    
    let totalKills = 0;
    let totalGold = 0;
    let totalExp = 0;
    let totalWood = 0;
    let totalStone = 0;
    let totalIron = 0;
    let totalCopper = 0;
    let totalHerb = 0;
    
    this.combatStatsHistory.forEach(h => {
      totalKills += (h.kills || 0);
      totalGold += (h.gold || 0);
      totalExp += (h.exp || 0);
      totalWood += (h.wood || 0);
      totalStone += (h.stone || 0);
      totalIron += (h.iron || 0);
      totalCopper += (h.copper || 0);
      totalHerb += (h.herb || 0);
    });
    
    // Window start time is either when bot started running or 5 mins ago (cutoff)
    const startOfMeasurement = this.startTime ? Math.max(this.startTime, cutoff) : cutoff;
    const diffMs = now - startOfMeasurement;
    const elapsedMin = Math.max(0.1, diffMs / 60000); // min 6 seconds
    
    return {
      killsPerMin: Math.round((totalKills / elapsedMin) * 10) / 10,
      goldPerMin: Math.round(totalGold / elapsedMin),
      expPerMin: Math.round(totalExp / elapsedMin),
      woodPerMin: Math.round(totalWood / elapsedMin),
      stonePerMin: Math.round(totalStone / elapsedMin),
      ironPerMin: Math.round(totalIron / elapsedMin),
      copperPerMin: Math.round(totalCopper / elapsedMin),
      herbPerMin: Math.round(totalHerb / elapsedMin)
    };
  }

  // Warp to specified map ID via game API
  async warpToMap(mapId) {
    const targetMapId = parseInt(mapId);
    if (isNaN(targetMapId)) return false;
    try {
      const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_warp.php', {
        line_uid: this.line_uid,
        session_token: this.session_token,
        target_map: targetMapId
      });
      if (res && res.ok) {
        if (res.player) {
          this.updatePlayerState(res.player);
        } else if (this.player) {
          this.player.map = targetMapId;
        }
        this.spots = null; // Reset cache để tải dữ liệu zone mới ngay poll sau
        this.bosses = null; // Reset cache để tải danh sách boss mới ngay poll sau
        this.addLog('SUCCESS', `Di chuyển sang bản đồ ${targetMapId} thành công`);
        return true;
      } else {
        this.addLog('WARNING', `Di chuyển bản đồ ${targetMapId} thất bại: ${(res && res.error) || 'Lỗi không xác định'}`);
        return false;
      }
    } catch (e) {
      this.addLog('ERROR', `Lỗi di chuyển bản đồ ${targetMapId}: ${e.message}`);
      return false;
    }
  }

  // Rotate to next MVP map in the configured list
  async warpToNextMvpMap() {
    const mapIds = (this.settings.mvpTargetMaps || '')
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(Number.isInteger);
    if (!mapIds.length) {
      this.addLog('WARNING', '⚠️ Chưa cấu hình danh sách Map Săn Boss.');
      return;
    }
    this.settings.currentMvpMapIndex = ((this.settings.currentMvpMapIndex || 0) + 1) % mapIds.length;
    const targetMap = mapIds[this.settings.currentMvpMapIndex];
    this.addLog('SYSTEM', `🗺️ [Auto MVP] Di chuyển sang Map Boss tiếp theo: Map ${targetMap}`);
    await this.warpToMap(targetMap);
  }

  enterEventMode(kind, mapId) {
    if (this.inEventMode) return;
    this.inEventMode = true;
    this.currentEventKind = kind;
    
    // Save original states
    let originalMap = 1;
    if (this.settings.targetMap && Number(this.settings.targetMap) !== Number(mapId)) {
      originalMap = Number(this.settings.targetMap);
    } else if (this.player && Number(this.player.map) !== Number(mapId)) {
      originalMap = Number(this.player.map);
    } else if (this.settings.targetMap) {
      originalMap = Number(this.settings.targetMap) === 4 ? 1 : Number(this.settings.targetMap);
    }
    this.eventOriginalMap = originalMap;
    this.eventOriginalAutoMap = this.settings.autoMap;
    this.eventOriginalAutoZone = this.settings.autoZone;
    this.eventOriginalLockZoneCenter = this.settings.lock_zone_center;
    this.eventOriginalTargetZone = this.settings.targetZone;
    
    this.addLog('SYSTEM', `🚀 Kích hoạt Chế độ Event [${kind.toUpperCase()}]. Đã lưu vị trí bản đồ farm gốc (Map ${this.eventOriginalMap}).`);
    
    // Override settings to keep bot in event map
    this.settings.targetMap = mapId;
    this.settings.autoMap = true;
    this.settings.autoZone = false;
    this.settings.lock_zone_center = false;
    this.settings.targetZone = 0;
    
    const currentAccounts = loadAccounts();
    const index = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
    if (index !== -1) {
      currentAccounts[index].settings = this.settings;
      saveAccounts(currentAccounts);
    }
  }

  exitEventMode() {
    if (!this.inEventMode) {
      if (Number(this.settings.targetMap) === 4) {
        this.settings.targetMap = 1;
        this.addLog('SYSTEM', '🔄 [Cảnh báo] Phát hiện targetMap bị kẹt ở Map 4 trong khi không có sự kiện. Đã tự động reset về Map 1.');
        const currentAccounts = loadAccounts();
        const index = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
        if (index !== -1) {
          currentAccounts[index].settings = this.settings;
          saveAccounts(currentAccounts);
        }
      }
      return;
    }
    this.inEventMode = false;
    
    const returnMap = this.eventOriginalMap || 1;
    this.addLog('SYSTEM', `⏹️ Event kết thúc -> Thoát Chế độ Event, tự động quay về bản đồ farm gốc (Map ${returnMap}).`);
    
    // Restore settings
    this.settings.targetMap = returnMap;
    this.settings.autoMap = this.eventOriginalAutoMap !== undefined ? this.eventOriginalAutoMap : true;
    this.settings.autoZone = this.eventOriginalAutoZone !== undefined ? this.eventOriginalAutoZone : false;
    this.settings.lock_zone_center = this.eventOriginalLockZoneCenter !== undefined ? this.eventOriginalLockZoneCenter : false;
    this.settings.targetZone = this.eventOriginalTargetZone !== undefined ? this.eventOriginalTargetZone : 0;
    
    this.isEventReturning = true;
    this.eventReturnMapTarget = returnMap;
    
    this.eventOriginalMap = null;
    this.eventOriginalAutoMap = null;
    this.eventOriginalAutoZone = null;
    this.eventOriginalLockZoneCenter = null;
    this.eventOriginalTargetZone = null;
    
    const currentAccounts = loadAccounts();
    const index = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
    if (index !== -1) {
      currentAccounts[index].settings = this.settings;
      saveAccounts(currentAccounts);
    }
  }

  async joinGuildWar() {
    try {
      const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_guild.php', {
        line_uid: this.line_uid,
        session_token: this.session_token,
        action: 'gwar_join',
        lang: 'vi'
      });
      if (res && res.ok) {
        if (res.player) {
          this.updatePlayerState(res.player);
        } else if (this.player) {
          this.player.map = 4;
          if (res.x !== undefined) this.player.x = res.x;
          if (res.y !== undefined) this.player.y = res.y;
        }
        this.spots = null;
        this.bosses = null;
        this.addLog('SUCCESS', `⚔️ [Guild War] Vào chiến trường thành công`);
        return true;
      } else {
        this.addLog('WARNING', `⚔️ [Guild War] Không thể vào chiến trường: ${(res && res.error) || 'Lỗi không xác định'}`);
        return false;
      }
    } catch (e) {
      this.addLog('ERROR', `Lỗi vào Guild War: ${e.message}`);
      return false;
    }
  }

  async enterGuildDungeon(isTeam = false) {
    try {
      const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_guild.php', {
        line_uid: this.line_uid,
        session_token: this.session_token,
        action: 'gdun_enter',
        lang: 'vi'
      });
      if (res && res.ok) {
        if (res.player) {
          this.updatePlayerState(res.player);
        }
        if (!this.player) this.player = {};
        // Luôn đặt gdun_in = 1 khi enter thành công, bất kể server có trả res.map hay không
        this.player.map = (res.map | 0) || 12;
        this.player.gdun_in = 1;
        this.player.x = (res.x != null) ? res.x : 1125;
        this.player.y = (res.y != null) ? res.y : 1125;
        this.player.explore_cx = this.player.x;
        this.player.explore_cy = this.player.y;
        this.spots = null;
        this.bosses = null;
        this.monsters = null;
        this.guildDungeonActive = true;
        this.guildDungeonIsTeam = !!isTeam;
        this.settings.guildDungeonIsTeam = !!isTeam;
        const currentAccounts = loadAccounts();
        const idx = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
        if (idx !== -1) {
          currentAccounts[idx].settings = this.settings;
          saveAccounts(currentAccounts);
        }
        this.gdunEmptyPolls = 0;
        this.gdunEnteredAt = Date.now(); // Bắt đầu bộ đếm thời gian auto-exit
        this.gdunLastKillAt = 0;         // Reset kill timestamp khi vào dungeon mới
        this._exitingGuildDungeon = false;
        const modeTxt = isTeam ? 'Cả Team' : 'Đi 1 Mình (Solo)';
        this.addLog('SUCCESS', `🏰 [Guild Dungeon] Đã vào Phụ Bản Guild (Chế độ: ${modeTxt}) - Map ${this.player ? this.player.map : 12}! Tiến hành săn Boss...`);
        this.triggerImmediatePoll();
        return true;
      } else {
        this.addLog('WARNING', `🏰 [Guild Dungeon] Không thể vào Phụ Bản Guild: ${(res && res.error) || 'Lỗi không xác định'}`);
        return false;
      }
    } catch (e) {
      this.addLog('ERROR', `Lỗi vào Phụ Bản Guild: ${e.message}`);
      return false;
    }
  }

  async exitGuildDungeon() {
    try {
      const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_guild.php', {
        line_uid: this.line_uid,
        session_token: this.session_token,
        action: 'gdun_exit',
        lang: 'vi'
      });
      if (res && res.ok) {
        if (res.player) {
          this.updatePlayerState(res.player);
        }
        if (!this.player) this.player = {};
        // Luôn reset gdun_in = 0 khi exit thành công, bất kể server có trả res.map hay không
        this.player.gdun_in = 0;
        const returnMap = (res.map | 0) || parseInt(this.settings.targetMap) || 1;
        this.player.map = returnMap;
        if (res.x != null) this.player.x = res.x;
        if (res.y != null) this.player.y = res.y;
        this.spots = null;
        this.bosses = null;
        this.monsters = null;
        this.guildDungeonActive = false;
        this.guildDungeonIsTeam = false;
        this.currentMvpBossInfo = null;
        this.settings.guildDungeonIsTeam = false;
        const currentAccounts = loadAccounts();
        const idx = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
        if (idx !== -1) {
          currentAccounts[idx].settings = this.settings;
          saveAccounts(currentAccounts);
        }
        this.gdunEmptyPolls = 0;
        this.gdunEnteredAt = 0;
        this.gdunLastKillAt = 0;
        this._exitingGuildDungeon = false;
        this.addLog('SUCCESS', `↩️ [Guild Dungeon] Đã hoàn thành/thoát khỏi Phụ Bản Guild (Về Map ${returnMap})`);
        await this.warpToMap(returnMap).catch(() => {});
        this.triggerImmediatePoll();
        return true;
      } else {
        this._exitingGuildDungeon = false; // Cho phép thử lại nếu server từ chối
        this.addLog('WARNING', `↩️ [Guild Dungeon] Không thể thoát Phụ Bản Guild: ${(res && res.error) || 'Lỗi không xác định'}`);
        return false;
      }
    } catch (e) {
      this._exitingGuildDungeon = false; // Cho phép thử lại nếu exception
      this.addLog('ERROR', `Lỗi thoát Phụ Bản Guild: ${e.message}`);
      return false;
    }
  }

  async joinCountryWar() {
    try {
      const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_cwar.php', {
        line_uid: this.line_uid,
        session_token: this.session_token,
        action: 'cwar_join',
        lang: 'vi'
      });
      if (res && res.ok) {
        if (res.player) {
          this.updatePlayerState(res.player);
        } else if (this.player) {
          this.player.map = 4;
          if (res.x !== undefined) this.player.x = res.x;
          if (res.y !== undefined) this.player.y = res.y;
        }
        this.spots = null;
        this.bosses = null;
        this.addLog('SUCCESS', `⚔️ [National War] Vào chiến trường thành công`);
        return true;
      } else {
        this.addLog('WARNING', `⚔️ [National War] Không thể vào chiến trường: ${(res && res.error) || 'Lỗi không xác định'}`);
        return false;
      }
    } catch (e) {
      this.addLog('ERROR', `Lỗi vào National War: ${e.message}`);
      return false;
    }
  }

  async fetchWarLog() {
    try {
      const kind = this.currentEventKind; // 'gw' or 'cw'
      if (kind) {
        await this._fetchWarLogSingle(kind);
      } else {
        // Fallback parallel fetch if event kind is unknown
        await Promise.allSettled([
          this._fetchWarLogSingle('gw'),
          this._fetchWarLogSingle('cw')
        ]);
      }
    } catch (e) {
      console.error(`Failed to fetch event war log for ${this.name}:`, e.message);
    }
  }

  async _fetchWarLogSingle(kind) {
    try {
      const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_cwar.php', {
        line_uid: this.line_uid,
        session_token: this.session_token,
        action: 'war_log',
        kind: kind,
        lang: 'vi'
      });
      if (res && res.ok && Array.isArray(res.feed)) {
        if (!this.eventWarHistory) this.eventWarHistory = [];
        const existingKeys = new Set(this.eventWarHistory.map(h => `${h.time}_${h.killer}_${h.victim}`));
        
        let addedCount = 0;
        res.feed.forEach(r => {
          const timeMs = (r.t | 0) * 1000;
          const key = `${timeMs}_${r.k}_${r.v}`;
          if (!existingKeys.has(key)) {
            this.eventWarHistory.unshift({
              time: timeMs,
              eventKind: kind,
              killer: r.k,
              killerTag: r.kt || null,
              victim: r.v,
              victimTag: r.vt || null,
              points: r.p | 0
            });
            addedCount++;
          }
        });
        
        // Giới hạn tối đa 150 bản ghi
        if (this.eventWarHistory.length > 150) {
          this.eventWarHistory = this.eventWarHistory.slice(0, 150);
        }

        // Auto-assign event kind if we found active data
        if (res.feed.length > 0) {
          this.currentEventKind = kind;
        }
      }
    } catch (e) {
      // Silent catch for individual parallel attempts
    }
  }

  getPlayerDef(name) {
    if (!this.playerDefCache) this.playerDefCache = {};
    const cached = this.playerDefCache[name];
    const now = Date.now();
    if (cached && (now - cached.ts < 2 * 3600 * 1000)) {
      return cached.def;
    }
    return 999999; // Default high defense for sorting
  }

  async fetchPlayerDefBackground(name, uid) {
    if (!this.playerDefCache) this.playerDefCache = {};
    const cached = this.playerDefCache[name];
    const now = Date.now();
    
    // Avoid double fetching
    if (cached && (cached.loading || (now - cached.ts < 30000))) {
      return;
    }
    
    this.playerDefCache[name] = { def: 999999, ts: now, loading: true };
    
    try {
      const res = await this.sendRequest(`https://ragnalok.online/human/xhrpg_leaderboard.php?show=${uid}`, {});
      if (res && res.ok && res.def !== undefined) {
        this.playerDefCache[name] = {
          def: Number(res.def),
          lv: Number(res.lv || 1),
          ts: Date.now(),
          loading: false
        };
      } else {
        this.playerDefCache[name] = { def: 999999, ts: Date.now(), loading: false };
      }
    } catch (e) {
      console.error(`[Leaderboard Fetch Error] Failed to fetch def for ${name}:`, e.message);
      this.playerDefCache[name] = { def: 999999, ts: Date.now(), loading: false };
    }
  }

  start() {
    if (this.timer) return;
    this.status = 'running';
    this.pollCount = 0;
    this.startTime = Date.now();
    this.combatStatsHistory = [];
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
      this.lastPollStartedAt = Date.now();
      try {
        // 🛡️ Watchdog Timeout Cứng: Nếu pollGame bị nghẽn mạng/treo quá 45s, tự động ngắt để giải phóng vòng lặp
        const POLL_HARD_TIMEOUT = 45000;
        await Promise.race([
          this.pollGame(),
          new Promise((_, reject) => setTimeout(
            () => reject(new Error('⏱️ Watchdog: Poll bị treo quá 45s (mạng nghẽn/không phản hồi) — Tự động phục hồi')),
            POLL_HARD_TIMEOUT
          ))
        ]);
        this.consecutiveErrors = 0;
        this.firstErrorAt = null;
        if (this.proxyId) {
          proxyPool.resetErrorCount(this.proxyId);
        }
      } catch (err) {
        console.error(`Poll error for ${this.name}:`, err);
        this.consecutiveErrors = (this.consecutiveErrors || 0) + 1;
        if (!this.firstErrorAt) {
          this.firstErrorAt = Date.now();
        }
        const elapsedTime = Date.now() - this.firstErrorAt;
        const formattedErr = err.message || (err.cause ? `${err.cause.code || err.cause.message}` : 'Lỗi kết nối');
        this.error = formattedErr;
        const elapsedSec = Math.round(elapsedTime / 1000);
        this.addLog('ERROR', `${formattedErr} (Lỗi liên tục ${elapsedSec}s/90s)`);

        if (elapsedTime >= 90000) { // 1.5 minutes
          const oldProxyId = this.proxyId;
          const newAssigned = proxyPool.failoverAssignment(this.line_uid, oldProxyId);
          if (newAssigned !== oldProxyId) {
            this.proxyId = newAssigned;
            this.consecutiveErrors = 0;
            this.firstErrorAt = null;
            
            // Save updated proxyId to accounts.json
            const currentAccounts = loadAccounts();
            const index = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
            if (index !== -1) {
              currentAccounts[index].proxyId = newAssigned;
              saveAccounts(currentAccounts);
            }
            
            const newProxyInfo = proxyPool.getBotProxyInfo(this.line_uid);
            this.addLog('SYSTEM', `🔄 Proxy cũ gặp sự cố liên tiếp 1.5 phút. Đã tự động đổi sang cấu hình IP mới: ${newProxyInfo.label}`);

            // Trigger proxy recovery check immediately if direct is overloaded
            const counts = proxyPool._getCounts();
            const directCount = counts['direct'] || 0;
            const maxDirect = proxyPool._settings.maxBotsPerProxy || 10;
            if (directCount > maxDirect) {
              console.log(`[Proxy Failover] Direct count (${directCount}) exceeded max (${maxDirect}). Triggering instant proxy recovery check...`);
              setTimeout(() => {
                proxyPool.checkAndRecoverProxies().catch(e => console.error(e));
              }, 1000);
            }
          }
        }

        // 🛡️ Fix C: Giới hạn lỗi liên tục 10 phút -> Tạm nghỉ 5 phút rồi tự động thử lại
        if (elapsedTime >= 600000) {
          this.addLog('WARNING', `⚠️ Gặp lỗi kết nối liên tục ${Math.round(elapsedTime / 1000)}s — Tự động tạm nghỉ 5 phút trước khi kết nối lại...`);
          this.status = 'paused_error';
          this.error = `Tạm dừng do lỗi kết nối liên tục ${Math.round(elapsedTime / 60000)} phút`;
          if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
          }
          this.isPolling = false;
          setTimeout(() => {
            if (this.status === 'paused_error') {
              this.addLog('SYSTEM', '🔄 Hết thời gian chờ 5 phút — Tự động kích hoạt lại bot...');
              this.consecutiveErrors = 0;
              this.firstErrorAt = null;
              this.status = 'running';
              this.start();
            }
          }, 300000);
          return;
        }
      } finally {
        this.isPolling = false;
        // Schedule next poll staggering
        if (this.status === 'running') {
          // If the user has edit permission or is admin, they can configure it per-bot; otherwise, enforce user-level pollInterval
          let userPollInterval = 2000;
          if (this.userIsAdmin || this.allowEditPollInterval) {
            userPollInterval = this.settings.pollInterval !== undefined ? this.settings.pollInterval : (this.userPollInterval || 2000);
          } else {
            userPollInterval = this.userPollInterval || 2000;
          }
          const isSnipe = this.targetedMvp && this._bossSnipeActive;
          const isPkEvent = this.inEventMode && (this.currentEventKind === 'gw' || this.currentEventKind === 'cw');
          
          let baseDelay = userPollInterval;
          if (isSnipe || isPkEvent) {
            baseDelay = Math.min(baseDelay, 1200);
          }

          // Dynamic jitter range: ±100ms for <= 1100ms, ±120ms for <= 1500ms, ±150ms for slower
          let jitterBound = 150;
          if (baseDelay <= 1100) {
            jitterBound = 100;
          } else if (baseDelay <= 1500) {
            jitterBound = 120;
          }
          // Asymmetric jitter: 70% positive human/network lag, 30% slight lead
          const isPositiveSkew = Math.random() < 0.7;
          const jitterMag = Math.floor(Math.random() * jitterBound);
          const jitter = isPositiveSkew ? jitterMag : -Math.floor(jitterMag * 0.75);
          
          this.timer = setTimeout(runPoll, Math.max(500, baseDelay + jitter));
        }
      }
    };

    this._runPoll = runPoll;

    // Stagger startup
    this.timer = setTimeout(runPoll, Math.random() * 1000);
  }

  stop(status = 'idle') {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._runPoll = null;
    this.status = status;
    if (status === 'idle') {
      this.addLog('SYSTEM', 'Đã dừng hoạt động bot');
    }
  }

  triggerImmediatePoll() {
    if (this.status === 'running' && this._runPoll) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this._runPoll().catch(err => console.error(`[${this.name}] Immediate poll error:`, err));
    }
  }

  async sendRequest(url, payload) {
    // T46: Mọi request hành động (nâng stats/gear/skill, warp, arena...) đều đánh dấu tương tác người dùng
    if (!url.includes('xhrpg_game.php')) {
      this.pendingActFlag = true;
    }

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Throttle requests: Đảm bảo khoảng cách tối thiểu giữa các request của cùng 1 bot để tránh lỗi "too_fast"
      // 900ms cho xhrpg_game.php (khớp server-side cooldown ~900ms), 600ms cho action requests
      const minInterval = url.includes('xhrpg_game.php') ? 900 : 600;
      const now = Date.now();
      const timeSinceLast = now - (this.lastRequestAt || 0);
      if (timeSinceLast < minInterval) {
        await new Promise(r => setTimeout(r, minInterval - timeSinceLast));
      }
      this.lastRequestAt = Date.now();

      const headers = {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'user-agent': (this.fingerprint && this.fingerprint.userAgent) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'accept': '*/*',
        'accept-language': (this.fingerprint && this.fingerprint.acceptLanguage) || 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'origin': 'https://ragnalok.online',
        'referer': 'https://ragnalok.online/human/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      };

      if (this.fingerprint && this.fingerprint.chUa) {
        headers['sec-ch-ua'] = this.fingerprint.chUa;
        headers['sec-ch-ua-mobile'] = this.fingerprint.mobile;
        headers['sec-ch-ua-platform'] = this.fingerprint.platform;
      }

      const searchParams = new URLSearchParams(payload);
      const controller = new AbortController();
      const timeoutMs = 10000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs); // 10s timeout chịu trễ mạng tốt hơn
      
      const reqStartTime = Date.now();
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
        const elapsed = Date.now() - reqStartTime;
        this.ping = Math.round(this.ping ? (0.7 * this.ping + 0.3 * elapsed) : elapsed);

        try {
          const parsed = JSON.parse(text);
          clearTimeout(timeout);
          return parsed;
        } catch (e) {
          // If it returns HTML or Cloudflare challenge
          if (text.includes('cf-challenge') || text.includes('Cloudflare')) {
            throw new Error('Bị chặn bởi Cloudflare (Rate Limit/JS Challenge)');
          }
          throw new Error('Dữ liệu máy chủ trả về không hợp lệ (Không phải JSON)');
        }
      } catch (err) {
        let formattedErr = err;
        if (err.name === 'AbortError') {
          formattedErr = new Error(`Yêu cầu kết nối quá hạn (Timeout ${Math.round(timeoutMs/1000)}s)`);
        } else if (err.cause) {
          if (err.cause.code === 'ENOTFOUND') {
            const host = err.cause.hostname || 'ragnalok.online';
            formattedErr = new Error(`Lỗi DNS (ENOTFOUND): Không tìm thấy địa chỉ máy chủ ${host}`);
          } else if (err.cause.code === 'ECONNREFUSED') {
            formattedErr = new Error(`Lỗi kết nối (ECONNREFUSED): Máy chủ từ chối kết nối`);
          } else if (err.cause.code === 'ETIMEDOUT' || err.cause.code === 'UND_ERR_CONNECT_TIMEOUT') {
            formattedErr = new Error(`Lỗi kết nối Timeout (${err.cause.code})`);
          } else if (err.cause.code === 'ECONNRESET') {
            formattedErr = new Error(`Lỗi kết nối bị ngắt đột ngột (ECONNRESET)`);
          }
        }
        
        lastError = formattedErr;

        if (attempt < maxAttempts) {
          const waitTime = attempt * 500;
          console.log(`[Request Retry] Bot "${this.name}" gặp lỗi "${formattedErr.message}" khi gọi ${url.substring(url.lastIndexOf('/'))}. Đang thử lại lần ${attempt + 1}/${maxAttempts} sau ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }

  async syncOfflineZones(mapId, zoneIndices) {
    try {
      const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_offline.php', {
        line_uid: this.line_uid,
        session_token: this.session_token,
        action: 'save_zone',
        map: mapId,
        zones: JSON.stringify(zoneIndices || []),
        lang: 'vi'
      });
      if (res && res.ok) {
        this.addLog('SYSTEM', `🌙 [Offline Zone] Đã đồng bộ Zone offline thành công (Bản đồ ${mapId})`);
        return true;
      }
      return false;
    } catch (e) {
      console.error(`[Offline Zone Error] Failed to sync zones for ${this.name}:`, e.message);
      return false;
    }
  }

  processOfflineReward(offlineReward) {
    if (!offlineReward) return;
    const kills = offlineReward.kills || 0;
    const exp = offlineReward.exp || 0;
    const gold = offlineReward.gold || 0;
    const items = offlineReward.items || [];
    if (kills === 0 && exp === 0 && gold === 0 && (!items || items.length === 0)) return;

    const record = {
      receivedAt: new Date().toISOString(),
      kills,
      exp,
      gold,
      items
    };
    if (!this.offlineRewardsHistory) this.offlineRewardsHistory = [];
    this.offlineRewardsHistory.unshift(record);
    if (this.offlineRewardsHistory.length > 30) this.offlineRewardsHistory.pop();

    this.addLog('SUCCESS', `🌙 [Thưởng Offline] Nhận ${kills} quái diệt, ⚡+${exp} EXP, 💰+${gold} Gold${items && items.length > 0 ? `, 🎁 ${items.length} món đồ hiếm` : ''}!`);
  }

  async sendCheckinGuardWithRetry(maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_offline.php', {
          line_uid: this.line_uid,
          session_token: this.session_token,
          action: 'idlestat',
          k: 'chpass',
          rt: -1,
          lang: 'vi'
        });
        if (res && (res.ok || typeof res.ci === 'number')) {
          this.lastChpassSentAt = Date.now();
          this.addLog('SYSTEM', `🖐️ [Check-in Guard] Xác nhận điểm danh tương tác thành công (chpass ok, đếm ngược: ${res.ci || 'N/A'}s)`);
          return true;
        }
      } catch (err) {
        if (attempt === maxAttempts) {
          this.addLog('WARNING', `⚠️ [Check-in Guard] Gửi chpass thất bại sau ${maxAttempts} lần: ${err.message}`);
        } else {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    return false;
  }

  getCurrentMvpCycleMap() {
    if (!this.settings.mvpTargetMaps) return 1;
    const maps = this.settings.mvpTargetMaps.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    return maps[this.mvpCycleMapIndex] || 1;
  }

  triggerMvpCycle(forced = false) {
    if (!this.settings.mvpTargetMaps) {
      if (forced) {
        this.addLog('WARNING', `⚠️ Chưa cấu hình danh sách bản đồ săn Boss (mvpTargetMaps).`);
      }
      return;
    }
    const maps = this.settings.mvpTargetMaps.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (maps.length === 0) {
      if (forced) {
        this.addLog('WARNING', `⚠️ Danh sách bản đồ săn Boss không hợp lệ.`);
      }
      return;
    }

    if (this.isMvpCycling) {
      if (forced) {
        this.addLog('SYSTEM', `🔄 [Auto MVP] Reset chu kỳ săn Boss cũ để bắt đầu chu kỳ mới theo yêu cầu.`);
        this.isMvpCycling = false;
      } else {
        return;
      }
    }

    // Ghi nhớ bản đồ farm gốc (Loại trừ các map đặc biệt: 4, 5, 11, 12 để tránh kẹt map sau khi kết thúc chu kỳ)
    const currentMapNum = this.player ? Number(this.player.map) : null;
    const configuredTargetMap = parseInt(this.settings.targetMap);
    const isSpecialMap = (m) => m === 4 || m === 5 || m === 11 || m === 12;
    
    let farmMap = 1;
    if (currentMapNum && !isSpecialMap(currentMapNum)) {
      farmMap = currentMapNum;
    } else if (configuredTargetMap && !isSpecialMap(configuredTargetMap)) {
      farmMap = configuredTargetMap;
    }
    
    this.mvpCycleOriginalMap = farmMap;
    this.mvpCycleOriginalAutoMap = this.settings.autoMap;

    const nowTs = Date.now();
    this.isMvpCycling = true;
    this.mvpCycleMapIndex = 0;
    this.mvpCycleMapStayCount = 0;
    this.mvpConfirmClearCount = 0;
    this.bosses = null; // Ép tải danh sách boss trên map mới ngay lập tức
    this.mvpCycleStats = {
      cycleStartTs: nowTs,
      mapStartTs: nowTs,
      bossKilledInCycle: 0,
      bossKilledInMap: 0
    };

    this.addLog('SYSTEM', `🚀 [Auto MVP] Bắt đầu chu kỳ săn Boss xoay vòng. Bản đồ cần đi: ${maps.join(', ')}. Bản đồ farm gốc: Map ${this.mvpCycleOriginalMap}.`);
    this.addMvpLog('cycle_start', {
      maps: maps.join(', '),
      originMap: this.mvpCycleOriginalMap
    });
  }

  async updateMvpCycleStatus() {
    if (!this.player) return;

    // Pause MVP cycle while inside Guild Dungeon to prevent warp-out or map skipping conflicts
    if (this.guildDungeonActive || Number(this.player.gdun_in) === 1 || Number(this.player.map) === 12) {
      return;
    }
    
    const maps = (this.settings.mvpTargetMaps || '')
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    if (maps.length === 0 || this.settings.bossHuntMode !== 'type2') {
      this.isMvpCycling = false;
      return;
    }

    // 1. Kiểm tra giới hạn mảng map (nếu vượt quá index -> kết thúc chu kỳ)
    if (this.mvpCycleMapIndex >= maps.length) {
      this.isMvpCycling = false;
      this.mvpCycleMapIndex = 0;
      const returnMap = this.mvpCycleOriginalMap || (parseInt(this.settings.targetMap) || 1);
      this.addLog('SYSTEM', `✅ [Auto Boss] Đã đi hết danh sách bản đồ -> Quay về Map farm gốc (Map ${returnMap}).`);
      await this.warpToMap(returnMap);
      return;
    }

    const activeTargetMapId = maps[this.mvpCycleMapIndex];
    const currentMap = Number(this.player.map);

    // 2. Kiểm tra cấp độ nhân vật đối với bản đồ mục tiêu
    const mapDef = getMapDefs().find(m => m.id === activeTargetMapId);
    if (mapDef && (this.player.lv || 1) < mapDef.req) {
      this.addLog('WARNING', `⚠️ [Auto Boss] Cấp độ nhân vật (Lv.${this.player.lv || 1}) không đủ yêu cầu của Map ${activeTargetMapId} (${mapDef.name}, Yêu cầu Lv.${mapDef.req}+). Tự động bỏ qua.`);
      this.addMvpLog('map_skip_level', { mapId: activeTargetMapId, reqLv: mapDef.req, playerLv: this.player.lv || 1 });
      
      this.mvpCycleMapIndex++;
      this.mvpCycleMapStayCount = 0;
      this.mvpConfirmClearCount = 0;
      this.bosses = null;
      if (this.mvpCycleMapIndex < maps.length) {
        await this.warpToMap(maps[this.mvpCycleMapIndex]);
      } else {
        this.isMvpCycling = false;
        this.mvpCycleMapIndex = 0;
        const returnMap = this.mvpCycleOriginalMap || (parseInt(this.settings.targetMap) || 1);
        await this.warpToMap(returnMap);
      }
      return;
    }

    // 4. Nếu chưa đến được map mục tiêu sau 8 nhịp poll (~16 giây), tự động bỏ qua để tránh dính deadlock
    if (currentMap !== activeTargetMapId) {
      this.mvpTransitCount = (this.mvpTransitCount || 0) + 1;
      if (this.mvpTransitCount >= 8) {
        this.addLog('WARNING', `⚠️ [Auto Boss] Không thể di chuyển sang Map ${activeTargetMapId} sau 16s. Tự động bỏ qua map này.`);
        this.addMvpLog('map_skip_warp_failed', { mapId: activeTargetMapId });
        
        this.mvpCycleMapIndex++;
        this.mvpCycleMapStayCount = 0;
        this.mvpTransitCount = 0;
        this.mvpConfirmClearCount = 0;
        this.bosses = null;
        if (this.mvpCycleMapIndex < maps.length) {
          await this.warpToMap(maps[this.mvpCycleMapIndex]);
        } else {
          this.isMvpCycling = false;
          this.mvpCycleMapIndex = 0;
          const returnMap = this.mvpCycleOriginalMap || (parseInt(this.settings.targetMap) || 1);
          await this.warpToMap(returnMap);
        }
      }
      return;
    }

    // Đã đến đúng map mục tiêu -> Reset bộ đếm di chuyển transit và tăng bộ đếm thời gian lưu lại trên map
    this.mvpTransitCount = 0;

    let isAttackingMvp = false;
    if (this.targetedMvp && this.lastTargetedBossId !== null && this.bosses) {
      const activeBoss = this.bosses.find(b => b.id === this.lastTargetedBossId);
      if (activeBoss) {
        const dx = this.player.x - activeBoss.x;
        const dy = this.player.y - activeBoss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 5) {
          isAttackingMvp = true;
        }
      }
    }

    if (isAttackingMvp) {
      this.mvpCycleMapStayCount = 0; // Đang tấn công -> reset timeout để luôn có đủ thời gian diệt boss
    } else {
      this.mvpCycleMapStayCount++;
    }

    // 5. Quản lý danh sách Boss khi đã đến đúng map mục tiêu
    const aliveTargetBosses = this.bosses ? this.bosses.filter(b => (b.hp === undefined || (b.hp || 0) > 0)) : [];
    
    // Cập nhật bộ đếm xác nhận map sạch boss
    if (this.bosses === null) {
      // Chưa tải xong danh sách boss từ server -> Chưa xác nhận
      this.mvpConfirmClearCount = 0;
    } else if (aliveTargetBosses.length === 0) {
      this.mvpConfirmClearCount++;
    } else {
      this.mvpConfirmClearCount = 0;
    }

    const timeSpentMs = Date.now() - (this.mvpCycleStats ? (this.mvpCycleStats.mapStartTs || Date.now()) : Date.now());
    const isMapTimeout = (timeSpentMs >= 300000); // 5 phút (5 * 60 * 1000)
    // Confirm map is clear only after staying for at least 3.0 seconds (timeSpentMs >= 3000) and confirming 3 times, or if map timed out
    const isDoneWithCurrentMap = (this.mvpConfirmClearCount >= 3 && timeSpentMs >= 3000) || isMapTimeout;
    
    if (isDoneWithCurrentMap) {
      const killedCount = this.mvpCycleStats ? (this.mvpCycleStats.bossKilledInMap || 0) : 0;
      let reason = '';
      
      if (isMapTimeout) {
        reason = `Quá thời gian chờ 5 phút (Đã diệt ${killedCount} Boss)`;
        this.addLog('WARNING', `⏳ [Auto Boss] Quá thời gian lưu lại (5 phút) tại Map ${currentMap}. Tự động chuyển bản đồ.`);
        this.addMvpLog('map_timeout', {
          mapId: currentMap,
          bossKilledCount: killedCount,
          timeSpentMs
        });
      } else {
        reason = killedCount > 0 ? `Đã dọn sạch Boss (Đã diệt ${killedCount} Boss)` : 'Không có Boss mục tiêu';
        this.addMvpLog('map_clear', {
          mapId: currentMap,
          bossKilledCount: killedCount,
          timeSpentMs
        });
      }

      this.mvpCycleMapIndex++;
      this.mvpCycleMapStayCount = 0;
      this.mvpConfirmClearCount = 0; // Reset khi chuyển sang map tiếp theo
      this.bosses = null;
      if (this.mvpCycleStats) {
        this.mvpCycleStats.bossKilledInMap = 0;
        this.mvpCycleStats.mapStartTs = Date.now();
      }
      
      if (this.mvpCycleMapIndex < maps.length) {
        const nextMap = maps[this.mvpCycleMapIndex];
        this.addLog('SYSTEM', `🗺️ [Auto Boss] ${reason} tại Map ${currentMap}. Chuyển sang Map tiếp theo: Map ${nextMap}.`);
        this.addMvpLog('warp', { mapId: nextMap });
        await this.warpToMap(nextMap);
      } else {
        this.isMvpCycling = false;
        this.mvpCycleMapIndex = 0;
        const returnMap = this.mvpCycleOriginalMap || (parseInt(this.settings.targetMap) || 1);
        const totalTimeMs = Date.now() - (this.mvpCycleStats ? (this.mvpCycleStats.cycleStartTs || Date.now()) : Date.now());
        const totalKilled = this.mvpCycleStats ? (this.mvpCycleStats.bossKilledInCycle || 0) : 0;
        this.addLog('SYSTEM', `✅ [Auto Boss] ${reason} tại Map ${currentMap}. Hoàn thành chu kỳ săn Boss xoay vòng map -> Quay về Map farm gốc (Map ${returnMap}).`);
        this.addMvpLog('cycle_done', {
          totalBossKilled: totalKilled,
          totalTimeMs,
          returnMap
        });
        await this.warpToMap(returnMap);
      }
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

    // 🏰 Kiểm tra Đồng bộ Guild Dungeon đối với Member hoặc Tự động Thoát khi hạ Boss xong
    if (this.player) {
      const isMem = this.settings.teamRole === 'member';
      const mTeamId = this.settings.teamId || 'none';
      const ldr = (isMem && mTeamId !== 'none') 
        ? Object.values(botInstances).find(b => b.userId === this.userId && b.settings.teamRole === 'leader' && (b.settings.teamId || 'none') === mTeamId) 
        : null;

      if (isMem && ldr && ldr.status === 'running' && ldr.player && this.settings.teamSynced === true) {
        const isDifferentGuild = (() => {
          if (!this.player || !ldr.player) return false;
          if (this.player.gd && ldr.player.gd && this.player.gd !== ldr.player.gd) return true;
          if (this.player.guild_id && ldr.player.guild_id && this.player.guild_id !== ldr.player.guild_id) return true;
          if (this.player.guild_name && ldr.player.guild_name && this.player.guild_name !== ldr.player.guild_name) return true;
          if (this.player.g_name && ldr.player.g_name && this.player.g_name !== ldr.player.g_name) return true;
          return false;
        })();

        if (ldr.guildDungeonActive && ldr.guildDungeonIsTeam && !this.guildDungeonActive && Number(this.player.gdun_in) !== 1 && Number(this.player.map) !== 12) {
          this.addLog('SYSTEM', `🏰 [Team Member] Đồng bộ vào Phụ Bản Guild theo Trưởng nhóm (${ldr.name})...`);
          await this.enterGuildDungeon(true);
        } else if (!ldr.guildDungeonActive && !isDifferentGuild && (this.guildDungeonActive || Number(this.player.gdun_in) === 1 || Number(this.player.map) === 12)) {
          this.addLog('SYSTEM', `↩️ [Team Member] Đồng bộ thoát Phụ Bản Guild theo Trưởng nhóm (${ldr.name})...`);
          await this.exitGuildDungeon();
        }
      }

      // Safety Timer-based Fallback: Thoát Phụ Bản Guild nếu ở quá 10 phút
      if (this.guildDungeonActive && !this._exitingGuildDungeon) {
        const now = Date.now();
        const timeInDungeon = this.gdunEnteredAt ? (now - this.gdunEnteredAt) : 0;
        const shouldExitByTimer = (timeInDungeon >= 10 * 60 * 1000);                 // 10 phút tối đa

        if (shouldExitByTimer) {
          this._exitingGuildDungeon = true;
          this.addLog('WARNING', `⏳ [Guild Dungeon] Đã ở trong Phụ Bản quá 10 phút. Tự động thoát ra ngoài.`);
          await this.exitGuildDungeon();
        }
      }
    }

    // 🗺️ Định tuyến bản đồ khẩn cấp (Map Routing) & Đồng bộ Trưởng nhóm (Leader)
    if (this.player) {
      const isMember = this.settings.teamRole === 'member';
      const myTeamId = this.settings.teamId || 'none';
      const leader = (isMember && myTeamId !== 'none') 
        ? Object.values(botInstances).find(b => b.userId === this.userId && b.settings.teamRole === 'leader' && (b.settings.teamId || 'none') === myTeamId) 
        : null;
      
      let activeTargetMapId;
      let shouldWarpCheck = false;

      if (isMember && leader && leader.status === 'running' && leader.player && this.settings.teamSynced === true && this.settings.bossHuntMode && this.settings.bossHuntMode !== 'off' && leader.settings.bossHuntMode && leader.settings.bossHuntMode !== 'off' && !leader.guildDungeonActive && Number(leader.player.gdun_in) !== 1 && Number(leader.player.map) !== 12) {
        // Đồng bộ trạng thái Cycle và Map từ Leader trước
        this.isMvpCycling = leader.isMvpCycling;
        this.mvpCycleMapIndex = leader.mvpCycleMapIndex;
        this.mvpCycleOriginalMap = leader.mvpCycleOriginalMap;

        // Ưu tiên bản đồ chu kỳ hiện tại của Leader, nếu không có thì theo bản đồ hiện tại của Leader
        activeTargetMapId = leader.isMvpCycling 
          ? leader.getCurrentMvpCycleMap() 
          : (leader.player ? Number(leader.player.map) : (parseInt(leader.settings.targetMap) || 1));
          
        shouldWarpCheck = true; // Thành viên luôn đồng bộ theo Leader khi Leader đang hoạt động
      } else {
        const isMvpReturning = (!this.isMvpCycling && this.mvpCycleOriginalMap !== null);
        activeTargetMapId = this.isMvpCycling 
          ? this.getCurrentMvpCycleMap() 
          : (isMvpReturning ? Number(this.mvpCycleOriginalMap) : (parseInt(this.settings.targetMap) || 1));
          
        shouldWarpCheck = (this.settings.autoMap || (this.settings.bossHuntMode && this.settings.bossHuntMode !== 'off') || this.isMvpCycling || isMvpReturning);
      }

      if (shouldWarpCheck && !this.guildDungeonActive && !this.inEventMode && Number(this.player.gdun_in) !== 1 && Number(this.player.map) !== 12 && Number(this.player.map) !== Number(activeTargetMapId) && Number(this.player.map) !== 5) {
        const targetMapId = activeTargetMapId;
        const mapDef = getMapDefs().find(m => m.id === targetMapId);
        if (mapDef && (this.player.lv || 1) >= mapDef.req) {
          if (isMember && leader) {
            this.addLog('SYSTEM', `👥 [Team Member] Đồng bộ di chuyển theo Trưởng nhóm (${leader.name}) sang Map ${targetMapId}`);
          } else {
            this.addLog('SYSTEM', `🗺️ [Tự động] Phát hiện sai bản đồ (Đang ở: Map ${this.player.map}, Cần đi: Map ${targetMapId}). Tiến hành di chuyển...`);
          }
          try {
            if (targetMapId === 4) {
              const currentEpoch = Math.floor(Date.now() / 1000);
              const isGwActive = this.lastGw && (this.lastGw.st === 'open' || this.lastGw.st === 'fight') && (!this.lastGw.ends || this.lastGw.ends > currentEpoch);
              const isCwActive = this.lastCw && (this.lastCw.st === 'open' || this.lastCw.st === 'fight') && (!this.lastCw.ends || this.lastCw.ends > currentEpoch);

              let ok = false;
              if (isGwActive) {
                ok = await this.joinGuildWar();
              } else if (isCwActive) {
                ok = await this.joinCountryWar();
              } else {
                this.addLog('WARNING', `⚠️ Sự kiện Bang/Quốc chiến không hoạt động hoặc đã kết thúc. Tự động thoát chế độ Event.`);
                this.exitEventMode();
                return;
              }
              if (ok) {
                this.enterEventMode(isGwActive ? 'gw' : 'cw', 4);
                return;
              }
            } else {
              await this.warpToMap(targetMapId);
              // Warp thành công, kết thúc sớm nhịp poll hiện tại để nhịp tiếp theo chạy trên map mới
              return;
            }
          } catch (e) {
            this.addLog('ERROR', `Lỗi di chuyển bản đồ khẩn cấp: ${e.message}`);
          }
        }
      }
    }

    // ⏰ Check scheduled MVP Boss Hunting Cycle (Round hours only, first 3 minutes of the hour)
    const nowTime = new Date();
    const currentHour = nowTime.getHours();
    const currentMinute = nowTime.getMinutes();
    if (this.settings.bossHuntMode === 'type2' && this.settings.mvpTargetMaps && this.settings.teamRole !== 'member') {
      if (currentMinute <= 2 && this.lastMvpCycleCheckHour !== currentHour) {
        this.lastMvpCycleCheckHour = currentHour;
        this.addLog('SYSTEM', `⏰ [Auto Boss] Đến giờ tròn (${currentHour}:00). Tự động kích hoạt chu kỳ săn Boss xoay vòng map...`);
        this.triggerMvpCycle();
      }
    }

    // ⏰ Check scheduled Guild Dungeon auto-entry (At XX:30:05 every hour)
    if (this.settings.autoEnterGdunAt30 && this.player) {
      const nowTime = new Date();
      const currentHour = nowTime.getHours();
      const currentMinute = nowTime.getMinutes();
      const currentSecond = nowTime.getSeconds();

      if (currentMinute === 30 && currentSecond >= 5 && currentSecond <= 20 && this.lastGdunAutoEnterHour !== currentHour) {
        this.lastGdunAutoEnterHour = currentHour;
        if (!this.guildDungeonActive && Number(this.player.gdun_in) !== 1 && Number(this.player.map) !== 12 && !this.inEventMode) {
          const isTeam = this.settings.guildDungeonIsTeam === true;
          const modeTxt = isTeam ? 'Cả Team' : 'Cá nhân';
          this.addLog('SYSTEM', `⏰ [Auto Boss Guild] Đến phút thứ 30:05. Tự động kích hoạt ${modeTxt} vào Phụ Bản Guild...`);
          
          if (isTeam) {
            await this.enterGuildDungeon(true);
            const myTeamId = this.settings.teamId || 'none';
            if (myTeamId !== 'none') {
              const members = Object.values(botInstances).filter(b => 
                b.userId === this.userId && 
                b.settings.teamRole === 'member' && 
                (b.settings.teamId || 'none') === myTeamId &&
                b.settings.teamSynced === true &&
                b.status === 'running'
              );
              for (const mem of members) {
                mem.enterGuildDungeon(true).catch(() => {});
              }
            }
          } else {
            await this.enterGuildDungeon(false);
          }
        }
      }
    }

    // Request full payload every 2 polls or when monsters/bosses empty for fast spawn detection
    // Enforce isFull = 1 during MVP Cycle on the correct target map to ensure the latest boss list is retrieved
    const isCorrectMvpMap = !this.isMvpCycling || (this.player && Number(this.player.map) === Number(this.getCurrentMvpCycleMap()));
    const isFull = ((this.pollCount % 2 === 0) || this.targetedMvp || this.bosses === null || !this.monsters || this.monsters.length === 0 || this.guildDungeonActive || (this.player && (Number(this.player.gdun_in) === 1 || Number(this.player.map) === 12)) || (this.isMvpCycling && isCorrectMvpMap)) ? 1 : 0;

    // 😴 Anti-idle: Tính act flag mô phỏng hành vi người dùng thật
    // - Poll đầu tiên = act=1 (giống user vừa load trang/F5)
    // - Khi có tương tác người dùng / tự động (this.pendingActFlag) = act=1 ở poll tiếp theo, khớp client gốc
    // - Khi AFK đứng yên = act=1 nhịp log-normal phân phối tự nhiên (~2 - 6 phút)
    const now = Date.now();
    let actValue = 0;
    if (this.pollCount === 1) {
      actValue = 1;
      this.lastActSentAt = now;
      this.nextActInterval = logNormalActInterval();
      this.pendingActFlag = false;
    } else if (this.pendingActFlag) {
      actValue = 1;
      this.lastActSentAt = now;
      this.nextActInterval = logNormalActInterval();
      this.pendingActFlag = false;
    } else if ((now - this.lastActSentAt) >= this.nextActInterval) {
      actValue = 1;
      this.lastActSentAt = now;
      this.nextActInterval = logNormalActInterval();
    }
    
    let exploreCx = this.player ? (this.settings.explore_cx || this.player.x) : this.settings.explore_cx;
    let exploreCy = this.player ? (this.settings.explore_cy || this.player.y) : this.settings.explore_cy;
    let exploreRadius = this.settings.explore_radius;
    let traveling = 0;
    this.targetedMvp = false;
    let lockPos = this.settings.lock_pos ? 1 : 0;

    // 0. Auto Event PK Targeting (Priority 0 when in PK Event Mode)
    let targetedPk = false;
    if (this.inEventMode && (this.currentEventKind === 'gw' || this.currentEventKind === 'cw')) {
      const alivePlayers = (this.others) ? this.others.filter(p => !p.is_dead) : [];
      if (alivePlayers.length > 0) {
        const px = this.player ? this.player.x : 0;
        const py = this.player ? this.player.y : 0;
        const attackRange = this.settings.eventAttackRange || 300;
        
        let scanPlayers = alivePlayers.map(p => {
          const dx = px - p.x;
          const dy = py - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return { ...p, dist };
        }).filter(p => p.dist <= attackRange);
        
        if (scanPlayers.length > 0) {
          // Sort by defense if enabled
          if (this.settings.eventTargetMinDef) {
            scanPlayers.sort((a, b) => {
              const defA = this.getPlayerDef(a.name);
              const defB = this.getPlayerDef(b.name);
              return defA - defB;
            });
          } else {
            // Otherwise sort by distance
            scanPlayers.sort((a, b) => a.dist - b.dist);
          }
          
          const activePlayer = scanPlayers[0];
          targetedPk = true;
          this.targetedMvp = true; // Set this to bypass normal farming/MVP logic
          
          const tx = activePlayer.x;
          const ty = activePlayer.y;
          const dx = px - tx;
          const dy = py - ty;
          const dist = activePlayer.dist;
          
          const MIN_DIST = 15;
          const MAX_DIST = 20;
          const TARGET_KITE_DIST = 17.5;
          
          if (dist > MAX_DIST || dist < MIN_DIST) {
            const ux = dist > 0 ? dx / dist : 1;
            const uy = dist > 0 ? dy / dist : 0;
            exploreCx = Math.round((tx + ux * TARGET_KITE_DIST) * 100) / 100;
            exploreCy = Math.round((ty + uy * TARGET_KITE_DIST) * 100) / 100;
            traveling = 1;
            lockPos = 0;
            exploreRadius = 300;
          } else {
            exploreCx = tx;
            exploreCy = ty;
            traveling = 0;
            lockPos = 1;
            exploreRadius = 100;
          }
          
          // Trigger fetch in background
          if (activePlayer.uid || activePlayer.line_uid || activePlayer.id) {
            const targetUid = activePlayer.uid || activePlayer.line_uid || activePlayer.id;
            this.fetchPlayerDefBackground(activePlayer.name, targetUid);
          }
          
          if (this.pollCount % 5 === 0) {
            const cacheData = this.playerDefCache[activePlayer.name];
            const defStr = cacheData ? `Giáp: ${cacheData.def}` : 'Giáp: Quét...';
            this.addLog('SYSTEM', `⚔️ [Event PK] Khóa mục tiêu: 🧑 ${activePlayer.name} (${defStr} - Khoảng cách: ${Math.round(dist)}m)`);
          }
        }
      }
    }

    // 0. Auto World Tree Boss Event (Priority 0 when in Invasion Event Mode)
    if (this.inEventMode && this.currentEventKind === 'inv') {
      const px = this.player ? this.player.x : 1125;
      const py = this.player ? this.player.y : 1125;
      const dx = px - 1125;
      const dy = py - 1125;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      
      exploreCx = 1125;
      exploreCy = 1125;
      exploreRadius = 50; // Giới hạn phạm vi hoạt động ở tâm bản đồ
      this.targetedMvp = true; // Bỏ qua cơ chế săn MVP khác hoặc farm thường
      
      if (distToCenter > 15) {
        traveling = 1;
        lockPos = 0;
      } else {
        traveling = 0;
        lockPos = 1;
      }
      
      if (this.pollCount % 10 === 0) {
        this.addLog('SYSTEM', `🌳 [Event Cây Thế Giới] Đang đứng ở tâm bản đồ (Khóa vị trí để đánh Boss)`);
      }
    }

    // 0.5 Guild Dungeon Targeting (Chủ động nhắm và tấn công Boss/Quái trong Phụ Bản Guild)
    if (this.guildDungeonActive) {
      const px = this.player ? this.player.x : 1125;
      const py = this.player ? this.player.y : 1125;

      const sortPool = (pool) => {
        if (this.settings.bossHuntMode === 'type2') {
          return [...pool].sort((a, b) => (a.hp || 0) - (b.hp || 0));
        } else {
          if (this.settings.mvpPriorityMode === 'level_asc') {
            return [...pool].sort((a, b) => (a.lv || 0) - (b.lv || 0));
          } else if (this.settings.mvpPriorityMode === 'level_desc') {
            return [...pool].sort((a, b) => (b.lv || 0) - (a.lv || 0));
          } else {
            // Khoảng cách
            return [...pool].sort((a, b) => {
              const distA = Math.sqrt((px - a.x) * (px - a.x) + (py - a.y) * (py - a.y));
              const distB = Math.sqrt((px - b.x) * (px - b.x) + (py - b.y) * (py - b.y));
              return distA - distB;
            });
          }
        }
      };

      const aliveBosses = (this.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));
      const sortedBosses = sortPool(aliveBosses);
      // Chỉ nhắm mục tiêu vào Boss Guild, bỏ qua hoàn toàn quái thường
      const dungeonTargets = sortedBosses;

      if (dungeonTargets.length > 0) {
        const target = dungeonTargets[0];
        this.targetedMvp = true;
        this.mvpConfirmClearCount = 0; // Reset clear count vì vẫn còn mục tiêu

        // Cập nhật thông tin boss đang săn để hiển thị trên Dashboard
        if (!this.currentMvpBossInfo || this.currentMvpBossInfo.id !== target.id) {
          this.currentMvpBossInfo = {
            id: target.id,
            name: target.name || 'Boss Guild',
            emoji: '🏰',
            lv: target.lv || 1,
            mapId: 12,
            startTs: Date.now()
          };
        }
        this.lastTargetedBossId = target.id;

        const dx = px - target.x;
        const dy = py - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Định cấu hình khoảng cách an toàn dựa trên vũ khí đang sử dụng
        const isUsingDaoDai = this.player && (Number(this.player.active_gun) === 1);
        const MIN_BOSS_DIST = isUsingDaoDai ? 55 : 30;
        const MAX_BOSS_DIST = isUsingDaoDai ? 65 : 40;
        const TARGET_KITE_DIST = isUsingDaoDai ? 60 : 35;

        // Tính toán Snipe Mode nếu Boss có đầy đủ thông số HP
        if (target.hp !== undefined && target.hp_max) {
          const bossHpPct = Math.round(target.hp / target.hp_max * 100);
          this._bossSnipeActive = (bossHpPct <= 30);
          if (this._bossSnipeActive && !this._snipeLoggedOnce) {
            this._snipeLoggedOnce = true;
            this.addLog('SYSTEM', `⚡ [Snipe Mode] Boss Guild ${target.name || 'Boss'} HP xuống ${bossHpPct}% -> Tăng tốc tấn công!`);
          }
        }

        if (dist > MAX_BOSS_DIST || dist < MIN_BOSS_DIST) {
          const ux = dist > 0 ? dx / dist : 1;
          const uy = dist > 0 ? dy / dist : 0;
          exploreCx = Math.round((target.x + ux * TARGET_KITE_DIST) * 100) / 100;
          exploreCy = Math.round((target.y + uy * TARGET_KITE_DIST) * 100) / 100;
          traveling = 1;
          lockPos = 0;
          exploreRadius = 300;
        } else {
          exploreCx = target.x;
          exploreCy = target.y;
          traveling = 0;
          lockPos = 1; // Khóa vị trí để xả dps
          exploreRadius = 100;
        }
      } else {
        this.currentMvpBossInfo = null;
        this.lastTargetedBossId = null;
      }
    }

    // 1. Auto MVP Hunting (Priority 1)
    // isCorrectMvpMap is already defined above for isFull calculation
    const isHuntingEnabled = this.settings.bossHuntMode !== 'off';
    
    if (isHuntingEnabled && isCorrectMvpMap && !this.guildDungeonActive && this.bosses && this.bosses.length > 0) {
      const aliveBosses = this.bosses.filter(b => (b.hp === undefined || (b.hp || 0) > 0));

      if (aliveBosses.length > 0) {
        let targetPool = aliveBosses;

        // Sort target pool based on settings
        const px = this.player ? this.player.x : 0;
        const py = this.player ? this.player.y : 0;

        if (this.settings.bossHuntMode === 'type2') {
          // Type 2: Sort by absolute remaining HP ascending (lowest HP first)
          targetPool.sort((a, b) => (a.hp || 0) - (b.hp || 0));
        } else {
          // Type 1: Sort by Priority Mode (distance, level_asc, level_desc)
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
        }

        let activeBoss = null;

        // 👥 Nếu là Member, ưu tiên tuyệt đối mục tiêu Boss của Leader
        if (this.settings.teamRole === 'member') {
          const myTeamId = this.settings.teamId || 'none';
          const leader = myTeamId !== 'none' 
            ? Object.values(botInstances).find(b => b.userId === this.userId && b.settings.teamRole === 'leader' && (b.settings.teamId || 'none') === myTeamId) 
            : null;
          if (leader && leader.status === 'running' && leader.player && this.settings.teamSynced === true && this.settings.bossHuntMode && this.settings.bossHuntMode !== 'off' && leader.settings.bossHuntMode && leader.settings.bossHuntMode !== 'off') {
            const leaderTargetId = leader.manualTargetBossId !== null ? leader.manualTargetBossId : leader.lastTargetedBossId;
            if (leaderTargetId !== null) {
              activeBoss = aliveBosses.find(b => b.id === leaderTargetId);
              if (activeBoss) {
                this.manualTargetBossId = leaderTargetId; // Đồng bộ luôn khóa mục tiêu thủ công nếu có
              }
            }
          }
        }

        // Nếu không đồng bộ từ leader (hoặc leader không có target), chạy bình thường
        if (!activeBoss) {
          if (this.manualTargetBossId !== null) {
            activeBoss = aliveBosses.find(b => b.id === this.manualTargetBossId);
            if (!activeBoss) {
              // Boss đã chết hoặc không còn trên map -> reset về tự động
              this.manualTargetBossId = null;
              this.addLog('SYSTEM', '🎯 [Manual Target] Boss chỉ định đã biến mất hoặc chết. Quay lại chế độ tự động.');
            }
          }
          if (!activeBoss) {
            activeBoss = targetPool[0];
          }
        }
        if (activeBoss) {
          this.targetedMvp = true;
          this.mvpConfirmClearCount = 0; // Reset confirm clear vì vẫn còn boss đang sống

          // Log when a new boss is first targeted
          if (this.lastTargetedBossId !== activeBoss.id) {
            if (this.lastTargetedBossId !== null) {
              this.logTargetBossCompletion();
            }
            this.lastTargetedBossId = activeBoss.id;
            this._lastBossStatusLogAt = 0; // Force immediate status log for the new boss
            
            // Get actual spawn time from bossSpawnTimes, fallback to Date.now()
            const spawnTs = this.bossSpawnTimes[activeBoss.id] || Date.now();
            
            this.currentMvpBossInfo = {
              id: activeBoss.id,
              name: activeBoss.name || 'Boss',
              emoji: activeBoss.emoji || '👾',
              lv: activeBoss.lv || 1,
              mapId: Number(this.player ? this.player.map : 0),
              startTs: spawnTs
            };
            this.addLog('SYSTEM', `⚔️ [Auto Boss] Nhắm mục tiêu: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (HP: ${activeBoss.hp}/${activeBoss.hp_max} - Lv.${activeBoss.lv || 1})`);
            this.addMvpLog('boss_found', {
              bossName: activeBoss.name || 'Boss',
              bossEmoji: activeBoss.emoji || '👾',
              bossLv: activeBoss.lv || 1,
              mapId: Number(this.player ? this.player.map : 0),
              hpPct: Math.round((activeBoss.hp || 0) / (activeBoss.hp_max || 1) * 100)
            });
          }

          if (this.player) {
            const dx = this.player.x - activeBoss.x;
            const dy = this.player.y - activeBoss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Cấu hình duy trì khoảng cách an toàn với Boss (Động theo loại vũ khí: Dao dài vs Dao găm)
            const isUsingDaoDai = this.player && (Number(this.player.active_gun) === 1);
            const MIN_BOSS_DIST = isUsingDaoDai ? 55 : 30;
            const MAX_BOSS_DIST = isUsingDaoDai ? 65 : 40;
            const TARGET_KITE_DIST = isUsingDaoDai ? 60 : 35;

            // Kiểm tra trạng thái kích hoạt Snipe Mode (HP <= 30%)
            const bossHpPct = Math.round((activeBoss.hp || 0) / (activeBoss.hp_max || 1) * 100);
            this._bossSnipeActive = (bossHpPct <= 30);

            if (this._bossSnipeActive && !this._snipeLoggedOnce) {
              this._snipeLoggedOnce = true;
              this.addLog('SYSTEM', `⚡ [Snipe Mode] Boss ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} HP xuống ${bossHpPct}% -> Kích hoạt tăng tốc tấn công!`);
            }

            const nowMs = Date.now();
            const shouldLogStatus = (nowMs - (this._lastBossStatusLogAt || 0)) >= 5000;

            if (dist > MAX_BOSS_DIST || dist < MIN_BOSS_DIST) {
              // Tính vector đơn vị hướng từ Boss đến Player
              const ux = dist > 0 ? dx / dist : 1;
              const uy = dist > 0 ? dy / dist : 0;

              // Tọa độ mục tiêu di chuyển/kiting duy trì khoảng cách an toàn
              exploreCx = Math.round((activeBoss.x + ux * TARGET_KITE_DIST) * 100) / 100;
              exploreCy = Math.round((activeBoss.y + uy * TARGET_KITE_DIST) * 100) / 100;
              traveling = 1;
              lockPos = 0;
              exploreRadius = 300;

              if (shouldLogStatus) {
                this._lastBossStatusLogAt = nowMs;
                const distRangeStr = `${MIN_BOSS_DIST}-${MAX_BOSS_DIST}m`;
                if (dist > MAX_BOSS_DIST) {
                  this.addLog('SYSTEM', `⚔️ [Auto Boss] Đang di chuyển lại gần Boss: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (Khoảng cách: ${Math.round(dist)}m -> Ngưỡng an toàn ${distRangeStr})`);
                } else {
                  this.addLog('SYSTEM', `🛡️ [Auto Boss] Boss lại quá gần (${Math.round(dist)}m < ${MIN_BOSS_DIST}m) -> Lùi lại giữ khoảng cách an toàn ${TARGET_KITE_DIST}m`);
                }
              }
            } else {
              // Đã ở khoảng cách an toàn hoàn hảo
              exploreCx = activeBoss.x;
              exploreCy = activeBoss.y;
              traveling = 0;
              lockPos = 1; // Khóa vị trí khi đã ở khoảng cách an toàn để dồn toàn bộ DPS
              exploreRadius = 100;

              if (shouldLogStatus) {
                this._lastBossStatusLogAt = nowMs;
                this.addLog('SYSTEM', `⚔️ [Auto Boss] Đang tấn công Boss ở khoảng cách an toàn: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (Khoảng cách: ${Math.round(dist)}m [${MIN_BOSS_DIST}-${MAX_BOSS_DIST}m], HP: ${bossHpPct}%)`);
              }
            }
          } else {
            exploreCx = activeBoss.x;
            exploreCy = activeBoss.y;
          }
        }
      }
    }

    // Tự động hủy trạng thái nhắm boss trong im lặng nếu nhân vật đã đổi map (manual warp hoặc auto warp)
    if (this.lastTargetedBossId !== null && this.player && this.currentMvpBossInfo && Number(this.player.map) !== Number(this.currentMvpBossInfo.mapId)) {
      if (this.currentMvpBossInfo && this.currentMvpBossInfo.id) {
        delete this.bossSpawnTimes[this.currentMvpBossInfo.id];
      }
      this.lastTargetedBossId = null;
      this.currentMvpBossInfo = null;
      this._bossSnipeActive = false;
      this._snipeLoggedOnce = false;
      this.weKilledCurrentMvp = false;
    }

    // Clear targeted boss state and log when done
    if (!this.targetedMvp && this.lastTargetedBossId !== null) {
      this.logTargetBossCompletion();
    }

    // 2. Auto Zone checking (Priority 2, only runs if no MVP is being targeted)
    const canRunAutoZone = !this.isMvpCycling || (this.player && Number(this.player.map) === Number(this.getCurrentMvpCycleMap()));
    if (!this.targetedMvp && !this.guildDungeonActive && canRunAutoZone && this.settings.autoZone && this.spots) {
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

    // 🕒 T62 Proactive Token Renewal: Tự động gia hạn session token mỗi 20 phút để tránh mốc hết hạn của Game Server
    if (this.phpsessid && (Date.now() - this.lastSessionRefreshAt > 20 * 60 * 1000)) {
      this.addLog('SYSTEM', '🕒 Đạt mốc 20 phút -> Tự động gia hạn Session Token để duy trì phiên Online 24/7');
      await this.refreshSession();
    }

    const payload = {
      line_uid: this.line_uid,
      session_token: this.session_token,
      manual_dir: '',
      act: 1,  // ⚡ Ép 100% act=1 cho mọi poll request để tối đa hóa tốc độ diệt quái (Request-Tick)
      full: isFull,
      bot: this.settings.bot ? 1 : 0,
      lock_pos: lockPos,
      explore_radius: exploreRadius,
      explore_cx: (lockPos || traveling === 0) ? exploreCx : naturalCoordNoise(exploreCx, 18),
      explore_cy: (lockPos || traveling === 0) ? exploreCy : naturalCoordNoise(exploreCy, 18),
      traveling: traveling,
      auto_potion_threshold: this.settings.auto_potion_threshold,
      have_static: (this.spots && this.mon_masters) ? 1 : 0,
      lang: 'vi'
    };

    const d = await this.sendRequest('https://ragnalok.online/human/xhrpg_game.php', payload);

    if (d.kicked) {
      if (this.phpsessid) {
        this.addLog('SYSTEM', '⚠️ Game Server báo Kicked/Session Expired (Dính mốc 1h) -> Kích hoạt Auto-Relogin khẩn cấp...');
        const ok = await this.refreshSession();
        if (ok) {
          this.addLog('SYSTEM', '🚀 Auto-Relogin bằng PHPSESSID thành công! Đang tiếp tục luồng Polling Online...');
          this.consecutiveErrors = 0;
          return;
        }
      }
      this.status = 'failed';
      this.error = 'Tài khoản bị kick hoặc hết hạn phiên (Chưa cấu hình PHPSESSID hợp lệ)';
      this.addLog('ERROR', 'Tài khoản bị đăng xuất (đăng nhập từ nơi khác hoặc hết hạn phiên)');
      this.stop('failed');
      return;
    }

    // 😴 T46: Handle server idle response — force act=1 ngay poll tiếp theo để phục hồi
    // Server trả d.idle=true khi last_action_at quá lâu
    if (d.idle) {
      this.lastActSentAt = 0;   // Force act=1 ở poll tiếp theo
      this.nextActInterval = 0; // Interval = 0 → gửi ngay
      this.pendingActFlag = true;
      this.lastUpdate = new Date().toISOString();
      this.error = null;
      this.addLog('SYSTEM', '😴 Server phát hiện Idle Signal -> Kích hoạt khôi phục tương tác khẩn cấp (act=1 forced)');
      return;
    }

    if (!d.ok) {
      this.error = d.error || 'Yêu cầu game trả về thất bại';
      if (this.phpsessid && (String(this.error).toLowerCase().includes('token') || String(this.error).toLowerCase().includes('session') || String(this.error).toLowerCase().includes('kick'))) {
        this.addLog('SYSTEM', `⚠️ Phát hiện lỗi phiên (${this.error}) -> Đang thử Auto-Relogin qua PHPSESSID...`);
        const ok = await this.refreshSession();
        if (ok) return;
      }
      this.addLog('ERROR', `Lỗi: ${this.error}`);
      return;
    }

    // 🖐️ Auto Check-in Guard: Tự động gia hạn điểm danh server (chpass) định kỳ 10 phút hoặc khi ci <= 300s
    const nowCheckin = Date.now();
    const needsCheckin = (typeof d.ci === 'number' && d.ci <= 300) || (nowCheckin - (this.lastChpassSentAt || 0) > 10 * 60 * 1000);
    if (needsCheckin && (nowCheckin - (this.lastChpassSentAt || 0) > 30000)) {
      this.lastChpassSentAt = nowCheckin;
      this.sendCheckinGuardWithRetry();
    }

    // Capture & log offline rewards if returned
    if (d.offline_reward) {
      this.processOfflineReward(d.offline_reward);
    }

    // Capture Trade Invites
    if (d.trade_inv) {
      this.tradeInvite = d.trade_inv;
    } else {
      this.tradeInvite = null;
    }


    // Save spots list for map & process passive map discovery
    if (d.spots) {
      this.spots = d.spots;
      const currentMapId = (d.map != null) ? Number(d.map) : (d.player ? Number(d.player.map) : null);
      if (currentMapId) {
        spotsCache[currentMapId] = d.spots;
        saveSpotsCache();
        processPassiveMapDiscovery(currentMapId, d.spots);
      }
    }

    // Save monsters list
    if (d.monsters) {
      this.monsters = d.monsters;
    } else if (isFull) {
      this.monsters = [];
    }

    // Save bosses list and track spawn times
    if (d.bosses) {
      this.bosses = d.bosses;
    } else if (isFull) {
      this.bosses = [];
    }

    if (d.others) {
      this.others = d.others;
    } else {
      this.others = [];
    }

    // Save event details
    if (d.inv !== undefined) {
      this.lastInv = d.inv;
    } else if (isFull) {
      this.lastInv = null;
    }
    if (d.gw !== undefined) {
      this.lastGw = d.gw;
    } else if (isFull) {
      this.lastGw = null;
    }
    if (d.cw !== undefined) {
      this.lastCw = d.cw;
    } else if (isFull) {
      this.lastCw = null;
    }

    // 🏰 Tự động thoát Phụ Bản Guild khi sạch Boss (chỉ đánh Boss và thoát ngay khi hết Boss)
    if (this.guildDungeonActive && !this._exitingGuildDungeon) {
      const timeInDungeon = this.gdunEnteredAt ? (Date.now() - this.gdunEnteredAt) : 0;
      // Chỉ bắt đầu kiểm tra và đếm poll trống sau khi vào phụ bản ít nhất 3 giây để chờ server spawn quái/boss
      if (timeInDungeon >= 3000 && this.bosses !== null) {
        const aliveBosses = (this.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));
        const hasTargets = (aliveBosses.length > 0);

        if (!hasTargets) {
          this.gdunEmptyPolls = (this.gdunEmptyPolls || 0) + 1;
          if (this.gdunEmptyPolls >= 5) {
            this._exitingGuildDungeon = true;
            this.addLog('SUCCESS', `🎉 [Guild Dungeon] Đã sạch Boss trong Phụ Bản! Tự động thoát Phụ Bản ra ngoài.`);
            await this.exitGuildDungeon();
          }
        } else {
          this.gdunEmptyPolls = 0;
        }
      }
    }

    const currentEpoch = Math.floor(Date.now() / 1000);
    const isInvActive = this.lastInv && (this.lastInv.st === 'pre' || this.lastInv.st === 'active') && (!this.lastInv.ends || this.lastInv.ends > currentEpoch);
    const isGwActive = this.lastGw && (this.lastGw.st === 'open' || this.lastGw.st === 'fight') && (!this.lastGw.ends || this.lastGw.ends > currentEpoch);
    const isCwActive = this.lastCw && (this.lastCw.st === 'open' || this.lastCw.st === 'fight') && (!this.lastCw.ends || this.lastCw.ends > currentEpoch);

    // Auto-join event
    const shouldCheckEventJoin = (this.settings.autoEventJoinInv || this.settings.autoEventJoinGw || this.settings.autoEventJoinCw);
    if (shouldCheckEventJoin && !this.inEventMode) {
      const currentPlayer = d.player || this.player;
      if (currentPlayer && !currentPlayer.is_dead) {
        const playerLv = currentPlayer.lv || 1;
        const playerMap = Number(currentPlayer.map);
        const isAtHome = !this.isMvpCycling && playerMap === 5 && (currentPlayer.home_crops !== undefined || currentPlayer.home_lv !== undefined);

        if (!isAtHome) {
          if (isInvActive && this.settings.autoEventJoinInv) {
            const map2Def = getMapDefs().find(m => m.id === 2);
            const req2 = map2Def ? map2Def.req : 25;
            if (playerLv >= req2) {
              if (playerMap === 2) {
                this.enterEventMode('inv', 2);
              } else {
                const ok = await this.warpToMap(2);
                if (ok) {
                  this.enterEventMode('inv', 2);
                }
              }
            } else if (this.pollCount % 30 === 0) {
              this.addLog('WARNING', `⚠️ [Auto Event] Không thể tham gia Invasion: Cấp độ nhân vật (Lv.${playerLv}) chưa đủ yêu cầu (Lv.${req2}+)`);
            }
          } else if (isGwActive && this.settings.autoEventJoinGw) {
            const map4Def = getMapDefs().find(m => m.id === 4);
            const req4 = map4Def ? map4Def.req : 20;
            if (playerLv >= req4) {
              if (playerMap === 4) {
                this.enterEventMode('gw', 4);
              } else {
                const ok = await this.joinGuildWar();
                if (ok) {
                  this.enterEventMode('gw', 4);
                }
              }
            } else if (this.pollCount % 30 === 0) {
              this.addLog('WARNING', `⚠️ [Auto Event] Không thể tham gia Guild War: Cấp độ nhân vật (Lv.${playerLv}) chưa đủ yêu cầu (Lv.${req4}+)`);
            }
          } else if (isCwActive && this.settings.autoEventJoinCw) {
            const map4Def = getMapDefs().find(m => m.id === 4);
            const req4 = map4Def ? map4Def.req : 20;
            if (playerLv >= req4) {
              if (playerMap === 4) {
                this.enterEventMode('cw', 4);
              } else {
                const ok = await this.joinCountryWar();
                if (ok) {
                  this.enterEventMode('cw', 4);
                }
              }
            } else if (this.pollCount % 30 === 0) {
              this.addLog('WARNING', `⚠️ [Auto Event] Không thể tham gia Country War: Cấp độ nhân vật (Lv.${playerLv}) chưa đủ yêu cầu (Lv.${req4}+)`);
            }
          }
        }
      }
    }

    // Auto-resume after event ends
    if (this.inEventMode) {
      if (this.currentEventKind === 'inv' && !isInvActive) {
        this.exitEventMode();
      } else if (this.currentEventKind === 'gw' && !isGwActive) {
        this.exitEventMode();
      } else if (this.currentEventKind === 'cw' && !isCwActive) {
        this.exitEventMode();
      }
    }

    // Kích hoạt lấy log tự động định kỳ trong đấu trường sự kiện
    if (this.inEventMode && (this.currentEventKind === 'gw' || this.currentEventKind === 'cw') && this.pollCount % 15 === 0) {
      this.fetchWarLog().catch(() => {});
    }

    if (this.bosses) {
      const nowTs = Date.now();
      const aliveBosses = this.bosses.filter(b => (b.hp === undefined || (b.hp || 0) > 0));
      
      // Track newly appeared bosses
      aliveBosses.forEach(b => {
        if (!this._bossNameCache) this._bossNameCache = {};
        this._bossNameCache[b.id] = `${b.emoji || '👾'} ${b.name || 'Boss'} (Lv.${b.lv || 1})`;

        if (!this.bossSpawnTimes[b.id]) {
          this.bossSpawnTimes[b.id] = nowTs;
          const timeStr = new Date(nowTs).toLocaleTimeString('vi-VN');
          this.addLog('SYSTEM', `👁️ [Auto Boss] Phát hiện Boss xuất hiện: ${b.emoji || '👾'} ${b.name || 'Boss'} (Lv.${b.lv || 1}) lúc ${timeStr}!`);
        }
      });
      
      // Cleanup bosses that are no longer alive or not on the map anymore from spawn times
      const aliveIds = new Set(aliveBosses.map(b => b.id));
      Object.keys(this.bossSpawnTimes).forEach(id => {
        if (!aliveIds.has(Number(id))) {
          // Nếu boss biến mất và KHÔNG phải là target hiện tại (vì target hiện tại đã được log riêng ở logTargetBossCompletion)
          if (Number(id) !== this.lastTargetedBossId) {
            const bossInfo = this._bossNameCache ? (this._bossNameCache[id] || `Boss #${id}`) : `Boss #${id}`;
            this.addLog('WARNING', `👁️ [Auto Boss] Boss ${bossInfo} đã bị tiêu diệt hoặc mất dấu (không phải mục tiêu chính).`);
          }
          delete this.bossSpawnTimes[id];
        }
      });
    }

    // Save mon_masters list (crawled live from game server)
    if (d.mon_masters) {
      processMonMasters(d.mon_masters);
      this.mon_masters = d.mon_masters;
    }

    // Update player
    const prevP = this.player;
    this.updatePlayerState(d.player);
    this.lastUpdate = new Date().toISOString();
    this.error = null;

    // Urgent Active Potion Healing (Active Potion Healing)
    if (this.player && !this.player.is_dead) {
      const maxHp = this.player.hp_max_eff || this.player.hp_max || 100;
      const hpPct = Math.min(100, Math.round((this.player.hp / maxHp) * 100));
      
      let shouldActiveHeal = false;
      let healReason = '';

      if (this.settings.activeHealEnabled && hpPct < Number(this.settings.activeHealThreshold || 50)) {
        shouldActiveHeal = true;
        healReason = `HP dưới ${this.settings.activeHealThreshold}% (Chủ động)`;
      } else if (this.inEventMode && this.settings.eventPotionThreshold > 0 && hpPct < this.settings.eventPotionThreshold) {
        shouldActiveHeal = true;
        healReason = `HP dưới ${this.settings.eventPotionThreshold}% (Sự kiện)`;
      }

      if (shouldActiveHeal) {
        this.addLog('HEAL', `💊 [Urgent Potion] ${healReason} -> Bơm máu khẩn cấp!`);
        this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
          line_uid: this.line_uid,
          session_token: this.session_token,
          action: 'use_potion_manual'
        }).then(res => {
          if (res && res.ok && res.player) {
            this.updatePlayerState(res.player);
          }
        }).catch(e => {
          console.error(`[Urgent Potion Error] Failed to use potion:`, e.message);
        });
      }
    }

    // Check if we just completed a cycle and need to restore autoMap
    const wasMvpReturning = (!this.isMvpCycling && this.mvpCycleOriginalMap !== null);
    if (!this.isMvpCycling && this.mvpCycleOriginalMap !== null) {
      if (Number(this.player.map) === Number(this.mvpCycleOriginalMap)) {
        this.settings.autoMap = this.mvpCycleOriginalAutoMap ?? false;
        this.mvpCycleOriginalMap = null;
        
        const currentAccounts = loadAccounts();
        const idx = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
        if (idx !== -1) {
          currentAccounts[idx].settings = this.settings;
          saveAccounts(currentAccounts);
        }
        this.addLog('SYSTEM', `🏠 [Auto MVP] Đã quay lại bản đồ farm gốc. Khôi phục trạng thái tự động.`);
      } else {
        if (!this.settings.autoMap) {
          this.settings.autoMap = true;
        }
      }
    }

    // Check if we arrived back at the original map after event ends
    if (this.isEventReturning && this.player) {
      if (Number(this.player.map) === Number(this.eventReturnMapTarget)) {
        this.isEventReturning = false;
        this.eventReturnMapTarget = null;
        this.addLog('SYSTEM', `🏠 [Auto Event] Đã quay lại bản đồ farm gốc thành công.`);
      }
    }

    // 👥 Chỉ có Trưởng nhóm (Leader) hoặc bot chạy độc lập mới quản lý tiến độ chu kỳ xoay map
    if (this.isMvpCycling && this.settings.teamRole !== 'member') {
      await this.updateMvpCycleStatus();
    }

    // Detect map change
    if (prevP && prevP.map !== this.player.map) {
      this.spots = null; // Force reload static zone details for the new map
      this.bosses = null; // Clear bosses list to refresh on new map
      
      const wasMvpReturning = (!this.isMvpCycling && this.mvpCycleOriginalMap !== null);
      const isEventReturning = this.isEventReturning || false;
      
      // Do NOT reset zone settings if transitioning to/from Home map (map 5), if in MVP cycle, if returning to the original map, or if returning from an event
      if (prevP.map !== 5 && this.player.map !== 5 && !this.isMvpCycling && this.mvpCycleOriginalMap === null && !wasMvpReturning && !isEventReturning) {
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
      }
      this.addLog('SYSTEM', `🗺️ Bản đồ thay đổi sang Map ${this.player.map}.`);
    }

    // Process events
    if (d.events && d.events.length) {
      let pollKills = 0;
      let pollGold = 0;
      let pollExp = 0;

      d.events.forEach(e => {
        if (!e.msg) return;
        const cleanMsg = e.msg.replace(/<[^>]*>/g, '');
        
        // Count kills - strictly match kill events from game server
        if (e.type === 'kill') {
          pollKills++;
          if (e.is_mvp) {
            this.weKilledCurrentMvp = true;
            // 🏰 Nếu đang ở trong Phụ Bản Guild và kill được MVP (Boss Guild) → ghi nhận và thông báo tiếp tục dò quái
            if (this.guildDungeonActive) {
              this.addLog('SUCCESS', `⚔️ [Guild Dungeon] Đã hạ gục Boss Guild! Đang tiếp tục kiểm tra Phụ Bản xem còn Boss tiếp theo không...`);
            }
          }
        }
        
        // Count EXP
        const expMatch = cleanMsg.match(/EXP\+(\d+)/i);
        if (expMatch) {
          pollExp += parseInt(expMatch[1]);
        }
        
        // Count Gold
        const goldMatch = cleanMsg.match(/(?:G|Gold)\+(\d+)/i);
        if (goldMatch) {
          pollGold += parseInt(goldMatch[1]);
        }
      });

      // Calculate resource differences (Wood, Stone, Iron, Copper, Herb)
      let diffWood = 0;
      let diffStone = 0;
      let diffIron = 0;
      let diffCopper = 0;
      let diffHerb = 0;

      if (prevP && this.player) {
        diffWood = Math.max(0, (this.player.wood | 0) - (prevP.wood | 0));
        diffStone = Math.max(0, (this.player.stone | 0) - (prevP.stone | 0));
        diffIron = Math.max(0, (this.player.iron | 0) - (prevP.iron | 0));
        diffCopper = Math.max(0, (this.player.copper | 0) - (prevP.copper | 0));
        diffHerb = Math.max(0, (this.player.herb | 0) - (prevP.herb | 0));
      }

      // Save history & prune actively to maintain minimal memory
      if (pollKills > 0 || pollGold > 0 || pollExp > 0 || diffWood > 0 || diffStone > 0 || diffIron > 0 || diffCopper > 0 || diffHerb > 0) {
        const nowMs = Date.now();
        this.combatStatsHistory.push({
          time: nowMs,
          kills: pollKills,
          gold: pollGold,
          exp: pollExp,
          wood: diffWood,
          stone: diffStone,
          iron: diffIron,
          copper: diffCopper,
          herb: diffHerb
        });
        const cutoff = nowMs - 300000;
        while (this.combatStatsHistory.length > 0 && this.combatStatsHistory[0].time < cutoff) {
          this.combatStatsHistory.shift();
        }
        if (this.combatStatsHistory.length > 100) {
          this.combatStatsHistory.shift();
        }
      }

      // Zero-allocation loop for event parsing
      const events = d.events || [];
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e.type === 'beam' || e.type === 'explosion' || e.type === 'orion' || e.type === 'cannon' ||
            e.type === 'lockon' || e.type === 'tri_knife' || e.type === 'shock_ring' || e.type === 'sword_skill' ||
            e.type === 'arrow' || e.type === 'mon_atk' ||
            (e.type === 'hit' && !(e.icon && e.icon.startsWith('✨')))) {
          continue;
        }

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
      }
    }

    // Execute automation asynchronously without blocking main poll tick
    this.runAutomation().catch(err => console.error('Automation error:', err));
  }

  async runAutomation() {
    if (!this.player) return;

    const isAtHome = (!this.isMvpCycling && Number(this.player.map) === 5 && (this.player.home_crops !== undefined || this.player.home_lv !== undefined));

    const currentEpoch = Math.floor(Date.now() / 1000);
    const isInvActive = this.lastInv && (this.lastInv.st === 'pre' || this.lastInv.st === 'active') && (!this.lastInv.ends || this.lastInv.ends > currentEpoch);
    const isGwActive = this.lastGw && (this.lastGw.st === 'open' || this.lastGw.st === 'fight') && (!this.lastGw.ends || this.lastGw.ends > currentEpoch);
    const isCwActive = this.lastCw && (this.lastCw.st === 'open' || this.lastCw.st === 'fight') && (!this.lastCw.ends || this.lastCw.ends > currentEpoch);
    
    let isEventActive = false;
    if (this.player) {
      const playerLv = this.player.lv || 1;
      if (isInvActive && this.settings.autoEventJoinInv) {
        const map2Def = getMapDefs().find(m => m.id === 2);
        const req2 = map2Def ? map2Def.req : 25;
        if (playerLv >= req2) isEventActive = true;
      } else if (isGwActive && this.settings.autoEventJoinGw) {
        const map4Def = getMapDefs().find(m => m.id === 4);
        const req4 = map4Def ? map4Def.req : 20;
        if (playerLv >= req4) isEventActive = true;
      } else if (isCwActive && this.settings.autoEventJoinCw) {
        const map4Def = getMapDefs().find(m => m.id === 4);
        const req4 = map4Def ? map4Def.req : 20;
        if (playerLv >= req4) isEventActive = true;
      }
    }

    // Check if there are pending Home Farm actions
    let hasPendingHomeAction = false;
    const nowMs = Date.now();
    const harvestCooldown = (nowMs - (this.lastHarvestFailedAt || 0)) < 300000;
    const upgradeCooldown = (nowMs - (this.lastHomeUpgradeFailedAt || 0)) < 300000;

    if (!this.targetedMvp && !this.isMvpCycling && !isEventActive && (this.settings.autoHomeHarvest || this.settings.autoHomePlant || this.settings.autoHomeUpgrade)) {
      const lv = Math.max(1, this.player.home_lv | 0);
      const HOME_PLOT_LV = [20, 40, 60, 80, 100];
      const plots = 1 + HOME_PLOT_LV.filter(q => lv >= q).length;
      const totalHoles = plots * 16;
      
      let crops = [];
      try {
        const c = this.player.home_crops;
        crops = Array.isArray(c) ? c : (typeof c === 'string' ? (JSON.parse(c || '[]') || []) : []);
      } catch (e) {}

      const nowS = Date.now() / 1000;
      const SEED_GROW_H = [1, 2, 4, 8, 16, 24];
      const seedGrowS = id => (SEED_GROW_H[Math.max(0, Math.min(5, (((id - 1) / 4) | 0)))] || 1) * 3600;

      // A. Check Harvest
      if (!harvestCooldown && this.settings.autoHomeHarvest && crops.length > 0) {
        const ripeCount = crops.filter(c => c.r === true || (seedGrowS(c.s) - (nowS - c.t)) <= 0).length;
        if (ripeCount > 0) hasPendingHomeAction = true;
      }

      // B. Check Plant
      if (this.settings.autoHomePlant) {
        const usedHoles = crops.filter(c => c.p < plots).length;
        if (usedHoles < totalHoles) {
          let seeds = {};
          try {
            const s = this.player.home_seeds;
            seeds = (s && typeof s === 'object' && !Array.isArray(s)) ? s : (typeof s === 'string' ? (JSON.parse(s || '{}') || {}) : {});
          } catch (e) {}
          const availSeedIds = Object.keys(seeds).map(Number).filter(id => id >= 1 && id <= 24 && seeds[id] > 0 && !this.failedSeeds[id]);
          if (availSeedIds.length > 0) hasPendingHomeAction = true;
        }
      }

      // C. Check Upgrade
      if (!upgradeCooldown && this.settings.autoHomeUpgrade && lv < 100 && lv < ((this.player.lv | 0) + 5)) {
        const t = lv + 1;
        const m = _upgCostMult(t);
        const r = Math.ceil(tierRes(t) * m) * 10;
        const costGold = Math.ceil(tierGold(t) * m) * 10;
        if ((this.player.gold|0) >= costGold && (this.player.wood|0) >= r && (this.player.stone|0) >= r &&
            (this.player.iron|0) >= r && (this.player.copper|0) >= r && (this.player.herb|0) >= r) {
          hasPendingHomeAction = true;
        }
      }
    }

    // Pause all automation tasks (upgrades, mines, arena, map warp) while hunting MVP boss
    if (this.targetedMvp) {
      return;
    }

    // Enable automation routines based on individual user settings
    const enableUpgrades = !this.isMvpCycling;
    if (enableUpgrades) {
      let subActionDone = false;

      // 1. Auto allocation of stats
      if (!subActionDone && this.settings.autoStats && this.player.stat_pts > 0) {
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
            this.updatePlayerState(res.player);
            this.addLog('SUCCESS', `Tăng điểm ${targetStat.toUpperCase()} thành công`);
            subActionDone = true;
          } else {
            this.addLog('WARNING', `Tăng điểm thất bại: ${res.error}`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi tăng điểm: ${e.message}`);
        }
      }
    }

    // 2. Auto upgrading Gear/Armor
    if (!subActionDone && this.settings.autoGear && (this.player.armor_lv || 0) < 50) {
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
            this.updatePlayerState(res.player);
            this.addLog('SUCCESS', `Nâng cấp Armor lên Lv.${this.player.armor_lv} thành công`);
            subActionDone = true;
          } else {
            this.addLog('WARNING', `Nâng cấp Armor thất bại: ${res.error}`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi nâng cấp Armor: ${e.message}`);
        }
      }
    }

    // 3. Auto upgrading Skills
    if (!subActionDone && this.settings.autoSkills && (this.player.skill_pts || 0) > 0) {
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
            this.updatePlayerState(res.player);
            this.addLog('SUCCESS', `Nâng cấp kỹ năng ${skillToUpgrade} thành công`);
            subActionDone = true;
          } else {
            this.addLog('WARNING', `Nâng cấp kỹ năng thất bại: ${res.error}`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi nâng cấp kỹ năng: ${e.message}`);
        }
      }
    }

    // 4. Auto Companions (Cat & Drone)
    if (!subActionDone && this.settings.autoCompanion) {
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
              this.updatePlayerState(res.player);
              this.addLog('SUCCESS', `Nâng cấp Cat lên Lv.${this.player.cat_lv} thành công`);
              subActionDone = true;
            }
          } catch (e) {}
        }
      }

      // Drone upgrade
      if (!subActionDone) {
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
                this.updatePlayerState(res.player);
                this.addLog('SUCCESS', `Nâng cấp Drone lên Lv.${this.player.drone_lv} thành công`);
                subActionDone = true;
              }
            } catch (e) {}
          }
        }
      }
    }

    // 5. Auto Mines management
    if (!subActionDone && this.settings.autoMines && (this.player.house_lv || 0) >= 20) {
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
                this.updatePlayerState(res.player);
                this.addLog('SUCCESS', `Xây dựng mỏ khai thác ô ${s + 1} thành công`);
                subActionDone = true;
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
                this.updatePlayerState(res.player);
                this.addLog('SUCCESS', `Nâng cấp mỏ khai thác ô ${s + 1} thành công`);
                subActionDone = true;
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
              this.updatePlayerState(res.player);
              this.addLog('SUCCESS', `Mỏ ô ${s + 1} hoạt động trở lại`);
              subActionDone = true;
            }
          } catch (e) {}
          break;
        }
      }
    }
    } // End of temporarily disabled automation

    // 6. Phân luồng Định Tuyến Bản Đồ (Map Routing)
    const bypassHomeWarp = this.settings.bypassHomeWarp === true;

    if (hasPendingHomeAction && !bypassHomeWarp) {
      // [Chế độ cũ] Bắt buộc vào Map 5 trước khi làm nông vụ
      if (!isAtHome) {
        this.addLog('SYSTEM', `🏡 [Tự động] Đi vào Nông trại để chăm sóc cây trồng`);
        try {
          const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_warp.php', {
            line_uid: this.line_uid,
            session_token: this.session_token,
            target_map: 5
          });
          if (res && res.ok) {
            this.updatePlayerState(res.player);
            this.addLog('SUCCESS', `Đã vào Nông trại thành công`);
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi di chuyển vào Nông trại: ${e.message}`);
        }
        return; // Dừng nhịp này chờ map cập nhật
      }
    } else {
      // Không có việc nông vụ (hoặc bypassHomeWarp=true) mà vẫn kẹt ở nông trại -> Warp quay ra
      if (isAtHome) {
        const logMsg = isEventActive 
          ? `↩️ [Tự động] Có sự kiện Event đang mở, rời Nông trại để tham gia Event`
          : `↩️ [Tự động] Đã hoàn tất công việc làm vườn, rời Nông trại để quay lại farm`;
        this.addLog('SYSTEM', logMsg);
        try {
          const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_warp.php', {
            line_uid: this.line_uid,
            session_token: this.session_token,
            home_exit: 1
          });
          if (res && res.ok) {
            this.updatePlayerState(res.player);
            this.addLog('SUCCESS', `Rời Nông trại thành công`);
          } else {
            // Fallback nếu home_exit bị lỗi
            const targetMapId = parseInt(this.settings.targetMap) || 1;
            const resFallback = await this.sendRequest('https://ragnalok.online/human/xhrpg_warp.php', {
              line_uid: this.line_uid,
              session_token: this.session_token,
              target_map: targetMapId
            });
            if (resFallback && resFallback.ok) {
              this.updatePlayerState(resFallback.player);
              this.addLog('SUCCESS', `Di chuyển về bản đồ mục tiêu ${targetMapId} thành công`);
            }
          }
        } catch (e) {
          this.addLog('ERROR', `Lỗi rời Nông trại: ${e.message}`);
        }
        return;
      }

      // Di chuyển bản đồ mục tiêu thường hoặc bản đồ săn Boss xoay vòng
      const isMember = this.settings.teamRole === 'member';
      const myTeamId = this.settings.teamId || 'none';
      const leader = (isMember && myTeamId !== 'none') 
        ? Object.values(botInstances).find(b => b.userId === this.userId && b.settings.teamRole === 'leader' && (b.settings.teamId || 'none') === myTeamId) 
        : null;

      const isMvpReturning = (!this.isMvpCycling && this.mvpCycleOriginalMap !== null);
      let activeTargetMapId;
      let shouldWarpCheck = false;

      if (isMember && leader && leader.status === 'running' && leader.player && this.settings.teamSynced === true && this.settings.bossHuntMode && this.settings.bossHuntMode !== 'off' && leader.settings.bossHuntMode && leader.settings.bossHuntMode !== 'off' && !leader.guildDungeonActive && Number(leader.player.gdun_in) !== 1 && Number(leader.player.map) !== 12) {
        activeTargetMapId = leader.isMvpCycling 
          ? leader.getCurrentMvpCycleMap() 
          : (leader.player ? Number(leader.player.map) : (parseInt(leader.settings.targetMap) || 1));
        shouldWarpCheck = true;
      } else {
        activeTargetMapId = this.isMvpCycling 
          ? this.getCurrentMvpCycleMap() 
          : (isMvpReturning ? Number(this.mvpCycleOriginalMap) : (parseInt(this.settings.targetMap) || 1));
        shouldWarpCheck = (this.settings.autoMap || (this.settings.bossHuntMode && this.settings.bossHuntMode !== 'off') || this.isMvpCycling || isMvpReturning);
      }

      if (shouldWarpCheck && !this.guildDungeonActive && !this.inEventMode && Number(this.player.gdun_in) !== 1 && Number(this.player.map) !== 12 && Number(this.player.map) !== Number(activeTargetMapId)) {
        const targetMapId = activeTargetMapId;
        const mapDef = getMapDefs().find(m => m.id === targetMapId);
        if (mapDef && (this.player.lv || 1) >= mapDef.req) {
          if (targetMapId === 4) {
            const currentEpoch = Math.floor(Date.now() / 1000);
            const isGwActive = this.lastGw && (this.lastGw.st === 'open' || this.lastGw.st === 'fight') && (!this.lastGw.ends || this.lastGw.ends > currentEpoch);
            const isCwActive = this.lastCw && (this.lastCw.st === 'open' || this.lastCw.st === 'fight') && (!this.lastCw.ends || this.lastCw.ends > currentEpoch);

            let ok = false;
            if (isGwActive) {
              ok = await this.joinGuildWar();
            } else if (isCwActive) {
              ok = await this.joinCountryWar();
            } else {
              this.addLog('WARNING', `⚠️ Sự kiện Bang/Quốc chiến đã kết thúc. Tự động thoát chế độ Event.`);
              this.exitEventMode();
            }
            if (ok) {
              this.enterEventMode(isGwActive ? 'gw' : 'cw', 4);
            }
          } else {
            if (isMember && leader) {
              this.addLog('SYSTEM', `👥 [Team Member] Đồng bộ di chuyển theo Trưởng nhóm (${leader.name}) sang Map ${targetMapId}`);
            } else {
              this.addLog('SYSTEM', `🗺️ [Tự động] Di chuyển sang bản đồ: ${mapDef.name}`);
            }
            await this.warpToMap(targetMapId);
          }
        }
      }
    }

    // 7. Auto Arena Mode (Chỉ chạy khi không ở Nông trại)
    if (!isAtHome && !this.isMvpCycling && this.settings.autoArena && this.pollCount % 150 === 0) {
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

    // 8. Auto Home (Nông trại: Harvest, Plant, Upgrade)
    // bypassHomeWarp=true: thực thi ngay tại map hiện tại mà không cần vào Map 5
    // bypassHomeWarp=false (mặc định): chỉ thực thi khi đang ở Map 5 (isAtHome)
    if ((isAtHome || bypassHomeWarp) && !this.isMvpCycling && this.player && (this.settings.autoHomeHarvest || this.settings.autoHomePlant || this.settings.autoHomeUpgrade)) {
      try {
        const lv = Math.max(1, this.player.home_lv | 0);
        const HOME_PLOT_LV = [20, 40, 60, 80, 100];
        const plots = 1 + HOME_PLOT_LV.filter(q => lv >= q).length;
        const totalHoles = plots * 16;
        
        let crops = [];
        try {
          const c = this.player.home_crops;
          crops = Array.isArray(c) ? c : (typeof c === 'string' ? (JSON.parse(c || '[]') || []) : []);
        } catch (e) {}

        const nowS = Date.now() / 1000;
        const SEED_GROW_H = [1, 2, 4, 8, 16, 24];
        const seedGrowS = id => (SEED_GROW_H[((((id - 1) / 4) | 0))] || 1) * 3600;

        // A. Auto Harvest
        if (!harvestCooldown && this.settings.autoHomeHarvest && crops.length > 0) {
          const ripeCount = crops.filter(c => {
            if (c.r === true) return true;
            const left = seedGrowS(c.s) - (nowS - c.t);
            return left <= 0;
          }).length;

          if (ripeCount > 0) {
            this.addLog('SYSTEM', `🌾 [Auto Home] Thu hoạch ${ripeCount} luống cây đã chín`);
            const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
              line_uid: this.line_uid,
              session_token: this.session_token,
              action: 'home_harvest'
            });
            if (res && res.ok) {
              this.updatePlayerState(res.player);
              const hv = res.hv || {};
              this.addLog('SUCCESS', `Thu hoạch thành công: ${hv.n || ripeCount} luống (+${(hv.g || 0).toLocaleString()} Gold)`);
              this.failedSeeds = {}; // Reset blacklist on successful harvest
            } else {
              this.lastHarvestFailedAt = Date.now();
              const errMsg = res ? (res.error || res.msg || 'Lỗi không xác định') : 'Không phản hồi';
              this.addLog('ERROR', `Thu hoạch thất bại: ${errMsg}. Tạm dừng thu hoạch 5 phút.`);
            }
          }
        }

        // B. Auto Plant
        if (this.settings.autoHomePlant) {
          try {
            const c = this.player.home_crops;
            crops = Array.isArray(c) ? c : (typeof c === 'string' ? (JSON.parse(c || '[]') || []) : []);
          } catch (e) {}

          const usedHoles = crops.filter(c => c.p < plots).length;
          if (usedHoles < totalHoles) {
            let seeds = {};
            try {
              const s = this.player.home_seeds;
              seeds = (s && typeof s === 'object' && !Array.isArray(s)) ? s : (typeof s === 'string' ? (JSON.parse(s || '{}') || {}) : {});
            } catch (e) {}

            const availSeedIds = Object.keys(seeds).map(Number).filter(id => id >= 1 && id <= 24 && seeds[id] > 0 && !this.failedSeeds[id]);
            if (availSeedIds.length > 0) {
              const priority = this.settings.homePlantPriority || 'highest_tier';
              const seedTier = id => (((id - 1) / 4) | 0) + 1;
              const seedGold = id => ((id - 1) & 1) === 1;

              availSeedIds.sort((a, b) => {
                if (priority === 'gold_first') {
                  if (seedGold(a) !== seedGold(b)) return seedGold(b) ? 1 : -1;
                  return seedTier(b) - seedTier(a);
                } else if (priority === 'lowest_tier') {
                  return seedTier(a) - seedTier(b);
                } else {
                  if (seedTier(a) !== seedTier(b)) return seedTier(b) - seedTier(a);
                  return b - a;
                }
              });

              const targetSeed = availSeedIds[0];
              this.addLog('SYSTEM', `🌱 [Auto Home] Trồng tự động hạt giống ID #${targetSeed}`);
              const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
                line_uid: this.line_uid,
                session_token: this.session_token,
                action: 'home_plant',
                seed: targetSeed,
                all: 1
              });
              if (res && res.ok) {
                this.updatePlayerState(res.player);
                this.addLog('SUCCESS', `Trồng thành công hạt giống ID #${targetSeed}`);
              } else {
                const errMsg = res ? (res.error || res.msg || 'Lỗi không xác định') : 'Không phản hồi';
                this.addLog('ERROR', `Gieo hạt giống #${targetSeed} thất bại: ${errMsg}. Đưa hạt giống này vào danh sách đen.`);
                this.failedSeeds[targetSeed] = true;
              }
            }
          }
        }

        // C. Auto Upgrade Home
        if (!upgradeCooldown && this.settings.autoHomeUpgrade) {
          const lv = Math.max(1, this.player.home_lv | 0);
          if (lv < 100 && lv < ((this.player.lv | 0) + 5)) {
            const t = lv + 1;
            const m = _upgCostMult(t);
            const r = Math.ceil(tierRes(t) * m) * 10;
            const costGold = Math.ceil(tierGold(t) * m) * 10;

            if ((this.player.gold|0) >= costGold && (this.player.wood|0) >= r && (this.player.stone|0) >= r &&
                (this.player.iron|0) >= r && (this.player.copper|0) >= r && (this.player.herb|0) >= r) {
              this.addLog('SYSTEM', `⬆️ [Auto Home] Nâng cấp nhà lên Lv.${lv + 1}`);
              const res = await this.sendRequest('https://ragnalok.online/human/xhrpg_upgrade.php', {
                line_uid: this.line_uid,
                session_token: this.session_token,
                action: 'home_up'
              });
              if (res && res.ok) {
                this.updatePlayerState(res.player);
                this.addLog('SUCCESS', `Nâng cấp nhà lên Lv.${this.player.home_lv} thành công!`);
              } else {
                this.lastHomeUpgradeFailedAt = Date.now();
                const errMsg = res ? (res.error || res.msg || 'Lỗi không xác định') : 'Không phản hồi';
                this.addLog('ERROR', `Nâng cấp nhà thất bại: ${errMsg}. Tạm dừng nâng cấp nhà 5 phút.`);
              }
            }
          }
        }
      } catch (err) {
        console.error(`Auto Home error for ${this.name}:`, err);
      }
    }

    // 9. Auto Market Buy
    await this.scanAndBuyMarket();
  }

  async scanAndBuyMarket() {
    // 1. Kiểm tra điều kiện bật tính năng
    if (!this.settings.autoMarketBuy) return;
    if (this.status !== 'running') return;
    
    // 2. Kiểm tra chu kỳ quét (cấu hình được từ 5s-60s, mặc định 10s)
    const intervalSec = Math.max(5, Number(this.settings.marketScanInterval || 10));
    const now = Date.now();
    if (this.lastMarketScanAt && (now - this.lastMarketScanAt < intervalSec * 1000)) return;
    
    // 3. Kiểm tra phân quyền và giới hạn bot chạy chợ của user sở hữu
    const users = loadUsers();
    const owner = users.find(u => u.id === this.userId);
    if (!owner) return;

    if (owner.role !== 'admin') {
      const limit = owner.marketBotLimit !== undefined ? owner.marketBotLimit : (owner.allowMarket ? owner.maxAccounts : 0);
      if (limit <= 0) {
        if (this.pollCount % 60 === 0) {
          this.addLog('WARNING', '🔒 Tính năng Auto Market Buy bị khóa do chưa được Admin cấp quyền.');
        }
        return;
      }
      
      const userBots = Object.values(botInstances).filter(bot => 
        bot.userId === this.userId && 
        bot.status === 'running' && 
        bot.settings.autoMarketBuy === true
      );
      
      userBots.sort((a, b) => a.line_uid.localeCompare(b.line_uid));
      
      const myIndex = userBots.findIndex(bot => bot.line_uid === this.line_uid);
      if (myIndex >= limit) {
        if (this.pollCount % 30 === 0) {
          this.addLog('WARNING', `🔒 Số lượng bot chạy Auto Market vượt quá hạn mức cho phép của tài khoản (Hạn mức: ${limit} bot). Bot này tạm khóa chức năng chợ.`);
        }
        return;
      }
    }

    this.lastMarketScanAt = now;

    try {
      const rawData = await this.sendRequest('https://ragnalok.online/human/xhrpg_market.php', {
        action: 'get_listings',
        line_uid: this.line_uid,
        session_token: this.session_token,
        lang: 'vi'
      });

      if (!rawData || !rawData.ok || !Array.isArray(rawData.listings)) {
        return;
      }

      const listings = rawData.listings;
      const categoriesConfig = this.settings.marketCategories || {};
      const globalMaxPrice = Number(this.settings.marketMaxPrice || 10000);
      const categoryMaxPrices = this.settings.marketCategoryMaxPrices || {};
      let currentGold = this.player.gold || 0;

      const matchingItems = [];

      for (const item of listings) {
        const category = getItemCategory(item);
        
        // A. Kiểm tra xem category này có đang được BẬT không
        if (!categoriesConfig[category]) continue;

        const price = Number(item.price_per || 0);

        // B. Tính giá tối đa hiệu lực cho category này
        const catMaxPrice = categoryMaxPrices[category] !== undefined && categoryMaxPrices[category] !== null && categoryMaxPrices[category] !== '' 
          ? Number(categoryMaxPrices[category]) 
          : globalMaxPrice;
        const effectiveMaxPrice = catMaxPrice > 0 ? catMaxPrice : globalMaxPrice;

        const exactPriceMatch = this.settings.marketExactPrice === true;
        if (exactPriceMatch) {
          if (price !== effectiveMaxPrice) continue;
        } else {
          if (price > effectiveMaxPrice) continue;
        }
        if (price > currentGold) continue;

        const translatedName = translateThaiText(item.item_name || 'Vật phẩm');

        // C. Kiểm tra lọc riêng từng loại (nếu danh sách rỗng -> bỏ qua không mua)
        if (category === 'card') {
          const selectedCards = this.settings.marketSelectedCards || [];
          if (!Array.isArray(selectedCards) || selectedCards.length === 0) continue;
          const itemLower = translatedName.toLowerCase();
          const matches = selectedCards.some(cardName => {
            const isSelectedMvp = cardName.toLowerCase().startsWith('mvp ');
            const isItemMvp = itemLower.includes('mvp');
            if (isSelectedMvp !== isItemMvp) return false;

            let cardLower = cardName.toLowerCase().trim();
            if (isSelectedMvp) cardLower = cardLower.replace(/^mvp\s+/, '');
            return cardLower && (itemLower.includes(cardLower) || cardLower.includes(itemLower));
          });
          if (!matches) continue;
        } else if (category === 'egg') {
          const selectedEggs = this.settings.marketSelectedEggs || [];
          if (!Array.isArray(selectedEggs) || selectedEggs.length === 0) continue;
          const itemLower = translatedName.toLowerCase();
          const matches = selectedEggs.some(eggName => {
            const isSelectedMvp = eggName.toLowerCase().startsWith('mvp ');
            const isItemMvp = itemLower.includes('mvp');
            if (isSelectedMvp !== isItemMvp) return false;

            let eggLower = eggName.toLowerCase().trim();
            if (isSelectedMvp) eggLower = eggLower.replace(/^mvp\s+/, '');
            return eggLower && (itemLower.includes(eggLower) || eggLower.includes(itemLower));
          });
          if (!matches) continue;
        } else if (category === 'module') {
          const selectedTiers = this.settings.marketSelectedModuleTiers || [];
          if (!Array.isArray(selectedTiers) || selectedTiers.length === 0) continue;
          const itemTier = getModuleTier(translatedName) || getModuleTier(item.item_name || '');
          if (!itemTier || !selectedTiers.includes(itemTier)) continue;
        } else if (category === 'collectible') {
          const selectedCollectibles = this.settings.marketSelectedCollectibles || [];
          if (!Array.isArray(selectedCollectibles) || selectedCollectibles.length === 0) continue;
          const itemLower = translatedName.toLowerCase();
          const matches = selectedCollectibles.some(colName => {
            const colLower = colName.toLowerCase().trim();
            return colLower && (itemLower.includes(colLower) || colLower.includes(itemLower));
          });
          if (!matches) continue;
        } else if (category === 'module_box') {
          const selectedModuleBoxes = this.settings.marketSelectedModuleBoxes || [];
          if (!Array.isArray(selectedModuleBoxes) || selectedModuleBoxes.length === 0) continue;
          const itemLower = translatedName.toLowerCase();
          const matches = selectedModuleBoxes.some(boxType => {
            const typeLower = boxType.toLowerCase().trim();
            if (typeLower === 'sử thi+') {
              return itemLower.includes('sử thi+');
            } else if (typeLower === 'sử thi') {
              return itemLower.includes('sử thi') && !itemLower.includes('sử thi+');
            } else {
              return itemLower.includes(typeLower);
            }
          });
          if (!matches) continue;
        } else if (category === 'card_box') {
          const selectedCardBoxes = this.settings.marketSelectedCardBoxes || [];
          if (!Array.isArray(selectedCardBoxes) || selectedCardBoxes.length === 0) continue;
          const itemLower = translatedName.toLowerCase();
          const matches = selectedCardBoxes.some(boxTier => {
            const tierLower = boxTier.toLowerCase().trim();
            return itemLower.includes(tierLower);
          });
          if (!matches) continue;
        } else if (category === 'egg_box') {
          const selectedEggBoxes = this.settings.marketSelectedEggBoxes || [];
          if (!Array.isArray(selectedEggBoxes) || selectedEggBoxes.length === 0) continue;
          const itemLower = translatedName.toLowerCase();
          const matches = selectedEggBoxes.some(boxTier => {
            const tierLower = boxTier.toLowerCase().trim();
            return itemLower.includes(tierLower);
          });
          if (!matches) continue;
        }

        matchingItems.push({
          id: item.id,
          name: translatedName,
          price: price,
          qty: Number(item.qty || 1),
          category: category
        });
      }

      if (matchingItems.length === 0) {
        return;
      }

      // Sắp xếp ưu tiên sản phẩm có giá rẻ nhất trước
      matchingItems.sort((a, b) => a.price - b.price);

      this.addLog('SYSTEM', `🛒 Phát hiện ${matchingItems.length} sản phẩm phù hợp. Tiến hành mua hàng loạt...`);

      currentGold = this.player.gold || 0;
      let successCount = 0;
      let historyUpdated = false;

      for (const targetItem of matchingItems) {
        const categoryMaxQtys = this.settings.marketCategoryMaxQtys || {};
        const limitQty = categoryMaxQtys[targetItem.category] !== undefined 
          ? Number(categoryMaxQtys[targetItem.category]) 
          : (targetItem.category === 'resource' ? 100 : 1);

        const maxAffordable = Math.floor(currentGold / targetItem.price);
        const qtyToBuy = Math.min(targetItem.qty, limitQty, maxAffordable);

        if (qtyToBuy <= 0) {
          if (maxAffordable <= 0) {
            this.addLog('WARNING', `🪙 Vàng không đủ để mua tiếp: ${targetItem.name} (${targetItem.price.toLocaleString()}G)`);
            break;
          }
          continue;
        }

        const buyRes = await this.sendRequest('https://ragnalok.online/human/xhrpg_market.php', {
          action: 'buy',
          line_uid: this.line_uid,
          session_token: this.session_token,
          listing_id: targetItem.id,
          qty: qtyToBuy,
          lang: 'vi'
        });

        const historyEntry = {
          id: targetItem.id,
          itemName: `${qtyToBuy}x ${targetItem.name}`,
          category: targetItem.category,
          price: qtyToBuy * targetItem.price,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: Date.now(),
          status: 'success',
          error: null
        };

        if (buyRes && buyRes.ok) {
          successCount++;
          this.addLog('SUCCESS', `🎉 Auto-buy thành công: ${qtyToBuy}x ${targetItem.name} (Tổng cộng: ${(qtyToBuy * targetItem.price).toLocaleString()}G)`);
          historyEntry.status = 'success';
          if (buyRes.player) {
            this.updatePlayerState(buyRes.player);
            currentGold = this.player.gold || 0;
          } else {
            currentGold -= qtyToBuy * targetItem.price;
          }
        } else {
          const errMsg = buyRes ? (buyRes.error || buyRes.msg || 'Sản phẩm đã bị người khác mua trước hoặc không còn tồn tại') : 'Không phản hồi từ server';
          this.addLog('WARNING', `⚠️ Mua hàng không thành công [${targetItem.name}]: ${errMsg}`);
          historyEntry.status = 'failed';
          historyEntry.error = errMsg;
        }

        if (!Array.isArray(this.marketBuyHistory)) this.marketBuyHistory = [];
        this.marketBuyHistory.unshift(historyEntry);
        if (this.marketBuyHistory.length > 50) this.marketBuyHistory.pop();
        historyUpdated = true;

        // Delay nhẹ 200ms để tránh spam server game quá nhanh
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (historyUpdated) {
        const currentAccounts = loadAccounts();
        const accIndex = currentAccounts.findIndex(acc => acc.line_uid === this.line_uid);
        if (accIndex !== -1) {
          currentAccounts[accIndex].marketBuyHistory = this.marketBuyHistory;
          saveAccounts(currentAccounts);
        }
      }

    } catch (e) {
      console.error(`[Market Scanner Error] ${this.name}:`, e.message);
    }
  }
}

// Initialize active bots
function startAllBots() {
  const accounts = loadAccounts();
  accounts.forEach(acc => {
    const instance = new BotInstance(acc);
    botInstances[acc.line_uid] = instance;
    instance.start();
  });
}

// 🛡️ Global Watchdog: Quét và tự động giải cứu các bot bị treo im lặng (Zombie Bots)
function checkAndRecoverZombieBots() {
  const now = Date.now();
  let recoveredCount = 0;
  for (const uid in botInstances) {
    const bot = botInstances[uid];
    if (bot && bot.status === 'running' && !bot.clientActivePaused) {
      const lastActivity = bot.lastPollStartedAt || bot.startTime || 0;
      const silentDuration = now - lastActivity;
      // Nếu bot đang 'running' nhưng không có nhịp poll nào trong >90 giây
      if (silentDuration > 90000) {
        console.error(`[Watchdog] 🚨 Zombie bot phát hiện: "${bot.name}" (${uid}) — im lặng ${Math.round(silentDuration / 1000)}s. Đang tự động khởi động lại...`);
        bot.addLog('WARNING', `🚨 Watchdog phát hiện bot bị treo im lặng ${Math.round(silentDuration / 1000)}s — Tự động khởi động lại poll loop`);
        try {
          bot.stop('idle');
        } catch (e) {}
        bot.start();
        recoveredCount++;
      }
    }
  }
  return recoveredCount;
}

if (require.main === module) {
  startAllBots();
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
      expiresAt: user.expiresAt || null,
      allowEditPollInterval: user.role === 'admin' || user.allowEditPollInterval === true
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
      expiresAt: req.user.expiresAt || null,
      allowMarket: req.user.role === 'admin' || req.user.allowMarket === true,
      allowEditPollInterval: req.user.role === 'admin' || req.user.allowEditPollInterval === true
    }
  });
});

// ==================== ADMIN API ROUTES ====================

// Get system statistics (Admin only)
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const users = loadUsers();
  const accounts = loadAccounts();
  const now = new Date();

  let activeUsers = 0;
  let expiredUsers = 0;
  let totalQuota = 0;

  users.forEach(u => {
    if (u.role === 'admin') {
      activeUsers++;
    } else if (u.expiresAt && new Date(u.expiresAt) < now) {
      expiredUsers++;
    } else {
      activeUsers++;
    }
    if (u.role !== 'admin') {
      totalQuota += (u.maxAccounts || 1);
    }
  });

  let onlineBots = 0;
  let offlineBots = 0;
  let directBots = 0;
  let proxyBots = 0;

  accounts.forEach(acc => {
    const bot = botInstances[acc.line_uid];
    if (bot && bot.status === 'running') {
      onlineBots++;
    } else {
      offlineBots++;
    }

    const pId = acc.proxyId || (bot ? bot.proxyId : 'auto');
    if (pId === 'direct') {
      directBots++;
    } else {
      proxyBots++;
    }
  });

  res.json({
    totalUsers: users.length,
    activeUsers,
    expiredUsers,
    totalBots: accounts.length,
    onlineBots,
    offlineBots,
    totalQuota,
    directBots,
    proxyBots
  });
});

// ==================== ANNOUNCEMENTS API ROUTES ====================

// Get announcements (Users & Admin)
app.get('/api/announcements', requireAuth, (req, res) => {
  const list = loadAnnouncements();
  res.json({ success: true, announcements: list });
});

// Create announcement (Admin only)
app.post('/api/admin/announcements', requireAdmin, (req, res) => {
  const { type, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Nội dung thông báo không được để trống' });
  }
  const validTypes = ['info', 'success', 'warning', 'critical'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Loại thông báo không hợp lệ' });
  }
  const list = loadAnnouncements();
  const newAnn = {
    id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type,
    message: message.trim(),
    createdAt: new Date().toISOString(),
    createdBy: req.user.username
  };
  list.unshift(newAnn);
  saveAnnouncements(list);
  res.json({ success: true, announcement: newAnn });
});

// Delete announcement (Admin only)
app.delete('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let list = loadAnnouncements();
  const initialLength = list.length;
  list = list.filter(ann => ann.id !== id);
  if (list.length === initialLength) {
    return res.status(404).json({ error: 'Không tìm thấy thông báo' });
  }
  saveAnnouncements(list);
  res.json({ success: true });
});

// Get all users (Admin only)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = loadUsers();
  const accounts = loadAccounts();

  const list = users.map(u => {
    const userBots = accounts.filter(acc => acc.userId === u.id);
    let onlineCount = 0;
    userBots.forEach(acc => {
      const bot = botInstances[acc.line_uid];
      if (bot && bot.status === 'running') onlineCount++;
    });
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      maxAccounts: u.maxAccounts || 1,
      expiresAt: u.expiresAt || null,
      allowMarket: u.allowMarket === true,
      pollInterval: u.pollInterval !== undefined ? u.pollInterval : 2000,
      allowEditPollInterval: u.allowEditPollInterval === true,
      createdAt: u.createdAt,
      botCount: userBots.length,
      onlineBotCount: onlineCount
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
    allowMarket: false,
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
      allowMarket: newUser.allowMarket,
      createdAt: newUser.createdAt,
      botCount: 0
    }
  });
});

// Update user settings/password/expiration (Admin only)
app.put('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { password, maxAccounts, extendDays, extendMinutes, expiresAt, pollInterval, allowEditPollInterval } = req.body;

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

  if (pollInterval !== undefined) {
    const parsed = parseInt(pollInterval);
    if (!isNaN(parsed) && parsed >= 380) {
      users[index].pollInterval = parsed;
    }
  }

  if (allowEditPollInterval !== undefined) {
    users[index].allowEditPollInterval = allowEditPollInterval === true;
  }

  saveUsers(users);

  // Update live bot instances in-memory
  const updatedUser = users[index];
  Object.values(botInstances).forEach(bot => {
    if (bot.userId === userId) {
      bot.userPollInterval = updatedUser.pollInterval;
      bot.userIsAdmin = updatedUser.role === 'admin';
      bot.allowEditPollInterval = updatedUser.allowEditPollInterval === true;
    }
  });

  // Update live session quota if active
  Object.values(userSessions).forEach(sess => {
    if (sess.userId === userId) {
      sess.maxAccounts = users[index].maxAccounts;
    }
  });

  res.json({
    success: true,
    user: {
      id: users[index].id,
      username: users[index].username,
      role: users[index].role,
      maxAccounts: users[index].maxAccounts,
      pollInterval: users[index].pollInterval,
      allowEditPollInterval: users[index].allowEditPollInterval === true
    }
  });
});

// Toggle market permission for a specific user (Admin only)
app.put('/api/admin/users/:userId/allow-market', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { allowMarket } = req.body;

  const users = loadUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  users[index].allowMarket = allowMarket === true;
  saveUsers(users);

  res.json({ 
    success: true, 
    user: { 
      id: users[index].id, 
      username: users[index].username, 
      role: users[index].role, 
      allowMarket: users[index].allowMarket 
    } 
  });
});

// Update market bot limit for a specific user (Admin only)
app.put('/api/admin/users/:userId/market-limit', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { marketBotLimit } = req.body;

  const users = loadUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const parsed = parseInt(marketBotLimit);
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ error: 'Giới hạn bot chạy chợ không hợp lệ' });
  }

  users[index].marketBotLimit = parsed;
  users[index].allowMarket = parsed > 0;
  saveUsers(users);

  res.json({ 
    success: true, 
    user: { 
      id: users[index].id, 
      username: users[index].username, 
      role: users[index].role, 
      marketBotLimit: users[index].marketBotLimit,
      allowMarket: users[index].allowMarket
    } 
  });
});

// Batch update proxy for all bots owned by a specific user (Admin only)
app.put('/api/admin/users/:userId/proxy', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { proxyId } = req.body;

  if (proxyId === undefined) {
    return res.status(400).json({ error: 'Thiếu tham số proxyId' });
  }

  const currentAccounts = loadAccounts();
  let updatedCount = 0;

  Object.values(botInstances).forEach(bot => {
    if (bot.userId === userId) {
      const assigned = proxyPool.forceAssignBot(bot.line_uid, proxyId);
      bot.proxyId = assigned;
      updatedCount++;

      const index = currentAccounts.findIndex(acc => acc.line_uid === bot.line_uid);
      if (index !== -1) {
        currentAccounts[index].proxyId = assigned;
      }
    }
  });

  if (updatedCount > 0) {
    saveAccounts(currentAccounts);
  }

  res.json({ success: true, userId, proxyId, updatedCount });
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
  const { label, url, type } = req.body;
  try {
    const parsed = ProxyPool.parseProxyInput(url, type, label);
    const proxy = proxyPool.addProxy(parsed.label, parsed.url);
    res.json({ success: true, proxy });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/proxies/settings', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  const { useDirectConnection, maxBotsPerProxy, telegramBotToken, telegramChatId, backupIntervalHours, autoBackupEnabled } = req.body;
  
  if (telegramBotToken && telegramChatId) {
    const botId = telegramBotToken.trim().split(':')[0];
    if (telegramChatId.trim() === botId) {
      return res.status(400).json({ error: 'Chat ID không được trùng với ID của Bot (phần số trước dấu hai chấm ở Token). Vui lòng điền Chat ID cá nhân!' });
    }
  }

  const update = {};
  if (useDirectConnection !== undefined) update.useDirectConnection = Boolean(useDirectConnection);
  if (maxBotsPerProxy !== undefined) update.maxBotsPerProxy = Math.max(1, parseInt(maxBotsPerProxy) || 10);
  if (telegramBotToken !== undefined) update.telegramBotToken = String(telegramBotToken).trim();
  if (telegramChatId !== undefined) update.telegramChatId = String(telegramChatId).trim();
  if (backupIntervalHours !== undefined) update.backupIntervalHours = Math.max(1, parseInt(backupIntervalHours) || 12);
  if (autoBackupEnabled !== undefined) update.autoBackupEnabled = Boolean(autoBackupEnabled);
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

app.post('/api/admin/proxies/:id/test', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  const { id } = req.params;
  
  let url = null;
  if (id === 'direct') {
    url = 'direct';
  } else {
    const p = proxyPool._proxies.find(x => x.id === id);
    if (!p) return res.status(404).json({ error: 'Không tìm thấy proxy' });
    url = p.url;
  }
  
  try {
    const start = Date.now();
    let dispatcher;
    if (url === 'direct') {
      dispatcher = proxyPool._directAgent;
    } else {
      dispatcher = proxyPool._createAgent(url);
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout
    
    try {
      const response = await fetch('https://ragnalok.online/human/index.php', {
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        dispatcher,
        signal: controller.signal
      });
      
      const latency = Date.now() - start;
      if (response.ok) {
        res.json({ success: true, latency });
      } else {
        res.json({ success: false, error: `HTTP Error ${response.status}`, latency });
      }
    } finally {
      clearTimeout(timeout);
      if (url !== 'direct') {
        try { dispatcher.destroy(); } catch (e) {}
      }
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ==================== BACKUP & RESTORE ROUTES (Admin only) ====================

async function performTelegramBackup() {
  const settings = proxyPool.getSettings();
  const token = settings.telegramBotToken;
  const chatId = settings.telegramChatId;
  if (!token || !chatId) {
    throw new Error('Chưa cấu hình Telegram Bot Token hoặc Chat ID.');
  }

  const zip = new AdmZip();
  const files = ['users.json', 'proxies.json', 'accounts.json', 'announcements.json'];
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      zip.addLocalFile(filePath);
    }
  }
  const zipBuffer = zip.toBuffer();

  const dateStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
  const filename = `rag_backup_${dateStr}.zip`;
  const caption = `📦 **Ragnalok Bot Dashboard Backup**\n🕒 Thời gian: ${new Date().toLocaleString('vi-VN')}\n💻 Máy chủ: ${require('os').hostname()}`;

  // Build raw multipart body manually to support all Node.js and OS versions flawlessly
  const boundary = '----NodeTelegramBackupBoundary' + crypto.randomBytes(8).toString('hex');
  const parts = [];

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
    `${chatId}\r\n`
  ));

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="caption"\r\n\r\n` +
    `${caption}\r\n`
  ));

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n` +
    `Content-Type: application/zip\r\n\r\n`
  ));
  parts.push(zipBuffer);
  parts.push(Buffer.from('\r\n'));
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const result = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendDocument`,
      method: 'POST',
      family: 4, // Force IPv4 to bypass any IPv6 DNS resolution bugs on Ubuntu VPS
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => {
        resData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(resData));
          } catch (e) {
            reject(new Error(`Failed to parse Telegram response: ${resData}`));
          }
        } else {
          reject(new Error(`Telegram API Error: ${res.statusCode} - ${resData}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });

  if (!result.ok) {
    throw new Error(`Telegram API returned ok:false - ${JSON.stringify(result)}`);
  }

  proxyPool.updateSettings({ lastBackupTime: Date.now() });
  return result;
}

app.post('/api/admin/backup-now', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  try {
    const result = await performTelegramBackup();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/backup-download', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  try {
    const zip = new AdmZip();
    const files = ['users.json', 'proxies.json', 'accounts.json', 'announcements.json'];
    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        zip.addLocalFile(filePath);
      }
    }
    const zipBuffer = zip.toBuffer();
    const dateStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    res.setHeader('Content-Disposition', `attachment; filename=rag_backup_${dateStr}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/restore-upload', requireAuth, upload.single('backupFile'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  if (!req.file) return res.status(400).json({ error: 'Không tìm thấy file tải lên' });

  try {
    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    const fileNamesInZip = zipEntries.map(e => e.entryName);
    const hasRequiredFiles = ['users.json', 'proxies.json', 'accounts.json'].every(f => fileNamesInZip.includes(f));

    if (!hasRequiredFiles) {
      return res.status(400).json({ error: 'File backup không hợp lệ. Phải chứa đầy đủ các file: users.json, proxies.json, accounts.json' });
    }

    // Extract and overwrite files
    zip.extractAllTo(__dirname, true);

    // Hot-reload system
    // 1. Stop all current bots
    Object.keys(botInstances).forEach(uid => {
      try {
        botInstances[uid].stop();
      } catch (e) {
        console.error(`Error stopping bot ${uid}:`, e);
      }
      delete botInstances[uid];
    });

    // 2. Reload proxies settings
    proxyPool._load();

    // 3. Reload and start all bots
    startAllBots();

    res.json({ success: true, message: 'Khôi phục dữ liệu và khởi động lại toàn bộ bot thành công!' });
  } catch (err) {
    res.status(500).json({ error: `Lỗi giải nén hoặc nạp dữ liệu: ${err.message}` });
  }
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
        bot.phpsessid = phpsessid;
        bot.lastSessionRefreshAt = Date.now();
        if (customName || data.player.name) bot.name = customName || data.player.name;
        const currentAccounts = loadAccounts();
        const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
        if (index !== -1) {
          currentAccounts[index].session_token = session_token;
          currentAccounts[index].phpsessid = phpsessid;
          if (customName || data.player.name) currentAccounts[index].name = customName || data.player.name;
          saveAccounts(currentAccounts);
        }
        if (req.method === 'GET') {
          return res.send(`
            <div style="background:#0f172a; color:#fff; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
              <div style="font-size:60px; margin-bottom:10px;">🎉</div>
              <h2 style="color:#34d399; margin-bottom:10px;">CẬP NHẬT TOKEN THÀNH CÔNG!</h2>
              <p style="color:#94a3b8; font-size:16px;">Tài khoản <strong>${bot.name}</strong> đã được cập nhật Token & PHPSESSID mới.</p>
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
      phpsessid,
      userId: req.user.id
    };

    const bot = new BotInstance(newAcc);
    botInstances[line_uid] = bot;
    newAcc.proxyId = bot.proxyId;

    const currentAccounts = loadAccounts();
    currentAccounts.push(newAcc);
    saveAccounts(currentAccounts);
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

  const bot = new BotInstance(newAcc);
  botInstances[line_uid] = bot;
  newAcc.proxyId = bot.proxyId;

  const currentAccounts = loadAccounts();
  currentAccounts.push(newAcc);
  saveAccounts(currentAccounts);
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
  try {
    res.setHeader('X-User-Expires-At', req.user.expiresAt || '');
    res.setHeader('X-User-Max-Accounts', req.user.maxAccounts || 1);
    const users = loadUsers();
    const currentAccounts = loadAccounts();
    const list = currentAccounts
      .map(acc => botInstances[acc.line_uid])
      .filter(bot => bot && (req.user.role === 'admin' || bot.userId === req.user.id))
      .map(bot => {
        const ownerUser = users.find(u => u.id === bot.userId);
        return {
          line_uid: bot.line_uid,
          session_token: bot.session_token,
          name: bot.name,
          userId: bot.userId,
          ownerUsername: ownerUser ? ownerUser.username : (req.user.username || 'Admin'),
          ownerRole: ownerUser ? ownerUser.role : 'user',
          ownerExpiresAt: ownerUser ? ownerUser.expiresAt : null,
          ownerMaxAccounts: ownerUser ? ownerUser.maxAccounts : 1,
          ownerMarketLimit: ownerUser ? (ownerUser.marketBotLimit !== undefined ? ownerUser.marketBotLimit : (ownerUser.allowMarket ? ownerUser.maxAccounts : 0)) : 0,
          ownerPollInterval: ownerUser ? (ownerUser.pollInterval || 2000) : 2000,
          ownerAllowEditPollInterval: ownerUser ? (ownerUser.allowEditPollInterval === true) : false,
          status: bot.status,
          ping: bot.ping || 0,
          hasPhpsessid: !!bot.phpsessid,
          clientActive: !!(bot.lastClientActive && (Date.now() - bot.lastClientActive < 12000)),
          error: bot.error,
          lastUpdate: bot.lastUpdate,
          settings: bot.settings,
          proxyId: bot.proxyId,
          lastInv: bot.lastInv || null,
          lastGw: bot.lastGw || null,
          lastCw: bot.lastCw || null,
          inEventMode: bot.inEventMode || false,
          tradeInvite: bot.tradeInvite || null,
          currentEventKind: bot.currentEventKind || null,
          guildDungeonActive: bot.guildDungeonActive || false,
          guildDungeonIsTeam: bot.guildDungeonIsTeam || false,
          proxyInfo: req.user.role === 'admin' ? proxyPool.getBotProxyInfo(bot.line_uid) : null,
          combatRates: bot.getCombatRates ? bot.getCombatRates() : { 
            killsPerMin: 0, goldPerMin: 0, expPerMin: 0,
            woodPerMin: 0, stonePerMin: 0, ironPerMin: 0, copperPerMin: 0, herbPerMin: 0
          },
          spots: bot.spots || null,
          // Truyền danh sách bản đồ động từ cache xuống frontend (luôn dùng mới nhất)
          mapsList: getMapDefs(),
          // Spots cache của map hiện tại (để zone dropdown luôn có dữ liệu ngay cả khi bot chưa có spots mới)
          cachedSpots: (bot.player && bot.player.map && spotsCache[bot.player.map]) ? spotsCache[bot.player.map] : null,
          player: bot.player ? (() => {
            const p = bot.player;

            // 1. Sổ tay Thẻ bài / Trứng (_collCB)
            const _collCBof = (o) => {
              const obj = (o && typeof o === 'object' && !Array.isArray(o)) ? o : (() => { try { return JSON.parse(o || '{}') || {}; } catch(e) { return {}; } })();
              let b = 0;
              for (const k in obj) {
                const v = obj[k];
                if (v && ((v.n | 0) > 0)) b += 1;
                if (v && ((v.m | 0) > 0)) b += 3;
              }
              return b;
            };
            const collCB = _collCBof(p.cards) + _collCBof(p.eggs);

            // 2. Thẻ MVP socket cắm trong module (_cardCB)
            const cardCB = { atk: collCB, range: 0, armor: 0, hp: collCB, mp: collCB };
            ['pistol_modules', 'sniper_modules', 'knife_modules', 'axe_modules', 'robot_modules', 'robot_gun_modules', 'railgun_modules', 'armor_modules', 'house_modules', 'turret_modules'].forEach(f => {
              if (f === 'railgun_modules' && (+(p.robot_railgun_expires || 0)) <= Math.floor(Date.now() / 1000)) return;
              let mods = p[f];
              if (typeof mods === 'string') { try { mods = JSON.parse(mods || '{}'); } catch(e) { mods = {}; } }
              if (!mods || typeof mods !== 'object') return;
              Object.keys(mods).forEach(k => {
                const m = mods[k];
                if (!m || !Array.isArray(m.cards)) return;
                m.cards.forEach(c => {
                  if (!c || !c.mvp || !c.mb) return;
                  const t = c.mb.t, a = c.mb.a | 0;
                  if (a > 0 && cardCB[t] !== undefined) cardCB[t] += a;
                });
              });
            });

            // 3. Tổng ATK từ Module các loại vũ khí (_modTotalAtk)
            const _pmodsObj = (w) => {
              const f = w + '_modules';
              let m = p[f];
              if (typeof m === 'string') { try { m = JSON.parse(m || '{}'); } catch(e) { m = {}; } }
              return (m && typeof m === 'object') ? m : {};
            };
            const _modEnhAtk = (to) => (to > 0 ? (to <= 5 ? to * 3 : (to <= 11 ? 15 + (to - 5) * 5 : 45 + (to - 11) * 8)) : 0);
            const _modBarrelAtk = (m) => (m ? (Math.max(1, m.rarity || 1) - 1) * 3 + _modEnhAtk(parseInt(m.plus) || 0) : 0);
            const _modGunAtk = (mods) => _modBarrelAtk(mods && mods.barrel) + _modBarrelAtk(mods && mods.mag);
            const _modSightAtk = (mods) => _modBarrelAtk(mods && mods.sight);

            const railOn = (parseInt(p.robot_railgun_expires) || 0) > Math.floor(Date.now() / 1000);
            let modTotalAtk = 0;
            ['pistol', 'sniper', 'knife', 'axe', 'robot_gun', 'railgun'].forEach(w => {
              if (w === 'railgun' && !railOn) return;
              const m = _pmodsObj(w);
              modTotalAtk += _modGunAtk(m) + _modSightAtk(m);
            });
            const tm = _pmodsObj('turret');
            modTotalAtk += _modBarrelAtk(tm.t_atk) + _modBarrelAtk(tm.t_range) + _modBarrelAtk(tm.t_dur);

            // 4. Module Giáp (Armor Module MAX & DEF)
            const _armorModDefOne = (to) => (to > 0 ? (to <= 5 ? to : (to <= 11 ? 5 + (to - 5) * 2 : 17 + (to - 11) * 3)) : 0);
            const _armorEffVal = (slot, m) => {
              const r = parseInt(m.rarity) || 1, plus = parseInt(m.plus) || 0;
              if (slot === 'a_max') return r * 3 + plus * 2;
              if (slot === 'a_regen') return _armorModDefOne(plus) + Math.floor((r - 1) / 2);
              if (slot === 'a_return') return Math.min(50, r * 2 + plus);
              return 0;
            };
            const armorMods = _pmodsObj('armor');
            let armorModMax = 0, armorModDef = 0;
            Object.keys(armorMods).forEach(k => {
              const m = armorMods[k];
              if (!m) return;
              if (k === 'a_max') armorModMax += _armorEffVal('a_max', m);
              if (k === 'a_regen') armorModDef += _armorEffVal('a_regen', m);
            });

            // 5. Trích xuất Cấp độ Kỹ năng
            const skillsObj = (() => {
              try {
                return typeof p.skills === 'object' ? p.skills : JSON.parse(p.skills || '{}');
              } catch (e) {
                return {};
              }
            })();
            const armorUpSkillLv = parseInt(skillsObj.armor_up) || 0;
            const critShotSkillLv = parseInt(skillsObj.crit_shot) || 0;
            const deployTurretSkillLv = parseInt(skillsObj.deploy_turret) || 0;

            // 6. Hệ số nhân Ragnalok Points
            const ragHp = 1 + 0.001 * Math.max(0, parseInt(p.rag_hp) || 0);
            const ragMp = 1 + 0.001 * Math.max(0, parseInt(p.rag_mp) || 0);
            const ragArmor = 1 + 0.001 * Math.max(0, parseInt(p.rag_armor) || 0);
            const ragAtk = 1 + 0.001 * Math.max(0, parseInt(p.rag_atk) || 0);
            const ragDef = 1 + 0.001 * Math.max(0, parseInt(p.rag_def) || 0);
            const ragCritBonus = Number(((parseInt(p.rag_crit) || 0) * 0.1).toFixed(1));

            // 7. Các chỉ số tố chất hiệu quả
            const strEff = p.str_eff ?? p.str ?? 5;
            const agiEff = p.agi_eff ?? p.agi ?? 5;
            const vitEff = p.vit_eff ?? p.vit ?? 5;
            const intelEff = p.intel_eff ?? p.intel ?? 5;
            const dexEff = p.dex_eff ?? p.dex ?? 5;
            const lukEff = p.luk_eff ?? p.luk ?? 5;
            const vitBase = p.vit ?? 5;

            // 8. Tính toán các chỉ số chiến đấu phái sinh chuẩn 100%
            const vitHpBonus = Math.max(0, Math.max(0, vitEff - 5) * 2 - Math.max(0, vitBase - 5));
            const hp_max_eff = Math.floor(((p.hp_max || 100) + cardCB.hp + vitHpBonus) * ragHp);
            const mp_max_calc = Math.floor((50 + intelEff * 5 + cardCB.mp) * ragMp);

            const armor_max_calc = Math.floor((100 + Math.floor(Math.max(0, vitEff - 5) / 5) + Math.floor(Math.max(0, strEff - 5) / 2) + (p.armor_lv || 0) * 10 + armorModMax + armorUpSkillLv * 5 + cardCB.armor) * ragArmor);
            const def_calc = Math.floor((10 + Math.max(0, vitEff - 5) + Math.max(0, parseInt(p.armor_lv) || 0) + armorModDef + collCB) * ragDef);
            const crit_pct = Math.min(50, Math.floor((lukEff + strEff) / 10)) + ragCritBonus;

            const atk_pistol = Math.floor((20 + Math.max(0, dexEff - 5) * 2 + critShotSkillLv * 5 + ((p.gun_pistol_lv || 1) - 1) * 2 + modTotalAtk + cardCB.atk) * ragAtk);
            const atk_sniper = Math.floor((Math.round(120 + Math.max(0, dexEff - 5) * 2.5) + critShotSkillLv * 5 + ((p.gun_sniper_lv || 1) - 1) * 5 + modTotalAtk + cardCB.atk) * ragAtk);
            const atk_knife = Math.floor((10 + Math.max(0, strEff - 5) * 3 + ((p.knife_lv || 1) - 1) * 8 + modTotalAtk + cardCB.atk) * ragAtk);
            const atk_turret = Math.floor((20 + intelEff * 3 + deployTurretSkillLv * 5 + ((p.turret_lv || 1) - 1) * 2 + modTotalAtk + cardCB.atk) * ragAtk);
            const dodge_pct = Math.min(75, Math.floor(agiEff / 3));

            return {
              ...p,
              hp_max_eff,
              mp_max_calc,
              armor_max_calc,
              str: p.str ?? 5,
              agi: p.agi ?? 5,
              vit: p.vit ?? 5,
              intel: p.intel ?? 5,
              dex: p.dex ?? 5,
              luk: p.luk ?? 5,
              str_eff: p.str_eff ?? p.str ?? 5,
              agi_eff: p.agi_eff ?? p.agi ?? 5,
              vit_eff: p.vit_eff ?? p.vit ?? 5,
              intel_eff: p.intel_eff ?? p.intel ?? 5,
              dex_eff: p.dex_eff ?? p.dex ?? 5,
              luk_eff: p.luk_eff ?? p.luk ?? 5,
              atk_pistol,
              atk_sniper,
              atk_knife,
              atk_turret,
              crit_pct,
              def_calc,
              dodge_pct,
              skills: p.skills || '{}',
              skill_auto: p.skill_auto || '{}',
              cards: p.cards || '{}',
              eggs: p.eggs || '{}',
            };
          })() : null,
          mon_masters: (() => {
            const rawMM = (bot && bot.mon_masters && Object.keys(bot.mon_masters).length > 0)
              ? bot.mon_masters
              : monMastersCache;
            const formatted = {};
            for (const mid in rawMM) {
              const item = rawMM[mid];
              if (!item) continue;
              const orig = item.n || item.name || item.orig_n || '';
              formatted[mid] = {
                n: viDict[orig] || item.n || orig || `Quái #${mid}`,
                e: item.e || '👾',
                lv: parseInt(item.lv) || 1,
                cs: (item.cs || 'str').toLowerCase(),
                c: item.c || '#ef4444'
              };
            }
            return formatted;
          })(),
          isMvpCycling: bot.isMvpCycling || false,
          currentMvpBossInfo: bot.currentMvpBossInfo || null,
          aliveBossCount: bot.bosses ? bot.bosses.filter(b => (b.hp === undefined || (b.hp || 0) > 0)).length : 0,
          bossHuntActive: bot.settings.bossHuntMode !== 'off' || bot.guildDungeonActive === true,
          aliveBosses: (bot.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0)).map(b => ({
            id: b.id,
            name: b.name || 'Boss',
            emoji: b.emoji || '👾',
            lv: b.lv || 1,
            hp: b.hp,
            hp_max: b.hp_max,
            x: b.x,
            y: b.y,
            isTarget: b.id === bot.lastTargetedBossId
          })),
          marketBuyHistory: bot.marketBuyHistory || [],
          tradeInvite: bot.tradeInvite || null
        };
      });
    res.json(list);
  } catch (err) {
    console.error('Error in GET /api/accounts:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tài khoản: ' + err.message });
  }
});

// Update or set PHPSESSID for Auto-Relogin (Protected)
app.post('/api/accounts/:line_uid/phpsessid', requireAuth, async (req, res) => {
  const uid = req.params.line_uid;
  let phpsessid = req.body.phpsessid || req.body.cookie;
  if (!phpsessid) return res.status(400).json({ error: 'Thiếu PHPSESSID cookie' });

  const match = String(phpsessid).match(/PHPSESSID=([^;\s]+)/i);
  if (match) phpsessid = match[1];
  phpsessid = String(phpsessid).trim();

  const bot = botInstances[uid];
  if (!bot) return res.status(404).json({ error: 'Không tìm thấy tài khoản bot này' });
  if (bot.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền sửa đổi tài khoản này' });
  }

  bot.phpsessid = phpsessid;
  const currentAccounts = loadAccounts();
  const idx = currentAccounts.findIndex(acc => acc.line_uid === uid);
  if (idx !== -1) {
    currentAccounts[idx].phpsessid = phpsessid;
    saveAccounts(currentAccounts);
  }

  // Thử refresh token ngay lập tức
  const refreshed = await bot.refreshSession();
  return res.json({
    success: true,
    message: refreshed ? '✅ Cập nhật PHPSESSID & Làm mới Token thành công!' : '⚠️ Đã lưu PHPSESSID nhưng chưa thể làm mới token (vui lòng kiểm tra cookie)',
    refreshed,
    phpsessid
  });
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

  const { session_token, name, proxyId, ...settings } = req.body;

  if (settings.pollInterval !== undefined && req.user.role !== 'admin' && req.user.allowEditPollInterval !== true) {
    delete settings.pollInterval;
  }

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

    if (proxyId !== undefined && req.user.role === 'admin') {
      const assigned = proxyPool.forceAssignBot(bot.line_uid, proxyId);
      bot.proxyId = assigned;
      bot.isManualProxy = (proxyId !== 'auto');
    }

    if (Object.keys(settings).length > 0) {
      if (settings.targetMap !== undefined) {
        const targetMapNum = Number(settings.targetMap);
        const mapDef = getMapDefs().find(m => m.id === targetMapNum);
        if (mapDef && bot.player && (bot.player.lv || 1) < mapDef.req) {
          return res.status(400).json({ error: `Cấp độ không đủ! Bản đồ ${mapDef.name} yêu cầu Lv.${mapDef.req}+.` });
        }
      }
      if (settings.teamRole === 'leader') {
        const myTeamId = settings.teamId || bot.settings.teamId || 'none';
        if (myTeamId !== 'none') {
          Object.values(botInstances).forEach(otherBot => {
            if (otherBot.userId === bot.userId && otherBot.line_uid !== bot.line_uid) {
              const isSameTeam = (otherBot.settings.teamId || 'none') === myTeamId;
              if (isSameTeam && otherBot.settings.teamRole === 'leader') {
                otherBot.settings.teamRole = 'none';
                otherBot.addLog('SYSTEM', `Vai trò Leader của Team [${myTeamId.toUpperCase()}] đã được chuyển giao cho tài khoản khác.`);
              }
            }
          });
        }
      }
      bot.updateSettings(settings);
    }

    const currentAccounts = loadAccounts();
    const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
    if (index !== -1) {
      currentAccounts[index].session_token = bot.session_token;
      currentAccounts[index].name = bot.name;
      currentAccounts[index].settings = bot.settings;
      currentAccounts[index].proxyId = bot.proxyId;
      currentAccounts[index].isManualProxy = bot.isManualProxy;

      if (settings.teamRole === 'leader') {
        const myTeamId = settings.teamId || bot.settings.teamId || 'none';
        if (myTeamId !== 'none') {
          currentAccounts.forEach(acc => {
            if (acc.userId === bot.userId && acc.line_uid !== bot.line_uid) {
              const isSameTeam = (acc.settings && acc.settings.teamId || 'none') === myTeamId;
              if (isSameTeam && acc.settings && acc.settings.teamRole === 'leader') {
                acc.settings.teamRole = 'none';
              }
            }
          });
        }
      }

      saveAccounts(currentAccounts);
    }

    res.json({ success: true, settings: bot.settings, session_token: bot.session_token, name: bot.name, proxyId: bot.proxyId });
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

// Sync settings of Leader to Members
app.post('/api/team/sync', requireAuth, (req, res) => {
  const { leader_uid } = req.body;
  const leaderBot = botInstances[leader_uid];
  if (!leaderBot) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản Leader' });
  }
  if (!checkAccountOwnership(req, res, leaderBot)) return;

  if (leaderBot.settings.teamRole !== 'leader') {
    return res.status(400).json({ error: 'Tài khoản này không phải là Leader của Team' });
  }

  const leaderTeamId = leaderBot.settings.teamId || 'none';
  if (leaderTeamId === 'none') {
    return res.status(400).json({ error: 'Leader chưa được gán vào Đội nhóm (Team ID) nào để đồng bộ' });
  }

  const currentAccounts = loadAccounts();
  let syncCount = 0;
  const leaderSettings = { ...leaderBot.settings };
  delete leaderSettings.teamRole;
  delete leaderSettings.teamId;

  // Force autoMap = true and teamSynced = true on Leader and Members so team auto-warps to targetMap seamlessly
  leaderBot.updateSettings({ autoMap: true, teamSynced: true });
  leaderSettings.autoMap = true;
  leaderSettings.teamSynced = true;

  const leaderAccIdx = currentAccounts.findIndex(acc => acc.line_uid === leaderBot.line_uid);
  if (leaderAccIdx !== -1) {
    currentAccounts[leaderAccIdx].settings = leaderBot.settings;
  }

  currentAccounts.forEach(acc => {
    if (acc.userId === leaderBot.userId && acc.line_uid !== leaderBot.line_uid) {
      const isMemberOfSameTeam = acc.settings && 
                                 acc.settings.teamRole === 'member' && 
                                 (acc.settings.teamId || 'none') === leaderTeamId;
      if (isMemberOfSameTeam) {
        // Copy settings
        acc.settings = {
          ...leaderSettings,
          teamRole: 'member', // preserve member role
          teamId: leaderTeamId // preserve team membership
        };

        // Sync in-memory botInstance too
        const botInst = botInstances[acc.line_uid];
        if (botInst) {
          botInst.settings = { ...acc.settings };
          botInst.addLog('SYSTEM', `📥 [Team] Nhận cấu hình đồng bộ từ Trưởng nhóm: ${leaderBot.name}`);
        }
        syncCount++;
      }
    }
  });

  if (syncCount > 0) {
    saveAccounts(currentAccounts);
  }

  res.json({ ok: true, msg: `Đồng bộ cấu hình thành công cho ${syncCount} thành viên trong Team!` });
});

// Reorder accounts
app.post('/api/accounts/reorder', requireAuth, (req, res) => {
  const { line_uids } = req.body;
  if (!Array.isArray(line_uids)) {
    return res.status(400).json({ error: 'Mảng line_uids không hợp lệ' });
  }

  const currentAccounts = loadAccounts();
  const orderedAccounts = [];
  const accountMap = {};
  currentAccounts.forEach(acc => {
    accountMap[acc.line_uid] = acc;
  });

  // 1. Add the ones from line_uids in the exact order requested
  line_uids.forEach(uid => {
    if (accountMap[uid]) {
      orderedAccounts.push(accountMap[uid]);
      delete accountMap[uid];
    }
  });

  // 2. Add any remaining accounts
  currentAccounts.forEach(acc => {
    if (accountMap[acc.line_uid]) {
      orderedAccounts.push(accountMap[acc.line_uid]);
    }
  });

  saveAccounts(orderedAccounts);
  res.json({ ok: true, msg: 'Đã lưu thứ tự sắp xếp mới!' });
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
    lootLogs: bot.lootLogs || [],
    mvpHuntLog: bot.mvpHuntLog || []
  });
});

// Get offline rewards history
app.get('/api/accounts/:line_uid/offline-rewards', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;
  res.json({ ok: true, rewards: bot.offlineRewardsHistory || [] });
});

// Update offline farming zones
app.post('/api/accounts/:line_uid/offline-zones', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const { map, zones } = req.body;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  const targetMap = parseInt(map) || 1;
  const targetZones = Array.isArray(zones) ? zones.map(Number) : [];

  const success = await bot.syncOfflineZones(targetMap, targetZones);
  if (success) {
    bot.settings.offlineTargetMap = targetMap;
    bot.settings.offlineTargetZones = targetZones;
    const currentAccounts = loadAccounts();
    const idx = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
    if (idx !== -1) {
      currentAccounts[idx].settings = bot.settings;
      saveAccounts(currentAccounts);
    }
    res.json({ ok: true, message: 'Đã lưu cấu hình Zone offline thành công', map: targetMap, zones: targetZones });
  } else {
    res.status(400).json({ ok: false, error: 'Đồng bộ Zone offline với game server thất bại' });
  }
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

// Get market history from game server on-demand
app.get('/api/accounts/:line_uid/market-history', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  try {
    const rawData = await bot.sendRequest('https://ragnalok.online/human/xhrpg_market.php', {
      action: 'get_history',
      line_uid: bot.line_uid,
      session_token: bot.session_token
    });

    if (!rawData) {
      return res.json({ ok: true, history: [], message: 'Không nhận được dữ liệu từ máy chủ game.' });
    }

    // Extract items array if possible
    let list = [];
    if (Array.isArray(rawData)) {
      list = rawData;
    } else if (typeof rawData === 'object') {
      if (Array.isArray(rawData.history)) list = rawData.history;
      else if (Array.isArray(rawData.list)) list = rawData.list;
      else if (Array.isArray(rawData.logs)) list = rawData.logs;
      else if (Array.isArray(rawData.data)) list = rawData.data;
      else if (Array.isArray(rawData.items)) list = rawData.items;
      else if (Array.isArray(rawData.rows)) list = rawData.rows;
      else if (Array.isArray(rawData.records)) list = rawData.records;
      else if (Array.isArray(rawData.h)) list = rawData.h;
      else {
        // Check if object keys are numeric or contain item objects
        const values = Object.values(rawData).filter(v => v && typeof v === 'object' && (v.name || v.n || v.action || v.a || v.t || v.price || v.g));
        if (values.length > 0) {
          list = values;
        }
      }
    }

    // Extract summary stats if present (e.g. sell_cnt, buy_cnt)
    let summaryText = '';
    if (rawData.sell_cnt !== undefined || rawData.buy_cnt !== undefined) {
      summaryText = `7 ngày qua: Đã bán ${rawData.sell_cnt || 0} món, Đã mua ${rawData.buy_cnt || 0} món`;
    } else if (rawData.summary) {
      summaryText = translateThaiText(String(rawData.summary));
    }

    const formatted = list.map(item => {
      let timeStr = '';
      if (item.t) {
        const d = new Date(item.t * 1000);
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const secs = String(d.getSeconds()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        timeStr = `${hours}:${mins}:${secs} ${day}/${month}`;
      } else if (item.time || item.created_at || item.date) {
        timeStr = String(item.time || item.created_at || item.date);
      }

      let typeIcon = '📋';
      let typeLabel = 'Giao dịch';
      const rawAct = String(item.action || item.type || item.a || item.status || item.st || '').toLowerCase();
      
      if (rawAct.includes('sell') || rawAct.includes('sold') || rawAct.includes('ขายได้') || rawAct.includes('bán')) {
        typeIcon = '🏷️'; typeLabel = 'Đã bán';
      } else if (rawAct.includes('buy') || rawAct.includes('bought') || rawAct.includes('ซื้อมา') || rawAct.includes('mua')) {
        typeIcon = '🛒'; typeLabel = 'Đã mua';
      } else if (rawAct.includes('expire') || rawAct.includes('expired') || rawAct.includes('หมดอายุ') || rawAct.includes('hạn')) {
        typeIcon = '⏰'; typeLabel = 'Hết hạn';
      } else if (rawAct.includes('cancel') || rawAct.includes('hủy')) {
        typeIcon = '❌'; typeLabel = 'Đã hủy';
      } else if (rawAct.includes('list') || rawAct.includes('listed') || rawAct.includes('ลงขาย') || rawAct.includes('rao')) {
        typeIcon = '📦'; typeLabel = 'Đã rao';
      } else if (rawAct) {
        typeLabel = translateThaiText(rawAct);
      }

      const rawName = item.name || item.n || item.item_name || item.title || item.item || 'Vật phẩm';
      const translatedName = translateThaiText(String(rawName));

      return {
        name: translatedName,
        quantity: parseInt(item.quantity || item.qty || item.q || item.c || item.count || 1) || 1,
        price: parseInt(item.price || item.g || item.gold || item.p || 0) || 0,
        time: timeStr,
        timestamp: item.t || 0,
        typeIcon,
        typeLabel,
        rawAction: rawAct
      };
    });

    let message = '';
    if (rawData.msg || rawData.message || rawData.info || rawData.error) {
      message = translateThaiText(String(rawData.msg || rawData.message || rawData.info || rawData.error));
    }

    return res.json({
      ok: true,
      history: formatted,
      summary: summaryText,
      message: message
    });
  } catch (err) {
    res.status(500).json({ error: `Không thể tải lịch sử chợ: ${err.message}` });
  }
});

// Get bot local auto-buy market history
app.get('/api/accounts/:line_uid/market-buy-history', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;
  res.json({ ok: true, history: bot.marketBuyHistory || [] });
});

// Clear bot local auto-buy market history
app.delete('/api/accounts/:line_uid/market-buy-history', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;
  bot.marketBuyHistory = [];
  const currentAccounts = loadAccounts();
  const accIndex = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
  if (accIndex !== -1) {
    currentAccounts[accIndex].marketBuyHistory = [];
    saveAccounts(currentAccounts);
  }
  res.json({ ok: true, message: 'Đã xóa lịch sử mua tự động.' });
});

// Helper to format/translate market items
function formatMarketListing(l) {
  if (!l) return null;
  const rawName = String(l.item_name || '');
  const rawDesc = String(l.item_desc || '');
  let transName = translateThaiText(rawName);
  let transDesc = translateThaiText(rawDesc);

  // Additional regex patterns for card/egg/box
  let m;
  if ((m = rawName.match(/^ไข่(.+?)( ⭐MVP)?$/u))) {
    transName = 'Trứng ' + translateThaiText(m[1]) + (m[2] || '');
  } else if ((m = rawName.match(/^กล่องการ์ด Lv\.(\d+)-(\d+)$/u))) {
    transName = `Hộp thẻ bài Lv.${m[1]}-${m[2]}`;
  } else if ((m = rawName.match(/^กล่องไข่ Lv\.(\d+)-(\d+)$/u))) {
    transName = `Hộp trứng Lv.${m[1]}-${m[2]}`;
  } else if ((m = rawName.match(/^กล่องโมดูล(.+)$/u))) {
    transName = `Hộp module ${translateThaiText(m[1])}`;
  }

  if ((m = rawDesc.match(/^สัตว์เลี้ยง Lv\.(\d+) · ค่าฟัก ([\d,]+) G$/u))) {
    transDesc = `Thú cưng Lv.${m[1]} · Phí ấp ${m[2]} G`;
  } else if ((m = rawDesc.match(/^การ์ด · \+(\d+) (.+)$/u))) {
    transDesc = `Thẻ bài · +${m[1]} ${translateThaiText(m[2])}`;
  } else if ((m = rawDesc.match(/^ดาเมจ ×([\d.]+)$/u))) {
    transDesc = `Sát thương ×${m[1]}`;
  } else if ((m = rawDesc.match(/^สุ่มการ์ดมอน Lv\.(\d+)-(\d+) · ⭐MVP 1%$/u))) {
    transDesc = `Ngẫu nhiên thẻ quái Lv.${m[1]}-${m[2]} · ⭐MVP 1%`;
  } else if ((m = rawDesc.match(/^สุ่มไข่มอน Lv\.(\d+)-(\d+) · ⭐MVP 1%$/u))) {
    transDesc = `Ngẫu nhiên trứng quái Lv.${m[1]}-${m[2]} · ⭐MVP 1%`;
  }

  // Diamond icon cleanup
  let icon = l.item_icon || '📦';
  if (rawName === 'เพชรฟ้า' || transName.includes('Lam Bảo') || transName.includes('Kim Cương Xanh') || transName.toLowerCase().includes('kim cương')) {
    icon = '💎';
  }

  return {
    id: parseInt(l.id) || l.id,
    seller_uid: l.seller_uid,
    seller_name: l.seller_name || 'Người bán',
    item_type: l.item_type || 'other',
    item_id: l.item_id,
    item_slot: l.item_slot || '',
    item_tier: parseInt(l.item_tier) || 0,
    item_icon: icon,
    item_name: transName,
    item_name_raw: rawName,
    item_desc: transDesc,
    item_desc_raw: rawDesc,
    item_rarity: l.item_rarity || 'white',
    item_payload: l.item_payload,
    qty: parseInt(l.qty) || 1,
    price_per: parseInt(l.price_per) || 0,
    created_at: l.created_at,
    expires_at: parseInt(l.expires_at) || 0
  };
}

// 1. Get Live Market Listings on-demand
app.get('/api/accounts/:line_uid/market/listings', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  try {
    const rawData = await bot.sendRequest('https://ragnalok.online/human/xhrpg_market.php', {
      action: 'get_listings',
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      lang: 'vi'
    });

    if (!rawData || !rawData.ok) {
      return res.json({ ok: false, error: translateThaiText(rawData?.error || 'Không thể tải danh sách chợ từ game server') });
    }

    const listings = (rawData.listings || []).map(formatMarketListing).filter(Boolean);
    res.json({
      ok: true,
      listings,
      gold: bot.player?.gold || 0
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: `Lỗi kết nối chợ: ${err.message}` });
  }
});

// 2. Get My Active Listings on-demand
app.get('/api/accounts/:line_uid/market/my-listings', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  try {
    const rawData = await bot.sendRequest('https://ragnalok.online/human/xhrpg_market.php', {
      action: 'get_my_listings',
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      lang: 'vi'
    });

    if (!rawData || !rawData.ok) {
      return res.json({ ok: false, error: translateThaiText(rawData?.error || 'Không thể tải danh sách đang bán') });
    }

    const myListings = (rawData.listings || rawData.my || []).map(formatMarketListing).filter(Boolean);
    res.json({
      ok: true,
      listings: myListings,
      gold: bot.player?.gold || 0
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: `Lỗi kết nối danh sách đang bán: ${err.message}` });
  }
});

// 3. Buy Item from Market
app.post('/api/accounts/:line_uid/market/buy', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const { listing_id, qty } = req.body;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  if (!listing_id) {
    return res.status(400).json({ ok: false, error: 'Thiếu listing_id' });
  }

  const buyQty = Math.max(1, parseInt(qty) || 1);

  try {
    const rawData = await bot.sendRequest('https://ragnalok.online/human/xhrpg_market.php', {
      action: 'buy',
      listing_id: Number(listing_id),
      qty: buyQty,
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      lang: 'vi'
    });

    if (!rawData || !rawData.ok) {
      return res.json({ ok: false, error: translateThaiText(rawData?.error || 'Không thể mua vật phẩm') });
    }

    if (rawData.player) {
      bot.player = rawData.player;
    }

    const msg = translateThaiText(rawData.msg || 'Mua vật phẩm thành công!');
    bot.addLog('SUCCESS', `🛒 [Chợ Thủ Công] ${msg}`);

    res.json({
      ok: true,
      msg,
      gold: bot.player?.gold || 0
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: `Lỗi khi mua vật phẩm: ${err.message}` });
  }
});

// 4. Sell Item to Market
app.post('/api/accounts/:line_uid/market/sell', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  const {
    item_type, item_id, item_slot, item_tier,
    item_icon, item_name, item_desc, item_rarity,
    qty, price_per, item_payload
  } = req.body;

  if (!item_type || !price_per || price_per <= 0) {
    return res.status(400).json({ ok: false, error: 'Thông tin vật phẩm hoặc giá bán không hợp lệ' });
  }

  try {
    const payload = {
      action: 'sell',
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      item_type,
      item_id: item_id || 0,
      item_slot: item_slot || '',
      item_tier: item_tier || 0,
      item_icon: item_icon || '📦',
      item_name: item_name || 'Vật phẩm',
      item_desc: item_desc || '',
      item_rarity: item_rarity || 'white',
      qty: Math.max(1, parseInt(qty) || 1),
      price_per: Math.max(1, parseInt(price_per) || 1),
      lang: 'vi'
    };

    if (item_payload) {
      payload.item_payload = typeof item_payload === 'object' ? JSON.stringify(item_payload) : item_payload;
    }

    const rawData = await bot.sendRequest('https://ragnalok.online/human/xhrpg_market.php', payload);

    if (!rawData || !rawData.ok) {
      return res.json({ ok: false, error: translateThaiText(rawData?.error || 'Không thể đăng bán vật phẩm') });
    }

    if (rawData.player) {
      bot.player = rawData.player;
    }

    const msg = translateThaiText(rawData.msg || 'Đăng bán vật phẩm thành công!');
    bot.addLog('SUCCESS', `🏷️ [Chợ Thủ Công] ${msg}`);

    res.json({
      ok: true,
      msg,
      gold: bot.player?.gold || 0
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: `Lỗi khi đăng bán: ${err.message}` });
  }
});

// 5. Cancel Listing from Market
app.post('/api/accounts/:line_uid/market/cancel', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const { listing_id } = req.body;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  if (!listing_id) {
    return res.status(400).json({ ok: false, error: 'Thiếu listing_id' });
  }

  try {
    const rawData = await bot.sendRequest('https://ragnalok.online/human/xhrpg_market.php', {
      action: 'cancel',
      listing_id: Number(listing_id),
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      lang: 'vi'
    });

    if (!rawData || !rawData.ok) {
      return res.json({ ok: false, error: translateThaiText(rawData?.error || 'Không thể hủy vật phẩm rao bán') });
    }

    if (rawData.player) {
      bot.player = rawData.player;
    }

    const msg = translateThaiText(rawData.msg || 'Hủy bán thành công, vật phẩm đã hoàn trả về túi đồ!');
    bot.addLog('INFO', `❌ [Chợ Thủ Công] ${msg}`);

    res.json({
      ok: true,
      msg,
      gold: bot.player?.gold || 0
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: `Lỗi khi hủy bán: ${err.message}` });
  }
});

// 6. Get Player Sellable Inventory
app.get('/api/accounts/:line_uid/market/inventory-for-sell', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  const p = bot.player;
  if (!p) {
    return res.json({ ok: true, items: [] });
  }

  const items = [];

  // 1. Resources
  const resDefs = [
    { field:'wood', icon:'🪵', name:'Gỗ (Wood)', desc:'Nguyên liệu phi thuyền', th_name:'ไม้' },
    { field:'stone', icon:'🪨', name:'Đá (Stone)', desc:'Nguyên liệu phi thuyền', th_name:'หิน' },
    { field:'iron', icon:'🔩', name:'Sắt (Iron)', desc:'Nguyên liệu vũ khí', th_name:'เหล็ก' },
    { field:'copper', icon:'🟤', name:'Đồng (Copper)', desc:'Nguyên liệu vũ khí', th_name:'ทองแดง' },
    { field:'herb', icon:'🌿', name:'Thảo Dược (Herb)', desc:'Nguyên liệu bào chế thuốc', th_name:'สมุนไพร' }
  ];
  for (const r of resDefs) {
    const qty = parseInt(p[r.field]) || 0;
    if (qty > 0) {
      items.push({
        id: `res_${r.field}`,
        item_type: 'resource',
        item_id: r.field,
        item_slot: r.field,
        item_tier: 0,
        icon: r.icon,
        name: r.name,
        raw_name: r.th_name,
        desc: r.desc,
        rarity: 'white',
        qty,
        suggested: r.field === 'iron' ? 12 : (r.field === 'copper' ? 15 : (r.field === 'herb' ? 8 : (r.field === 'stone' ? 5 : 3)))
      });
    }
  }

  // 2. Diamonds
  const diaDefs = [
    { field:'diamond_blue', icon:'💎', name:'Kim Cương Xanh', desc:'Cường hóa Module', rarity:'blue', th_name:'เพชรฟ้า', sugg: 50 },
    { field:'diamond_red', icon:'🔴', name:'Kim Cương Đỏ', desc:'Cường hóa Module +6 trở lên', rarity:'red', th_name:'เพชรแดง', sugg: 200 },
    { field:'diamond_green', icon:'🟢', name:'Kim Cương Lục', desc:'Cường hóa Module +12 trở lên', rarity:'green', th_name:'เพชรเขียว', sugg: 500 }
  ];
  for (const d of diaDefs) {
    const qty = parseInt(p[d.field]) || 0;
    if (qty > 0) {
      items.push({
        id: `dia_${d.field}`,
        item_type: 'diamond',
        item_id: d.field,
        item_slot: d.field,
        item_tier: 0,
        icon: d.icon,
        name: d.name,
        raw_name: d.th_name,
        desc: d.desc,
        rarity: d.rarity,
        qty,
        suggested: d.sugg
      });
    }
  }

  // 3. Ores
  const oreDefs = [
    { slot:'ore1', icon:'🌙', name:'Quặng Mặt Trăng', desc:'Đóng góp nâng cấp Guild', rarity:'blue', th_name:'แร่จันทรา', sugg: 1000 },
    { slot:'ore2', icon:'☄️', name:'Mảnh Thiên Thạch', desc:'Đóng góp nâng cấp Guild', rarity:'purple', th_name:'เศษดาวตก', sugg: 3000 },
    { slot:'ore3', icon:'🌌', name:'Tinh Thể Tinh Vân', desc:'Đóng góp nâng cấp Guild', rarity:'gold', th_name:'ผลึกเนบิวลา', sugg: 10000 },
    { slot:'ore4', icon:'🟩', name:'Ngọc Thạch', desc:'Khai thác từ nông trại', rarity:'blue', th_name:'หินหยก', sugg: 500 },
    { slot:'ore5', icon:'🍯', name:'Hổ Phách Cổ', desc:'Khai thác từ nông trại', rarity:'purple', th_name:'อำพันโบราณ', sugg: 1500 },
    { slot:'ore6', icon:'🪩', name:'Tinh Thể Sương', desc:'Khai thác từ nông trại', rarity:'gold', th_name:'ผลึกน้ำค้าง', sugg: 5000 }
  ];
  for (const o of oreDefs) {
    const qty = parseInt(p[o.slot]) || 0;
    if (qty > 0) {
      items.push({
        id: `ore_${o.slot}`,
        item_type: 'ore',
        item_id: o.slot,
        item_slot: o.slot,
        item_tier: 0,
        icon: o.icon,
        name: o.name,
        raw_name: o.th_name,
        desc: o.desc,
        rarity: o.rarity,
        qty,
        suggested: o.sugg
      });
    }
  }

  // 4. Boxes
  const boxRarities = ['blue', 'purple', 'gold', 'red'];
  const boxMetaNames = ['Cao Cấp (T2)', 'Hiếm (T3)', 'Sử Thi (T4)', 'Sử Thi+ (T5)'];
  for (let t = 1; t <= 4; t++) {
    const n = parseInt(p['module_box' + t]) || 0;
    if (n > 0) {
      items.push({
        id: `module_box_${t}`,
        item_type: 'module_box',
        item_id: 0,
        item_slot: '',
        item_tier: t,
        icon: '📦',
        name: `Hộp Module ${boxMetaNames[t - 1]}`,
        raw_name: `กล่องโมดูล T${t}`,
        desc: `Mở ngẫu nhiên module ${t + 1} lỗ`,
        rarity: boxRarities[t - 1],
        qty: n,
        suggested: [150, 400, 900, 2000][t - 1]
      });
    }
  }

  const cardEggRarities = ['white', 'green', 'blue', 'purple', 'gold', 'red', 'red', 'red'];
  for (let t = 1; t <= 8; t++) {
    const cn = parseInt(p['card_box' + t]) || 0;
    const lo = (t - 1) * 10 + 1, hi = t * 10;
    if (cn > 0) {
      items.push({
        id: `card_box_${t}`,
        item_type: 'card_box',
        item_id: 0,
        item_slot: '',
        item_tier: t,
        icon: '🎁',
        name: `Hộp Thẻ Bài Lv.${lo}-${hi}`,
        raw_name: `กล่องการ์ด Lv.${lo}-${hi}`,
        desc: `Ngẫu nhiên thẻ quái Lv.${lo}-${hi} (⭐MVP 1%)`,
        rarity: cardEggRarities[t - 1],
        qty: cn,
        suggested: [150, 400, 900, 2000, 5000, 10000, 15000, 20000][t - 1]
      });
    }
    const en = parseInt(p['egg_box' + t]) || 0;
    if (en > 0) {
      items.push({
        id: `egg_box_${t}`,
        item_type: 'egg_box',
        item_id: 0,
        item_slot: '',
        item_tier: t,
        icon: '🧰',
        name: `Hộp Trứng Lv.${lo}-${hi}`,
        raw_name: `กล่องไข่ Lv.${lo}-${hi}`,
        desc: `Ngẫu nhiên trứng quái Lv.${lo}-${hi} (⭐MVP 1%)`,
        rarity: cardEggRarities[t - 1],
        qty: en,
        suggested: [150, 400, 900, 2000, 5000, 10000, 15000, 20000][t - 1]
      });
    }
  }

  // 5. Cards
  let userCards = p.cards;
  if (typeof userCards === 'string') {
    try { userCards = JSON.parse(userCards); } catch(e) { userCards = {}; }
  }
  if (userCards && typeof userCards === 'object') {
    for (const mid in userCards) {
      const mm = monMastersCache[mid];
      const entry = userCards[mid] || {};
      const monName = mm ? mm.n : `Quái #${mid}`;
      const monIcon = mm ? (mm.e || '🎴') : '🎴';
      const monLv = mm ? (mm.lv || 1) : 1;
      const monStat = mm ? (mm.cs || 'STR').toUpperCase() : 'STR';

      if ((entry.n | 0) > 0) {
        items.push({
          id: `card_n_${mid}`,
          item_type: 'card',
          item_id: parseInt(mid),
          item_slot: 'normal',
          item_tier: 0,
          icon: monIcon,
          name: `Thẻ ${monName}`,
          raw_name: `${mm?.orig_n || monName}`,
          desc: `Thẻ bài · +${Math.max(1, Math.floor(monLv / 2))} ${monStat}`,
          rarity: monLv <= 4 ? 'white' : (monLv <= 9 ? 'green' : (monLv <= 14 ? 'blue' : (monLv <= 19 ? 'purple' : 'gold'))),
          qty: entry.n | 0,
          suggested: Math.max(100, monLv * 50)
        });
      }
      if ((entry.m | 0) > 0) {
        items.push({
          id: `card_m_${mid}`,
          item_type: 'card',
          item_id: parseInt(mid),
          item_slot: 'mvp',
          item_tier: 0,
          icon: '⭐' + monIcon,
          name: `Thẻ ⭐MVP ${monName}`,
          raw_name: `${mm?.orig_n || monName} ⭐MVP`,
          desc: `Thẻ bài MVP · +${Math.max(1, Math.floor(monLv / 2)) * 3} ${monStat} & Hiệu ứng Khảm`,
          rarity: 'red',
          qty: entry.m | 0,
          suggested: Math.max(500, monLv * 500)
        });
      }
    }
  }

  // 6. Eggs
  let userEggs = p.eggs;
  if (typeof userEggs === 'string') {
    try { userEggs = JSON.parse(userEggs); } catch(e) { userEggs = {}; }
  }
  if (userEggs && typeof userEggs === 'object') {
    for (const mid in userEggs) {
      const mm = monMastersCache[mid];
      const entry = userEggs[mid] || {};
      const monName = mm ? mm.n : `Quái #${mid}`;
      const monLv = mm ? (mm.lv || 1) : 1;

      if ((entry.n | 0) > 0) {
        items.push({
          id: `egg_n_${mid}`,
          item_type: 'egg',
          item_id: parseInt(mid),
          item_slot: 'normal',
          item_tier: 0,
          icon: '🥚',
          name: `Trứng ${monName}`,
          raw_name: `ไข่${mm?.orig_n || monName}`,
          desc: `Thú cưng Lv.${monLv} · Phí ấp ${(monLv * 100).toLocaleString()} G`,
          rarity: monLv <= 4 ? 'white' : (monLv <= 9 ? 'green' : (monLv <= 14 ? 'blue' : (monLv <= 19 ? 'purple' : 'gold'))),
          qty: entry.n | 0,
          suggested: Math.max(100, monLv * 500)
        });
      }
      if ((entry.m | 0) > 0) {
        items.push({
          id: `egg_m_${mid}`,
          item_type: 'egg',
          item_id: parseInt(mid),
          item_slot: 'mvp',
          item_tier: 0,
          icon: '⭐🥚',
          name: `Trứng ⭐MVP ${monName}`,
          raw_name: `ไข่${mm?.orig_n || monName} ⭐MVP`,
          desc: `Thú cưng MVP Lv.${monLv} · Phí ấp ${(monLv * 1000).toLocaleString()} G`,
          rarity: 'red',
          qty: entry.m | 0,
          suggested: Math.max(1000, monLv * 5000)
        });
      }
    }
  }

  // 7. Modules
  const modCategories = [
    { key: 'module_pistol', field: 'module_inventory', label: 'Dao Găm (Pistol)', ico: '🔪' },
    { key: 'module_sniper', field: 'sniper_module_inventory', label: 'Dao Dài (Sniper)', ico: '🗡️' },
    { key: 'module_knife', field: 'knife_module_inventory', label: 'Kiếm (Sword)', ico: '🗡️' },
    { key: 'module_axe', field: 'axe_module_inventory', label: 'Rìu (Axe)', ico: '🪓' },
    { key: 'module_robot', field: 'robot_module_inventory', label: 'Titan', ico: '🔋' },
    { key: 'module_armor', field: 'armor_module_inventory', label: 'Khiên (Armor)', ico: '🛡️' },
    { key: 'module_house', field: 'house_module_inventory', label: 'Phi Thuyền', ico: '🛸' },
    { key: 'module_turret', field: 'turret_module_inventory', label: 'Pháo Tháp', ico: '🗼' }
  ];

  const modRarities = ['white', 'green', 'blue', 'purple', 'gold', 'red', 'red'];
  const modRarityNames = ['Phổ thông', 'Hiếm', 'Cao cấp', 'Sử thi', 'Huyền thoại', 'Thần thoại', 'Thần thoại+'];

  for (const mc of modCategories) {
    let list = p[mc.field];
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch(e) { list = []; }
    }
    if (Array.isArray(list)) {
      list.forEach((m, idx) => {
        if (!m) return;
        const rar = parseInt(m.rarity) || 1;
        const plus = parseInt(m.plus) || 0;
        const slotName = m.slot === 'barrel' ? 'Nòng' : (m.slot === 'sight' ? 'Ống ngắm' : (m.slot === 'mag' ? 'Băng đạn' : m.slot));
        const rarName = modRarityNames[rar - 1] || 'Phổ thông';
        items.push({
          id: `${mc.key}_${idx}`,
          item_type: mc.key,
          item_id: idx,
          item_slot: m.slot || 'barrel',
          item_tier: rar,
          icon: mc.ico,
          name: `${mc.ico} ${mc.label} ${slotName} +${plus}`,
          raw_name: `${mc.label} ${m.slot} +${plus}`,
          desc: `Phẩm chất: ${rarName} (${rar} lỗ) · ${m.stat ? m.stat.toUpperCase() + ' +' + rar : ''}`,
          rarity: modRarities[rar - 1] || 'white',
          qty: 1,
          isModule: true,
          item_payload: {
            slot: m.slot || 'barrel',
            rarity: rar,
            plus: plus,
            stat: m.stat || null,
            cards: m.cards || []
          },
          suggested: [60, 150, 400, 900, 2000, 5000, 12000][rar - 1] || 100
        });
      });
    }
  }

  res.json({
    ok: true,
    gold: p.gold || 0,
    items
  });
});

// Get bot local event war history
app.get('/api/accounts/:line_uid/event-war-history', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  // Nếu sự kiện đang chạy, ưu tiên fetch dữ liệu mới nhất
  const currentEpoch = Math.floor(Date.now() / 1000);
  const isGwActive = bot.lastGw && (bot.lastGw.st === 'open' || bot.lastGw.st === 'fight') && (!bot.lastGw.ends || bot.lastGw.ends > currentEpoch);
  const isCwActive = bot.lastCw && (bot.lastCw.st === 'open' || bot.lastCw.st === 'fight') && (!bot.lastCw.ends || bot.lastCw.ends > currentEpoch);
  
  if (bot.inEventMode || isGwActive || isCwActive) {
    if (!bot.currentEventKind && (isGwActive || isCwActive)) {
      bot.currentEventKind = isGwActive ? 'gw' : 'cw';
    }
    try {
      await bot.fetchWarLog();
    } catch (e) {}
  }

  res.json({ 
    ok: true, 
    playerName: bot.player ? bot.player.name : '',
    history: bot.eventWarHistory || [] 
  });
});

// Clear bot local event war history
app.delete('/api/accounts/:line_uid/event-war-history', requireAuth, (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  bot.eventWarHistory = [];
  res.json({ ok: true, message: 'Đã xóa lịch sử sự kiện thành công.' });
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

// Verify outbound public IP for a specific bot instance
app.get('/api/accounts/:line_uid/proxy-check', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!bot) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  if (!checkAccountOwnership(req, res, bot)) return;

  const proxyInfo = proxyPool.getBotProxyInfo(line_uid);
  const dispatcher = proxyPool.getDispatcher(line_uid);

  try {
    const startTime = Date.now();
    const response = await fetch('https://api.ipify.org?format=json', {
      dispatcher,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const latencyMs = Date.now() - startTime;
    if (!response.ok) {
      throw new Error(`HTTP Status ${response.status}`);
    }
    const data = await response.json();
    const outboundIp = data.ip || 'Unknown';

    res.json({
      ok: true,
      line_uid,
      accountName: bot.username || bot.line_uid,
      proxyInfo,
      outboundIp,
      latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      line_uid,
      proxyInfo,
      error: `Lỗi kết nối qua Proxy: ${err.message}`
    });
  }
});

// Verify outbound public IPs for all proxy streams in pool (Admin only)
app.get('/api/admin/proxies/verify-all', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền' });

  const stats = proxyPool.getStats();
  const results = [];

  for (const p of stats) {
    const dispatcher = p.isDirect ? proxyPool._directAgent : proxyPool._agents[p.id];
    if (!dispatcher) {
      results.push({ ...p, ok: false, error: 'Dispatcher chưa khởi tạo / Proxy đang tắt' });
      continue;
    }
    const startTime = Date.now();
    try {
      const resp = await fetch('https://api.ipify.org?format=json', {
        dispatcher,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const latencyMs = Date.now() - startTime;
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      results.push({
        id: p.id,
        label: p.label,
        isDirect: p.isDirect,
        configuredUrl: p.url,
        outboundIp: data.ip,
        latencyMs,
        botCount: p.botCount,
        maxBots: p.maxBots,
        active: p.active,
        ok: true
      });
    } catch (e) {
      results.push({
        id: p.id,
        label: p.label,
        isDirect: p.isDirect,
        configuredUrl: p.url,
        outboundIp: null,
        latencyMs: Date.now() - startTime,
        botCount: p.botCount,
        maxBots: p.maxBots,
        active: p.active,
        ok: false,
        error: e.message
      });
    }
  }

  res.json({ success: true, timestamp: new Date().toISOString(), results });
});

// Admin Map & Zone Sync Endpoints
app.get('/api/admin/maps-zones', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });
  res.json({
    success: true,
    maps: getMapDefs(),
    spotsCache: spotsCache,
    lastSyncedAt: lastMapSyncAt
  });
});

app.post('/api/admin/sync-maps-zones', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện đồng bộ' });
  const result = await syncMapsAndZonesFromGame();
  res.json(result);
});

app.put('/api/admin/maps/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện' });
  const mapId = parseInt(req.params.id);
  const { name, emoji, req: minReq } = req.body;
  const targetMap = mapsCache.find(m => m.id === mapId);
  if (!targetMap) return res.status(404).json({ error: 'Không tìm thấy bản đồ chỉ định.' });

  if (name !== undefined && String(name).trim() !== '') targetMap.name = String(name).trim();
  if (emoji !== undefined && String(emoji).trim() !== '') targetMap.emoji = String(emoji).trim();
  if (minReq !== undefined) targetMap.req = Math.max(1, parseInt(minReq) || 1);

  lastMapSyncAt = new Date().toISOString();
  saveMapsCache();
  res.json({ success: true, map: targetMap, maps: mapsCache });
});

// Proxy for xhrpg_trade.php
app.post('/api/accounts/:line_uid/trade', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  try {
    const payload = Object.assign({
      line_uid: bot.line_uid,
      session_token: bot.session_token,
      lang: 'vi'
    }, req.body || {});

    const gameRes = await bot.sendRequest('https://ragnalok.online/human/xhrpg_trade.php', payload);
    
    let parsedRes = gameRes;
    if (typeof gameRes === 'string') {
      try {
        parsedRes = JSON.parse(gameRes);
      } catch (e) {
        // Not JSON, return as is or error
      }
    }

    if (parsedRes && parsedRes.player) {
      bot.updatePlayerState(parsedRes.player);
    }

    if (payload.action === 'respond' || payload.action === 'cancel') {
      bot.tradeInvite = null;
    }

    res.json(parsedRes || { ok: 0, error: 'Không nhận được phản hồi từ game server' });
  } catch (err) {
    console.error(`[TRADE API ERROR] Bot ${line_uid}:`, err);
    res.status(500).json({ ok: 0, error: 'Internal Server Error', details: err.message });
  }
});

// Trigger manual action
app.post('/api/accounts/:line_uid/action', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const { action, param, extra } = req.body;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  if (action === 'force_mvp_hunt') {
    try {
      const myTeamId = bot.settings.teamId || 'none';
      const targetBots = Object.values(botInstances).filter(b => {
        if (b.userId !== bot.userId) return false;
        if (myTeamId === 'none') {
          return b.line_uid === bot.line_uid;
        } else {
          return (b.settings.teamId || 'none') === myTeamId;
        }
      });
      const currentAccounts = loadAccounts();
      
      for (const targetBot of targetBots) {
        targetBot.updateSettings({ bossHuntMode: 'type2' });
        
        const index = currentAccounts.findIndex(acc => acc.line_uid === targetBot.line_uid);
        if (index !== -1) {
          currentAccounts[index].settings = targetBot.settings;
        }
        
        // Chỉ gọi triggerMvpCycle cho trưởng nhóm hoặc bot chạy độc lập
        // Thành viên sẽ tự động đồng bộ theo trưởng nhóm trong pollGame()
        if (targetBot.settings.teamRole !== 'member') {
          targetBot.triggerMvpCycle(true);
        } else {
          const leader = targetBots.find(b => b.settings.teamRole === 'leader');
          if (leader) {
            targetBot.isMvpCycling = leader.isMvpCycling;
            targetBot.mvpCycleMapIndex = leader.mvpCycleMapIndex;
            targetBot.mvpCycleOriginalMap = leader.mvpCycleOriginalMap;
          } else {
            targetBot.triggerMvpCycle(true);
          }
        }
        
        const msgTeam = myTeamId !== 'none' ? `cho Team [${myTeamId.toUpperCase()}]` : 'độc lập';
        targetBot.addLog('SYSTEM', `🚀 [Auto Boss] Kích hoạt chế độ đi săn Boss xoay vòng ${msgTeam}!`);
      }
      
      saveAccounts(currentAccounts);
      const successMsg = myTeamId !== 'none'
        ? `Đã kích hoạt chế độ đi săn Boss xoay vòng cho Team [${myTeamId.toUpperCase()}]!`
        : 'Đã kích hoạt chế độ đi săn Boss xoay vòng độc lập!';
      return res.json({ ok: true, msg: successMsg });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (action === 'set_boss_target') {
    const bossId = extra && extra.bossId !== undefined && extra.bossId !== null ? extra.bossId : null;
    if (bossId === null) {
      bot.manualTargetBossId = null;
      bot.addLog('SYSTEM', '🎯 [Manual Target] Đã hủy chỉ định boss thủ công. Quay lại chế độ tự động.');
      return res.json({ ok: true, msg: 'Đã hủy chỉ định boss. Bot sẽ tự chọn mục tiêu.' });
    }
    const searchPool = bot.bosses || [];
    const aliveBoss = searchPool.find(b => String(b.id) === String(bossId) && (b.hp === undefined || (b.hp || 0) > 0));
    if (!aliveBoss) {
      return res.status(400).json({ error: 'Boss không tồn tại hoặc đã chết.' });
    }
    bot.manualTargetBossId = aliveBoss.id;
    bot.addLog('SYSTEM', `🎯 [Manual Target] User chỉ định mục tiêu: ${aliveBoss.emoji || '👾'} ${aliveBoss.name || 'Boss'} (Lv.${aliveBoss.lv || 1})`);
    return res.json({ ok: true, msg: `Đã chỉ định mục tiêu: ${aliveBoss.emoji || '👾'} ${aliveBoss.name}` });
  }

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

    if (action === 'gdun_enter_team') {
      const ok = await bot.enterGuildDungeon(true);
      const myTeamId = bot.settings.teamId || 'none';
      if (myTeamId !== 'none') {
        const members = Object.values(botInstances).filter(b => 
          b.userId === bot.userId && 
          b.settings.teamRole === 'member' && 
          (b.settings.teamId || 'none') === myTeamId &&
          b.settings.teamSynced === true &&
          b.status === 'running'
        );
        for (const mem of members) {
          mem.enterGuildDungeon(true).catch(() => {});
        }
      }
      return res.json({ ok, msg: ok ? '🏰 Đã kích hoạt Săn Boss Guild (Cả Team)' : 'Không thể vào Phụ Bản Guild (Nhưng đã gửi lệnh cho thành viên)' });
    }
    if (action === 'gdun_enter_solo' || action === 'gdun_enter') {
      const ok = await bot.enterGuildDungeon(false);
      return res.json({ ok, msg: ok ? '👤 Đã kích hoạt Săn Boss Guild (Đi 1 Mình)' : 'Không thể vào Phụ Bản Guild' });
    }
    if (action === 'gdun_exit') {
      const ok = await bot.exitGuildDungeon();
      return res.json({ ok, msg: ok ? '↩️ Đã thoát khỏi Phụ Bản Guild' : 'Không thể thoát Phụ Bản Guild' });
    }

    let url = 'https://ragnalok.online/human/xhrpg_upgrade.php';
    if (action === 'gwar_join') {
      url = 'https://ragnalok.online/human/xhrpg_guild.php';
      payload = {
        line_uid: bot.line_uid,
        session_token: bot.session_token,
        action: 'gwar_join',
        lang: 'vi'
      };
    } else if (action === 'cwar_join') {
      url = 'https://ragnalok.online/human/xhrpg_cwar.php';
      payload = {
        line_uid: bot.line_uid,
        session_token: bot.session_token,
        action: 'cwar_join',
        lang: 'vi'
      };
    } else if (action === 'warp') {
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
        
        // Trực tiếp kích hoạt Event Mode nếu người dùng nhấn vào thông báo
        const isInvActive = bot.lastInv && (bot.lastInv.st === 'pre' || bot.lastInv.st === 'active');
        if (targetMapNum === 2 && isInvActive) {
          bot.enterEventMode('inv', 2);
        }

        const mapDef = getMapDefs().find(m => m.id === targetMapNum);
        if (mapDef && bot.player && (bot.player.lv || 1) < mapDef.req) {
          return res.status(400).json({ error: `Cấp độ không đủ! Bản đồ ${mapDef.name} yêu cầu Lv.${mapDef.req}+.` });
        }
        bot.updateSettings({ targetMap: targetMapNum, autoMap: true });
        const currentAccounts = loadAccounts();
        const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
        if (index !== -1) {
          currentAccounts[index].settings = bot.settings;
          saveAccounts(currentAccounts);
        }
      }
    }

    // Normalize payload & map to 100% In-Game Actions
    if (action === 'gun_use' || action === 'switch_gun') {
      url = 'https://ragnalok.online/human/xhrpg_upgrade.php';
      payload.action = 'gun_use';
      payload.gun_type = payload.gun_type;
    } else if (action === 'auto_refill' || action === 'toggle_auto_refill') {
      url = 'https://ragnalok.online/human/xhrpg_upgrade.php';
      payload.action = 'auto_refill';
      payload.gun_type = payload.gun_type;
    } else if (action === 'set_ammo_tier_enabled') {
      url = 'https://ragnalok.online/human/xhrpg_upgrade.php';
      payload.action = 'set_ammo_tier_enabled';
      payload.gun = (payload.gun === 'sniper' || payload.gun === 'turret' || payload.gun === 'robot') ? payload.gun : 'pistol';
      payload.tier = Number(payload.tier || 1);
      payload.on = payload.on ? 1 : 0;
    } else if (action === 'module_discard_multi') {
      payload.action = 'module_discard_multi';
      payload.weapon = (payload.weapon === 'sniper'||payload.weapon === 'knife'||payload.weapon === 'axe'||payload.weapon === 'robot'||payload.weapon === 'robot_gun'||payload.weapon === 'railgun'||payload.weapon === 'armor'||payload.weapon === 'house'||payload.weapon === 'turret') ? payload.weapon : 'pistol';
      let selArr = payload.indices || payload.sel || [];
      if (typeof selArr === 'string') {
        try { selArr = JSON.parse(selArr); } catch(e) { selArr = []; }
      }
      payload.sel = selArr;
    } else if (action === 'card_socket' || action === 'module_card_in') {
      payload.action = 'card_socket';
      payload.weapon = (payload.weapon === 'sniper'||payload.weapon === 'knife'||payload.weapon === 'axe'||payload.weapon === 'robot'||payload.weapon === 'robot_gun'||payload.weapon === 'railgun'||payload.weapon === 'armor'||payload.weapon === 'house'||payload.weapon === 'turret') ? payload.weapon : 'pistol';
      payload.slot = payload.slot;
      payload.mid = Number(payload.mid || payload.card_id || payload.cardId);
      payload.mvp = (payload.mvp !== undefined ? payload.mvp : (payload.is_mvp ? 1 : 0)) ? 1 : 0;
    } else if (action === 'card_unsocket' || action === 'module_card_out') {
      payload.action = 'card_unsocket';
      payload.weapon = (payload.weapon === 'sniper'||payload.weapon === 'knife'||payload.weapon === 'axe'||payload.weapon === 'robot'||payload.weapon === 'robot_gun'||payload.weapon === 'railgun'||payload.weapon === 'armor'||payload.weapon === 'house'||payload.weapon === 'turret') ? payload.weapon : 'pistol';
      payload.slot = payload.slot;
      payload.sidx = Number(payload.sidx !== undefined ? payload.sidx : (payload.socket_idx !== undefined ? payload.socket_idx : (payload.socket || 0)));
      payload.pay = payload.pay || payload.pay_type || 'gold';
    } else if (action === 'module_enhance' || action === 'module_plus') {
      payload.action = 'module_enhance';
      payload.weapon = (payload.weapon === 'sniper'||payload.weapon === 'knife'||payload.weapon === 'axe'||payload.weapon === 'robot'||payload.weapon === 'robot_gun'||payload.weapon === 'railgun'||payload.weapon === 'armor'||payload.weapon === 'house'||payload.weapon === 'turret') ? payload.weapon : 'pistol';
      payload.slot = payload.slot;
    } else if (action === 'module_equip') {
      payload.action = 'module_equip';
      payload.weapon = (payload.weapon === 'sniper'||payload.weapon === 'knife'||payload.weapon === 'axe'||payload.weapon === 'robot'||payload.weapon === 'robot_gun'||payload.weapon === 'railgun'||payload.weapon === 'armor'||payload.weapon === 'house'||payload.weapon === 'turret') ? payload.weapon : 'pistol';
      payload.slot = payload.slot;
      payload.idx = payload.idx !== undefined ? Number(payload.idx) : Number(payload.mod_id || 0);
    } else if (action === 'module_unequip') {
      payload.action = 'module_unequip';
      payload.weapon = (payload.weapon === 'sniper'||payload.weapon === 'knife'||payload.weapon === 'axe'||payload.weapon === 'robot'||payload.weapon === 'robot_gun'||payload.weapon === 'railgun'||payload.weapon === 'armor'||payload.weapon === 'house'||payload.weapon === 'turret') ? payload.weapon : 'pistol';
      payload.slot = payload.slot;
    }

    const response = await bot.sendRequest(url, payload);
    
    // Fix: Đối với gwar_join và cwar_join, server game không trả về đối tượng player, mà chỉ trả về {ok: true, map: 4, x, y}
    if (response && response.ok && (action === 'gwar_join' || action === 'cwar_join')) {
      bot.enterEventMode(action === 'gwar_join' ? 'gw' : 'cw', 4);
      if (bot.player) {
        bot.player.map = 4;
        if (response.x !== undefined) bot.player.x = response.x;
        if (response.y !== undefined) bot.player.y = response.y;
      }
    }

    if (response && response.player) {
      bot.updatePlayerState(response.player);
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
    } else if (response && (response.ok || !response.error) && bot.player) {
      // Optimistic state updates for module & card actions when server returns ok without full player
      const p = bot.player;
      const modKeyMap = {
        pistol: 'pistol_modules', sniper: 'sniper_modules', knife: 'knife_modules',
        axe: 'axe_modules', turret: 'turret_modules', armor: 'armor_modules',
        robot: 'robot_modules', house: 'house_modules'
      };

      if (action === 'card_socket' || action === 'module_card_in') {
        const cardId = Number(payload.mid || payload.card_id);
        const socketIdx = parseInt(payload.sidx !== undefined ? payload.sidx : (payload.socket_idx || 0)) || 0;
        const isMvp = Boolean(payload.mvp || payload.is_mvp);
        const wpnModKey = modKeyMap[payload.weapon];

        if (wpnModKey && p[wpnModKey] && payload.slot) {
          let mods = typeof p[wpnModKey] === 'string' ? JSON.parse(p[wpnModKey] || '{}') : p[wpnModKey];
          if (mods && mods[payload.slot]) {
            if (!Array.isArray(mods[payload.slot].cards)) mods[payload.slot].cards = [];
            mods[payload.slot].cards[socketIdx] = { mid: cardId, id: cardId, mvp: isMvp ? 1 : 0 };
            p[wpnModKey] = mods;
          }
        }
        // Deduct from card inventory
        if (p.cards) {
          let cardsObj = typeof p.cards === 'string' ? JSON.parse(p.cards || '{}') : p.cards;
          if (cardsObj && cardsObj[cardId]) {
            if (isMvp) cardsObj[cardId].m = Math.max(0, (cardsObj[cardId].m | 0) - 1);
            else cardsObj[cardId].n = Math.max(0, (cardsObj[cardId].n | 0) - 1);
            p.cards = cardsObj;
          }
        }
        bot.addLog('ACTION', `🎴 Đã khảm thẻ [${cardId}] vào Lỗ #${socketIdx + 1}`);
      } else if (action === 'card_unsocket' || action === 'module_card_out') {
        const socketIdx = parseInt(payload.sidx !== undefined ? payload.sidx : (payload.socket_idx || 0)) || 0;
        const wpnModKey = modKeyMap[payload.weapon];
        let unslotted = null;

        if (wpnModKey && p[wpnModKey] && payload.slot) {
          let mods = typeof p[wpnModKey] === 'string' ? JSON.parse(p[wpnModKey] || '{}') : p[wpnModKey];
          if (mods && mods[payload.slot] && Array.isArray(mods[payload.slot].cards)) {
            unslotted = mods[payload.slot].cards[socketIdx];
            mods[payload.slot].cards.splice(socketIdx, 1);
            p[wpnModKey] = mods;
          }
        }

        if (unslotted) {
          const uMid = unslotted.mid || unslotted.id || unslotted;
          let cardsObj = typeof p.cards === 'string' ? JSON.parse(p.cards || '{}') : p.cards || {};
          if (!cardsObj[uMid]) cardsObj[uMid] = { n: 0, m: 0 };
          if (unslotted.mvp) cardsObj[uMid].m = (cardsObj[uMid].m | 0) + 1;
          else cardsObj[uMid].n = (cardsObj[uMid].n | 0) + 1;
          p.cards = cardsObj;
        }
        bot.addLog('ACTION', `↩️ Đã gỡ thẻ khỏi Lỗ #${socketIdx + 1} hoàn trả về kho`);
      } else if (action === 'gun_use' || action === 'switch_gun') {
        p.active_gun = payload.gun_type;
        bot.addLog('ACTION', `🔄 Đã chuyển sang vũ khí ${payload.gun_type === 1 ? 'Dao Dài (Sniper)' : 'Dao Găm (Pistol)'}`);
      } else if (action === 'auto_refill' || action === 'toggle_auto_refill') {
        if (payload.gun_type === 1) {
          p.auto_refill_sniper = !p.auto_refill_sniper;
        } else {
          p.auto_refill_pistol = !p.auto_refill_pistol;
        }
        bot.addLog('ACTION', `🎒 Đã chuyển trạng thái Tự nạp đạn`);
      } else if (action === 'set_ammo_tier_enabled') {
        const t = Number(payload.tier || 1);
        const on = Boolean(payload.on);
        const g = payload.gun;
        if (g === 'turret') {
          let mask = (p.turret_tier_enabled != null && p.turret_tier_enabled !== '') ? (parseInt(p.turret_tier_enabled) || 0) : ((parseInt(p.sniper_tier_enabled) || 1) | 1);
          if (on) mask |= (1 << (t - 1)); else mask &= ~(1 << (t - 1));
          p.turret_tier_enabled = mask;
          bot.addLog('ACTION', `🗼 Đã ${on ? 'bật' : 'tắt'} Đạn Pháo Tier ${t}`);
        } else if (g === 'sniper') {
          let mask = parseInt(p.sniper_tier_enabled ?? p.ammo_sniper_tiers ?? 1) || 1;
          if (on) mask |= (1 << (t - 1)); else mask &= ~(1 << (t - 1));
          p.sniper_tier_enabled = mask;
          p.ammo_sniper_tiers = mask;
          bot.addLog('ACTION', `🎯 Đã ${on ? 'bật' : 'tắt'} Đạn Dao Dài Tier ${t}`);
        } else {
          let mask = parseInt(p.pistol_tier_enabled ?? p.ammo_pistol_tiers ?? 1) || 1;
          if (on) mask |= (1 << (t - 1)); else mask &= ~(1 << (t - 1));
          p.pistol_tier_enabled = mask;
          p.ammo_pistol_tiers = mask;
          bot.addLog('ACTION', `🔪 Đã ${on ? 'bật' : 'tắt'} Đạn Dao Găm Tier ${t}`);
        }
      }
    }
    
    if (response.msg) {
      bot.addLog('ACTION', response.msg);
    } else if (response.error) {
      bot.addLog('ERROR', `Thao tác thất bại: ${response.error}`);
    }

    res.json(response || { ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy helper function
async function proxyRequest(req, res, targetUrl, uid = null) {
  const headers = {
    'content-type': req.headers['content-type'] || 'application/x-www-form-urlencoded; charset=UTF-8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'accept': '*/*',
    'origin': 'https://ragnalok.online',
    'referer': 'https://ragnalok.online/human/',
    'connection': 'keep-alive'
  };

  const proxyId = uid ? proxyPool._assignments[uid] : null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    let body = null;
    if (req.method === 'POST') {
      body = new URLSearchParams(req.body).toString();
    }

    // Use specific bot's dispatcher if uid is provided, to ensure matching outbound IP addresses
    const dispatcher = uid ? proxyPool.getDispatcher(uid) : proxyPool.getDefaultDispatcher();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      dispatcher: dispatcher,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (proxyId && proxyId !== 'direct') {
      proxyPool.resetErrorCount(proxyId);
    }

    res.status(response.status);
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json');

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('image') || contentType.includes('audio') || contentType.includes('font') || contentType.includes('octet-stream')) {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      const text = await response.text();
      
      // Update bot state if response is valid JSON from a game API call
      if (uid && botInstances[uid]) {
        try {
          const json = JSON.parse(text);
          if (json && json.ok) {
            const bot = botInstances[uid];
            if (json.player) {
              bot.updatePlayerState(json.player);
              bot.lastUpdate = Date.now();
            }
            if (json.spots) {
              bot.spots = json.spots;
            }
            if (json.bosses) {
              bot.bosses = json.bosses;
            }
            if (json.inv !== undefined) {
              bot.lastInv = json.inv;
            }
            if (json.gw !== undefined) {
              bot.lastGw = json.gw;
            }
            if (json.cw !== undefined) {
              bot.lastCw = json.cw;
            }

            // If player is on Map 4 and GW/CW is active, ensure bot inEventMode is true
            const playerMap = json.player ? Number(json.player.map) : (bot.player ? Number(bot.player.map) : 0);
            const currentEpoch = Math.floor(Date.now() / 1000);
            const lastGw = json.gw !== undefined ? json.gw : bot.lastGw;
            const lastCw = json.cw !== undefined ? json.cw : bot.lastCw;
            const isGwActive = lastGw && (lastGw.st === 'open' || lastGw.st === 'fight') && (!lastGw.ends || lastGw.ends > currentEpoch);
            const isCwActive = lastCw && (lastCw.st === 'open' || lastCw.st === 'fight') && (!lastCw.ends || lastCw.ends > currentEpoch);

            if (playerMap === 4 && (isGwActive || isCwActive)) {
              if (!bot.inEventMode) {
                bot.enterEventMode(isGwActive ? 'gw' : 'cw', 4);
              }
            }

            // Intercept war log feed from proxy responses (e.g. manual play requests to xhrpg_cwar.php)
            if (json.feed && Array.isArray(json.feed)) {
              const feedKind = req.body.kind || req.query.kind || bot.currentEventKind || 'gw';
              if (!bot.eventWarHistory) bot.eventWarHistory = [];
              const existingKeys = new Set(bot.eventWarHistory.map(h => `${h.time}_${h.killer}_${h.victim}`));
              
              json.feed.forEach(r => {
                const timeMs = (r.t | 0) * 1000;
                const key = `${timeMs}_${r.k}_${r.v}`;
                if (!existingKeys.has(key)) {
                  bot.eventWarHistory.unshift({
                    time: timeMs,
                    eventKind: feedKind,
                    killer: r.k,
                    killerTag: r.kt || null,
                    victim: r.v,
                    victimTag: r.vt || null,
                    points: r.p | 0
                  });
                }
              });
              
              if (bot.eventWarHistory.length > 150) {
                bot.eventWarHistory = bot.eventWarHistory.slice(0, 150);
              }
            }
          }
        } catch (e) {
          // Ignore parse errors for HTML, JS, or non-JSON resources
        }
      }
      
      res.send(text);
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error(`Proxy error for ${targetUrl}:`, err);
    if (proxyId && proxyId !== 'direct') {
      proxyPool.recordProxyFailure(proxyId);
    }
    res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
}

async function fetchGameHtml(req, uid = null) {
  const now = Date.now();
  const targetUrl = `https://ragnalok.online/human/index.php?_cb=${now}`;
  
  const dispatcher = uid ? proxyPool.getDispatcher(uid) : proxyPool.getDefaultDispatcher();

  const response = await fetch(targetUrl, {
    dispatcher: dispatcher,
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

  // 4.5. Phục dựng các tab bảng xếp hạng (Người chơi & Gold) bị ẩn
  // Gỡ comment của nút tab 'lv' (Người chơi)
  html = html.replace(
    /<!--\s*<button class="rank-tab"\s+data-tab="lv"[\s\S]*?<\/button>\s*-->/,
    `<button class="rank-tab active" data-tab="lv" onclick="xhrpg.rankTab('lv')"><span class="rt-ico">🏆</span><span class="rt-txt">ผู้เล่น</span></button>`
  );
  // Thay đổi nút 'mvp' từ active thành thường
  html = html.replace(
    /<button class="rank-tab active"\s+data-tab="mvp"[\s\S]*?<\/button>/,
    `<button class="rank-tab" data-tab="mvp" onclick="xhrpg.rankTab('mvp')"><span class="rt-ico">⭐</span><span class="rt-txt">MVP</span></button>`
  );
  // Gỡ comment của nút tab 'gold' (Gold)
  html = html.replace(
    /<!--\s*<button class="rank-tab"\s+data-tab="gold"[\s\S]*?<\/button>\s*-->/,
    `<button class="rank-tab" data-tab="gold" onclick="xhrpg.rankTab('gold')"><span class="rt-ico">💰</span><span class="rt-txt">Gold</span></button>`
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
    let data;
    try {
      if (typeof res === 'string') {
        if (res.trim().startsWith('<')) {
          throw new Error('Máy chủ game trả về HTML (có thể bị chặn bởi Cloudflare hoặc hết hạn phiên)');
        }
        data = JSON.parse(res);
      } else {
        data = res;
      }
    } catch (parseErr) {
      console.error('Lỗi giải mã phản hồi game:', parseErr);
      document.getElementById('loading-msg').textContent = 'Đăng nhập thất bại: ' + parseErr.message;
      return;
    }

    if (data && data.ok) {
      startGame(data.player, token, data.offline_reward);
    } else {
      const errMsg = data ? (data.error || data.msg || data.info || JSON.stringify(data)) : 'Lỗi không xác định';
      document.getElementById('loading-msg').textContent = 'Đăng nhập thất bại: ' + errMsg;
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
    const html = await fetchGameHtml(req, uid);
    res.send(html);
  } catch (e) {
    console.error('Fetch HTML error, serving patched play.html fallback:', e.message);
    let fallback = fs.readFileSync(path.join(__dirname, 'play.html'), 'utf8');
    const now = Date.now();
    
    // Vá lỗi DOM và áp dụng tất cả các thay thế giống fetchGameHtml
    fallback = fallback.replace('id="log-list"', 'id="event-log"');
    fallback = fallback.replace('</body>', '<div id="login-overlay" style="display:none"></div>\n</body>');
    fallback = fallback.replace(/src="js\/xhrpg_canvas\.js[^"]*"/, `src="/js/xhrpg_canvas.js?v=${now}"`);
    fallback = fallback.replace(
      /(<script src="\/js\/xhrpg_canvas\.js\?v=\d+"><\/script>)/,
      `$1\n<script src="/js/xhrpg_lang_vi.js?v=${now}"></script>`
    );
    
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
    let data;
    try {
      if (typeof res === 'string') {
        if (res.trim().startsWith('<')) {
          throw new Error('Máy chủ game trả về HTML (có thể bị chặn bởi Cloudflare hoặc hết hạn phiên)');
        }
        data = JSON.parse(res);
      } else {
        data = res;
      }
    } catch (parseErr) {
      console.error('Lỗi giải mã phản hồi game:', parseErr);
      document.getElementById('loading-msg').textContent = 'Đăng nhập thất bại: ' + parseErr.message;
      return;
    }

    if (data && data.ok) {
      startGame(data.player, token, data.offline_reward);
    } else {
      const errMsg = data ? (data.error || data.msg || data.info || JSON.stringify(data)) : 'Lỗi không xác định';
      document.getElementById('loading-msg').textContent = 'Đăng nhập thất bại: ' + errMsg;
    }
  })
  .fail(() => {
    document.getElementById('loading-msg').textContent = 'Không thể kết nối tới máy chủ Proxy';
  });
} else {
  document.getElementById('loading-msg').textContent = 'Lỗi: Thiếu tham số line_uid hoặc session_token trên link';
}
</script>`;

    fallback = fallback.replace(/<script>[\s\S]*?LIFF_ID[\s\S]*?<\/script>/, customScript);
    res.send(fallback);
  }
});

app.get('/battle', requireAuth, async (req, res) => {
  const uid = req.query.line_uid;
  if (uid && botInstances[uid]) {
    if (req.user.role !== 'admin' && botInstances[uid].userId !== req.user.id) {
      return res.status(403).send('<h2 style="color:#ef4444; font-family:sans-serif; text-align:center; margin-top:50px;">⚠️ Bạn không có quyền truy cập tài khoản game này!</h2>');
    }
  }
  try {
    let html = fs.readFileSync(path.join(__dirname, 'play_battle.html'), 'utf8');
    const now = Date.now();
    
    // Áp dụng các thay thế và cache-buster
    html = html.replace(/src="\/js\/xhrpg_canvas\.js[^"]*"/, `src="/js/xhrpg_canvas.js?v=${now}"`);
    html = html.replace(/src="\/js\/xhrpg_lang_vi\.js[^"]*"/, `src="/js/xhrpg_lang_vi.js?v=${now}"`);
    
    res.send(html);
  } catch (e) {
    console.error('Serve battle html error:', e.message);
    res.status(500).send('<h2 style="color:#ef4444; font-family:sans-serif; text-align:center; margin-top:50px;">⚠️ Không thể tải giao diện trận đấu!</h2>');
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
  
  // Inject bypass into main game engine file and auto-save fallback copy to disk
  if (urlPath === '/js/xhrpg_canvas.js') {
    const patchTarget = `if (_pollStopped || _inflight) return;`;
    const bypassCode = `if (_pollStopped || _inflight) return;\n    _lastInputAt = Date.now(); // Bypass idle timeout\n    _tabHiddenAt = 0; // Bypass hidden tab timeout`;
    
    if (text.includes(patchTarget)) {
      text = text.replace(patchTarget, bypassCode);
    }

    const patchChShow = `function _chShow() {`;
    const bypassChShow = `function _chShow() { try { _chPass(); } catch(e){} return;`;
    if (text.includes(patchChShow)) {
      text = text.replace(patchChShow, bypassChShow);
    }
    
    try {
      const canvasPath = path.join(__dirname, 'xhrpg_canvas.js');
      fs.writeFileSync(canvasPath, text, 'utf8');
      console.log('💾 Auto-saved latest patched xhrpg_canvas.js to disk');
    } catch(err) {
      console.error('Failed to auto-save canvas to disk:', err.message);
    }
  }
  
  // Auto-save sdk.js to local disk fallback
  if (urlPath === '/js/sdk.js') {
    try {
      const sdkPath = path.join(__dirname, 'sdk.js');
      fs.writeFileSync(sdkPath, text, 'utf8');
      console.log('💾 Auto-saved latest sdk.js to disk');
    } catch(err) {
      console.error('Failed to auto-save sdk to disk:', err.message);
    }
  }
  
  assetCache[urlPath] = { time: now, data: text };
  return text;
}

app.get(['/js/xhrpg_canvas.js', '/human/js/xhrpg_canvas.js'], async (req, res) => {
  try {
    let data = await fetchGameAsset('/js/xhrpg_canvas.js');
    // Phục dựng rankCurrentTab mặc định thành 'lv' thay vì 'mvp'
    data = data.replace("let rankCurrentTab = 'mvp';", "let rankCurrentTab = 'lv';");
    res.set({
      'Cache-Control': 'public, max-age=1800',
      'Content-Type': 'application/javascript; charset=utf-8'
    });
    res.send(data);
  } catch (e) {
    console.error('Fetch canvas error:', e.message);
    let fallback = fs.readFileSync(path.join(__dirname, 'xhrpg_canvas.js'), 'utf8');
    fallback = fallback.replace("let rankCurrentTab = 'mvp';", "let rankCurrentTab = 'lv';");
    res.set({
      'Cache-Control': 'public, max-age=1800',
      'Content-Type': 'application/javascript; charset=utf-8'
    });
    res.send(fallback);
  }
});

app.get(['/js/xhrpg_lang_vi.js', '/human/js/xhrpg_lang_vi.js'], (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=1800',
    'Content-Type': 'application/javascript; charset=utf-8'
  });
  res.sendFile(path.join(__dirname, 'xhrpg_lang_vi.js'));
});

app.get(['/js/jquery-3.6.0.min.js', '/human/js/jquery-3.6.0.min.js'], (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=31536000',
    'ETag': 'jquery-3.6.0-v1'
  });
  res.sendFile(path.join(__dirname, 'jquery-3.6.0.min.js'));
});

app.get(['/js/sdk.js', '/human/js/sdk.js'], async (req, res) => {
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
app.all(['/xhrpg_*.php', '/human/xhrpg_*.php'], async (req, res) => {
  let cleanPath = req.originalUrl;
  if (cleanPath.startsWith('/human/')) {
    cleanPath = cleanPath.slice(6);
  }
  const targetUrl = `https://ragnalok.online/human${cleanPath}`;
  
  // Track client activity to pause bot loop
  const uid = req.body.line_uid || req.query.line_uid;
  if (uid && botInstances[uid]) {
    botInstances[uid].lastClientActive = Date.now();
  }
  
  const startTime = Date.now();
  console.log(`[Proxy Req Start] ${req.method} ${req.originalUrl} | uid: ${uid || 'N/A'}`);
  try {
    await proxyRequest(req, res, targetUrl, uid);
    console.log(`[Proxy Req Success] ${req.method} ${req.originalUrl} | Time: ${Date.now() - startTime}ms`);
  } catch (err) {
    console.log(`[Proxy Req Error] ${req.method} ${req.originalUrl} | Error: ${err.message} | Time: ${Date.now() - startTime}ms`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Lỗi máy chủ trung gian (Proxy failed)', details: err.message });
    }
  }
});

// Proxy Cloudflare Turnstile & Challenge platform endpoints
app.all('/cdn-cgi/*', async (req, res) => {
  const targetUrl = `https://ragnalok.online${req.originalUrl}`;
  const startTime = Date.now();
  console.log(`[Proxy Cloudflare Start] ${req.method} ${req.originalUrl}`);
  try {
    await proxyRequest(req, res, targetUrl);
    console.log(`[Proxy Cloudflare Success] ${req.method} ${req.originalUrl} | Time: ${Date.now() - startTime}ms`);
  } catch (err) {
    console.log(`[Proxy Cloudflare Error] ${req.method} ${req.originalUrl} | Error: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Proxy cdn-cgi failed', details: err.message });
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
    
    // Auto-sync game assets at startup in background
    syncMapsAndZonesFromGame().catch(err => {
      console.error('❌ Startup Map/Zone synchronization failed:', err.message);
    });
  });

  // Setup periodic Telegram backup (Check every 5 minutes if it's time to backup)
  setInterval(async () => {
    try {
      const settings = proxyPool.getSettings();
      if (settings.autoBackupEnabled && settings.telegramBotToken && settings.telegramChatId) {
        const lastBackup = settings.lastBackupTime || 0;
        const intervalMs = (settings.backupIntervalHours || 12) * 60 * 60 * 1000;
        if (Date.now() - lastBackup >= intervalMs) {
          console.log('[Auto-Backup] Tracing auto-backup payload to Telegram...');
          await performTelegramBackup();
          console.log('[Auto-Backup] Backup successfully sent to Telegram!');
        }
      }
    } catch (e) {
      console.error('[Auto-Backup] Error running auto-backup interval:', e.message);
    }
  }, 5 * 60 * 1000);

  // Setup periodic Zombie Bot Watchdog scanner (Quét mỗi 60s để cứu bot bị treo im lặng)
  setInterval(() => {
    try {
      checkAndRecoverZombieBots();
    } catch (e) {
      console.error('[Watchdog Scanner Error]:', e.message);
    }
  }, 60 * 1000);
}

module.exports = {
  tierGold,
  tierRes,
  _upgCostMult,
  getArmorUpgradeCost,
  getCatUpgradeCost,
  getDroneUpgradeCost,
  getMineUpgradeCost,
  getItemCategory,
  getModuleTier,
  formatMarketListing,
  BotInstance,
  ProxyPool,
  proxyPool,
  botInstances,
  getAccountFingerprint,
  naturalCoordNoise,
  logNormalActInterval,
  BROWSER_PROFILES,
  ACCEPT_LANG_POOL,
  checkAndRecoverZombieBots
};
