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
      connect: { timeout: 10000 },
      keepAliveTimeout: 30000,
      keepAliveMaxTimeout: 60000,
      pipelining: 1,
      connections: 50,
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
  
  // 3. Additional common replacements for combat logs if still containing Thai
  const commonReplacements = [
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
    { raw: 'เพิ่มเป็น', val: 'tăng thành' }
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

// Background poller manager
class BotInstance {
  constructor(account) {
    this.line_uid = account.line_uid;
    this.session_token = account.session_token;
    this.name = account.name;
    this.userId = account.userId || 'usr_admin';
    this.settings = account.settings || this.getDefaultSettings();
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
    this.firstErrorAt = null; // Mốc thời gian bắt đầu lỗi liên tục
    this.isMvpCycling = false;
    this.mvpCycleMapIndex = 0;
    this.mvpCycleMapStayCount = 0;
    this.mvpConfirmClearCount = 0; // Số polls liên tiếp xác nhận map đã sạch boss
    this.mvpCycleOriginalMap = null;
    this.mvpCycleOriginalAutoMap = null;
    this.lastMvpCycleCheckHour = -1;
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
    // 😴 Anti-idle & Event-Driven Act-Flag Jitter Engine
    // Mô phỏng hành vi người dùng thật: act=1 khi có tương tác (Event) hoặc nhịp Jitter 120s-300s
    this.lastActSentAt = 0;
    this.nextActInterval = 120000 + Math.random() * 180000; // jitter ngẫu nhiên 120s-300s
    this.pendingActFlag = false;
    this.consecutiveErrors = 0;
    this.failedSeeds = {}; // Danh sách hạt giống bị lỗi gieo trồng
    this.lastHarvestFailedAt = 0;
    this.lastHomeUpgradeFailedAt = 0;
    this.addLog('SYSTEM', `Khởi tạo bot cho tài khoản: ${this.name}`);
  }

  triggerActFlag() {
    this.pendingActFlag = true;
  }

  updatePlayerState(newPlayer) {
    if (!newPlayer) return;
    if (!this.player) {
      this.player = newPlayer;
      return;
    }
    const COLD_FIELDS = [
      'module_inventory','sniper_module_inventory','knife_module_inventory','axe_module_inventory',
      'robot_module_inventory','robot_gun_module_inventory','railgun_module_inventory',
      'armor_module_inventory','house_module_inventory','turret_module_inventory',
      'cards','eggs','treasures','treasures_qty','hardware','hardware_qty','weapon_parts','weapon_parts_qty',
      'house_parts','house_parts_qty','stat_parts','stat_parts_qty',
      'home_crops','home_seeds','home_lv','home_guards','home_return',
      'pet_mid','pet_exp','pet_mvp','pet_olv','pet_up_atk','pet_up_hp','pet_up_reco','pet_batk','pet_bhp',
      'pvp_today','pvp_won','pvp_lost','pvp_pts'
    ];
    for (const f of COLD_FIELDS) {
      if (newPlayer[f] === undefined && this.player[f] !== undefined) {
        newPlayer[f] = this.player[f];
      }
    }
    this.player = newPlayer;
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
      teamRole: 'none'
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
    if (this.logs.length > 200) {
      this.logs.shift();
    }
  }

  addLootLog(msg) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    this.lootLogs.push({
      time: timestamp,
      msg: translateThaiText(msg)
    });
    if (this.lootLogs.length > 200) {
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
    if (this.mvpHuntLog.length > 100) {
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
    
    this.combatStatsHistory.forEach(h => {
      totalKills += (h.kills || 0);
      totalGold += (h.gold || 0);
      totalExp += (h.exp || 0);
    });
    
    // Window start time is either when bot started running or 5 mins ago (cutoff)
    const startOfMeasurement = this.startTime ? Math.max(this.startTime, cutoff) : cutoff;
    const diffMs = now - startOfMeasurement;
    const elapsedMin = Math.max(0.1, diffMs / 60000); // min 6 seconds
    
    return {
      killsPerMin: Math.round((totalKills / elapsedMin) * 10) / 10,
      goldPerMin: Math.round(totalGold / elapsedMin),
      expPerMin: Math.round(totalExp / elapsedMin)
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
      try {
        await this.pollGame();
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
        this.addLog('ERROR', `${formattedErr} (Lỗi liên tục ${elapsedSec}s/180s)`);

        if (elapsedTime >= 180000) { // 3 minutes
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
            this.addLog('SYSTEM', `🔄 Proxy cũ gặp sự cố liên tiếp 3 phút. Đã tự động đổi sang cấu hình IP mới: ${newProxyInfo.label}`);

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
      } finally {
        this.isPolling = false;
        // Schedule next poll staggering
        if (this.status === 'running') {
          const isSnipe = this.targetedMvp && this._bossSnipeActive;
          this.timer = setTimeout(runPoll, isSnipe ? 1000 : 2000);
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
    // T46: Mọi request hành động (nâng stats/gear/skill, warp, arena...) đều đánh dấu tương tác người dùng
    if (!url.includes('xhrpg_game.php')) {
      this.pendingActFlag = true;
    }

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
      if (err.cause) {
        if (err.cause.code === 'ENOTFOUND') {
          const host = err.cause.hostname || 'ragnalok.online';
          throw new Error(`Lỗi DNS (ENOTFOUND): Không tìm thấy địa chỉ máy chủ ${host}`);
        }
        if (err.cause.code === 'ECONNREFUSED') {
          throw new Error(`Lỗi kết nối (ECONNREFUSED): Máy chủ từ chối kết nối`);
        }
        if (err.cause.code === 'ETIMEDOUT' || err.cause.code === 'UND_ERR_CONNECT_TIMEOUT') {
          throw new Error(`Lỗi kết nối Timeout (${err.cause.code})`);
        }
        if (err.cause.code === 'ECONNRESET') {
          throw new Error(`Lỗi kết nối bị ngắt đột ngột (ECONNRESET)`);
        }
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
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

    // Ghi nhớ bản đồ farm gốc (Ưu tiên player.map hiện tại nếu không ở Nông trại, fallback theo settings.targetMap hoặc 1)
    const currentMapNum = this.player ? Number(this.player.map) : null;
    const configuredTargetMap = parseInt(this.settings.targetMap);
    const farmMap = (currentMapNum && currentMapNum !== 5) ? currentMapNum : (configuredTargetMap || 1);
    
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
    const aliveTargetBosses = this.bosses ? this.bosses.filter(b => (b.hp || 0) > 0) : [];
    
    // Cập nhật bộ đếm xác nhận map sạch boss
    if (this.bosses === null) {
      // Chưa tải xong danh sách boss từ server -> Chưa xác nhận
      this.mvpConfirmClearCount = 0;
    } else if (aliveTargetBosses.length === 0) {
      this.mvpConfirmClearCount++;
    } else {
      this.mvpConfirmClearCount = 0;
    }

    const isDoneWithCurrentMap = (
      (this.mvpConfirmClearCount >= 1) || // Tối ưu: Chuyển map NGAY (1 poll ~1-2s) khi bosses = [] hoặc sạch boss
      (this.mvpCycleMapStayCount >= 40)   // Timeout sau ~80s
    );
    
    if (isDoneWithCurrentMap) {
      const isTimeout = this.mvpCycleMapStayCount >= 40;
      const killedCount = this.mvpCycleStats ? (this.mvpCycleStats.bossKilledInMap || 0) : 0;
      let reason = 'Không có Boss mục tiêu';
      if (isTimeout) {
        reason = 'Hết thời gian chờ (Timeout)';
      } else if (killedCount > 0) {
        reason = `Đã dọn sạch Boss (Đã diệt ${killedCount} Boss)`;
      }
      const timeSpentMs = Date.now() - (this.mvpCycleStats ? (this.mvpCycleStats.mapStartTs || Date.now()) : Date.now());
      
      if (isTimeout) {
        this.addMvpLog('map_timeout', { mapId: currentMap, timeSpentMs });
      } else {
        this.addMvpLog('map_clear', {
          mapId: currentMap,
          bossKilledCount: this.mvpCycleStats ? (this.mvpCycleStats.bossKilledInMap || 0) : 0,
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

    // 🗺️ Định tuyến bản đồ khẩn cấp (Map Routing) ngay đầu nhịp poll
    if (this.player) {
      const isMvpReturning = (!this.isMvpCycling && this.mvpCycleOriginalMap !== null);
      const activeTargetMapId = this.isMvpCycling 
        ? this.getCurrentMvpCycleMap() 
        : (isMvpReturning ? Number(this.mvpCycleOriginalMap) : (parseInt(this.settings.targetMap) || 1));

      if ((this.settings.autoMap || this.isMvpCycling || isMvpReturning) && Number(this.player.map) !== Number(activeTargetMapId)) {
        const targetMapId = activeTargetMapId;
        const mapDef = getMapDefs().find(m => m.id === targetMapId);
        if (mapDef && (this.player.lv || 1) >= mapDef.req) {
          this.addLog('SYSTEM', `🗺️ [Tự động] Phát hiện sai bản đồ (Đang ở: Map ${this.player.map}, Cần đi: Map ${targetMapId}). Tiến hành di chuyển...`);
          try {
            await this.warpToMap(targetMapId);
            // Warp thành công, kết thúc sớm nhịp poll hiện tại để nhịp tiếp theo chạy trên map mới
            return;
          } catch (e) {
            this.addLog('ERROR', `Lỗi di chuyển bản đồ khẩn cấp: ${e.message}`);
          }
        }
      }
    }

    // 👥 Nếu là Member, tự động đồng bộ Map và Trạng thái chu kỳ săn từ Leader
    if (this.player && this.settings.teamRole === 'member') {
      const leader = Object.values(botInstances).find(b => b.userId === this.userId && b.settings.teamRole === 'leader');
      if (leader && leader.player && leader.settings.bossHuntMode !== 'off') {
        const leaderMap = Number(leader.player.map);
        // Đồng bộ trạng thái Cycle từ Leader
        this.isMvpCycling = leader.isMvpCycling;
        this.mvpCycleMapIndex = leader.mvpCycleMapIndex;
        this.mvpCycleOriginalMap = leader.mvpCycleOriginalMap;
        
        // Nếu khác bản đồ với Leader, ép warp theo Leader ngay lập tức
        if (Number(this.player.map) !== leaderMap) {
          const mapDef = getMapDefs().find(m => m.id === leaderMap);
          if (mapDef && (this.player.lv || 1) >= mapDef.req) {
            this.addLog('SYSTEM', `👥 [Team Member] Đồng bộ di chuyển theo Trưởng nhóm (${leader.name}) sang Map ${leaderMap}`);
            try {
              await this.warpToMap(leaderMap);
              return; // Kết thúc sớm poll để chạy trên map mới ở nhịp sau
            } catch (e) {
              this.addLog('ERROR', `Lỗi đồng bộ di chuyển theo Leader: ${e.message}`);
            }
          }
        }
      }
    }

    // ⏰ Check scheduled MVP Boss Hunting Cycle (Round hours only, first 3 minutes of the hour)
    const nowTime = new Date();
    const currentHour = nowTime.getHours();
    const currentMinute = nowTime.getMinutes();
    if (this.settings.bossHuntMode === 'type2' && this.settings.mvpTargetMaps) {
      if (currentMinute <= 2 && this.lastMvpCycleCheckHour !== currentHour) {
        this.lastMvpCycleCheckHour = currentHour;
        this.addLog('SYSTEM', `⏰ [Auto Boss] Đến giờ tròn (${currentHour}:00). Tự động kích hoạt chu kỳ săn Boss xoay vòng map...`);
        this.triggerMvpCycle();
      }
    }

    // Request full payload every 5 polls if boss hunt is active OR every 10 polls if idle
    // OR on every poll while actively hunting a boss or when bosses list is null.
    const isFull = ((this.pollCount % (this.settings.bossHuntMode !== 'off' ? 5 : 10) === 0) || this.targetedMvp || this.bosses === null) ? 1 : 0;

    // 😴 Anti-idle: Tính act flag mô phỏng hành vi người dùng thật
    // - Poll đầu tiên = act=1 (giống user vừa load trang/F5)
    // - Khi có tương tác người dùng / tự động (this.pendingActFlag) = act=1 ở poll tiếp theo, khớp client gốc
    // - Khi AFK đứng yên = act=1 nhịp ngẫu nhiên 120s - 300s (jitter tự nhiên)
    const now = Date.now();
    let actValue = 0;
    if (this.pollCount === 1) {
      actValue = 1;
      this.lastActSentAt = now;
      this.nextActInterval = 120000 + Math.random() * 180000;
      this.pendingActFlag = false;
    } else if (this.pendingActFlag) {
      actValue = 1;
      this.lastActSentAt = now;
      this.nextActInterval = 120000 + Math.random() * 160000;
      this.pendingActFlag = false;
    } else if ((now - this.lastActSentAt) >= this.nextActInterval) {
      actValue = 1;
      this.lastActSentAt = now;
      this.nextActInterval = 120000 + Math.random() * 160000;
    }
    
    let exploreCx = this.player ? (this.settings.explore_cx || this.player.x) : this.settings.explore_cx;
    let exploreCy = this.player ? (this.settings.explore_cy || this.player.y) : this.settings.explore_cy;
    let exploreRadius = this.settings.explore_radius;
    let traveling = 0;
    this.targetedMvp = false;
    let lockPos = this.settings.lock_pos ? 1 : 0;

    // 1. Auto MVP Hunting (Priority 1)
    const isCorrectMvpMap = !this.isMvpCycling || (this.player && Number(this.player.map) === Number(this.getCurrentMvpCycleMap()));
    const isHuntingEnabled = this.settings.bossHuntMode !== 'off';
    
    if (isHuntingEnabled && isCorrectMvpMap && this.bosses && this.bosses.length > 0) {
      const aliveBosses = this.bosses.filter(b => (b.hp || 0) > 0);

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
          const leader = Object.values(botInstances).find(b => b.userId === this.userId && b.settings.teamRole === 'leader');
          if (leader && leader.settings.bossHuntMode !== 'off') {
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

            // Khoảng cách tiếp cận 5m để bù dung sai di chuyển theo yêu cầu của khách hàng
            const approachDist = 5;

            // Kiểm tra trạng thái kích hoạt Snipe Mode (HP <= 30%)
            const bossHpPct = Math.round((activeBoss.hp || 0) / (activeBoss.hp_max || 1) * 100);
            this._bossSnipeActive = (bossHpPct <= 30);

            if (this._bossSnipeActive && !this._snipeLoggedOnce) {
              this._snipeLoggedOnce = true;
              this.addLog('SYSTEM', `⚡ [Snipe Mode] Boss ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} HP xuống ${bossHpPct}% -> Kích hoạt tăng tốc tấn công!`);
            }

            // Luôn đặt tâm tìm mục tiêu vào vị trí Boss để không bị quái rác cướp lượt
            exploreCx = activeBoss.x;
            exploreCy = activeBoss.y;

            const nowMs = Date.now();
            const shouldLogStatus = (nowMs - (this._lastBossStatusLogAt || 0)) >= 5000;

            if (dist > approachDist) {
              exploreRadius = 300;
              traveling = 1;
              lockPos = 0;
              if (shouldLogStatus) {
                this._lastBossStatusLogAt = nowMs;
                this.addLog('SYSTEM', `⚔️ [Auto Boss] Đang di chuyển săn Boss: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (Khoảng cách: ${Math.round(dist)}m, Ngưỡng dừng: ${approachDist}m)`);
              }
            } else {
              exploreRadius = 100;
              traveling = 0;
              lockPos = 1; // Khóa vị trí khi đã vào tầm bắn để dồn toàn bộ DPS
              if (shouldLogStatus) {
                this._lastBossStatusLogAt = nowMs;
                this.addLog('SYSTEM', `⚔️ [Auto Boss] Đang tấn công Boss: ${activeBoss.emoji || '👾'} ${activeBoss.name || 'Boss'} (HP: ${bossHpPct}%)`);
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
    if (!this.targetedMvp && canRunAutoZone && this.settings.autoZone && this.spots) {
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
      act: actValue,  // 😴 Jitter tự nhiên: 1 mỗi 45-90s ngẫu nhiên, không phải mọi poll
      full: isFull,
      bot: this.settings.bot ? 1 : 0,
      lock_pos: lockPos,
      explore_radius: exploreRadius,
      explore_cx: exploreCx,
      explore_cy: exploreCy,
      traveling: traveling,
      auto_potion_threshold: this.settings.auto_potion_threshold,
      have_static: (this.spots && this.mon_masters) ? 1 : 0,
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

    // 😴 T46: Handle server idle response — force act=1 ngay poll tiếp theo để phục hồi
    // Server trả d.idle=true khi last_action_at quá lâu
    if (d.idle) {
      this.lastActSentAt = 0;   // Force act=1 ở poll tiếp theo
      this.nextActInterval = 0; // Interval = 0 → gửi ngay
      this.pendingActFlag = true;
      this.addLog('SYSTEM', '😴 Server phát hiện Idle Signal -> Kích hoạt khôi phục tương tác khẩn cấp (act=1 forced)');
      return;
    }

    if (!d.ok) {
      this.error = d.error || 'Yêu cầu game trả về thất bại';
      this.addLog('ERROR', `Lỗi: ${this.error}`);
      return;
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

    // Save bosses list and track spawn times
    if (d.bosses) {
      this.bosses = d.bosses;
    } else if (isFull) {
      this.bosses = [];
    }

    if (this.bosses) {
      const nowTs = Date.now();
      const aliveBosses = this.bosses.filter(b => (b.hp || 0) > 0);
      
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

    // 👥 Chỉ có Trưởng nhóm (Leader) hoặc bot chạy độc lập mới quản lý tiến độ chu kỳ xoay map
    if (this.isMvpCycling && this.settings.teamRole !== 'member') {
      await this.updateMvpCycleStatus();
    }

    // Detect map change
    if (prevP && prevP.map !== this.player.map) {
      this.spots = null; // Force reload static zone details for the new map
      this.bosses = null; // Clear bosses list to refresh on new map
      
      // Do NOT reset zone settings if transitioning to/from Home map (map 5), if in MVP cycle, or if returning to the original map
      if (prevP.map !== 5 && this.player.map !== 5 && !this.isMvpCycling && this.mvpCycleOriginalMap === null && !wasMvpReturning) {
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

      // Save history
      if (pollKills > 0 || pollGold > 0 || pollExp > 0) {
        this.combatStatsHistory.push({
          time: Date.now(),
          kills: pollKills,
          gold: pollGold,
          exp: pollExp
        });
      }

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

    const isAtHome = (!this.isMvpCycling && Number(this.player.map) === 5 && (this.player.home_crops !== undefined || this.player.home_lv !== undefined));

    // Check if there are pending Home Farm actions
    let hasPendingHomeAction = false;
    const nowMs = Date.now();
    const harvestCooldown = (nowMs - (this.lastHarvestFailedAt || 0)) < 300000;
    const upgradeCooldown = (nowMs - (this.lastHomeUpgradeFailedAt || 0)) < 300000;

    if (!this.targetedMvp && !this.isMvpCycling && (this.settings.autoHomeHarvest || this.settings.autoHomePlant || this.settings.autoHomeUpgrade)) {
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
            this.updatePlayerState(res.player);
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
            this.updatePlayerState(res.player);
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
            this.updatePlayerState(res.player);
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
              this.updatePlayerState(res.player);
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
              this.updatePlayerState(res.player);
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
                this.updatePlayerState(res.player);
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
                this.updatePlayerState(res.player);
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
              this.updatePlayerState(res.player);
              this.addLog('SUCCESS', `Mỏ ô ${s + 1} hoạt động trở lại`);
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
        this.addLog('SYSTEM', `↩️ [Tự động] Đã hoàn tất công việc làm vườn, rời Nông trại để quay lại farm`);
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
      const isMvpReturning = (!this.isMvpCycling && this.mvpCycleOriginalMap !== null);
      const activeTargetMapId = this.isMvpCycling 
        ? this.getCurrentMvpCycleMap() 
        : (isMvpReturning ? Number(this.mvpCycleOriginalMap) : (parseInt(this.settings.targetMap) || 1));

      if ((this.settings.autoMap || this.isMvpCycling || isMvpReturning) && Number(this.player.map) !== Number(activeTargetMapId)) {
        const targetMapId = activeTargetMapId;
        const mapDef = getMapDefs().find(m => m.id === targetMapId);
        if (mapDef && (this.player.lv || 1) >= mapDef.req) {
          this.addLog('SYSTEM', `🗺️ [Tự động] Di chuyển sang bản đồ: ${mapDef.name}`);
          await this.warpToMap(targetMapId);
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
  let { label, url } = req.body;
  if (!url) return res.status(400).json({ error: 'Thiếu URL proxy' });

  url = url.trim();

  // Auto-parse raw proxy format (IP:PORT:USER:PASS or IP:PORT)
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('socks')) {
    const parts = url.split(':');
    if (parts.length === 4) {
      const [ip, port, user, pass] = parts;
      url = `http://${user}:${pass}@${ip}:${port}`;
      if (!label) {
        label = `${ip}:${port}`;
      }
    } else if (parts.length === 2) {
      const [ip, port] = parts;
      url = `http://${ip}:${port}`;
      if (!label) {
        label = `${ip}:${port}`;
      }
    } else {
      return res.status(400).json({ error: 'Định dạng proxy không hợp lệ. Vui lòng nhập http://..., socks5://... hoặc dạng IP:PORT:USER:PASS hoặc IP:PORT' });
    }
  }

  // Mask password or get clean label from URL if not specified
  if (!label) {
    try {
      const parsed = new URL(url);
      label = parsed.host;
    } catch (e) {
      label = url;
    }
  }

  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('socks')) {
    return res.status(400).json({ error: 'URL proxy không hợp lệ (phải bắt đầu bằng http:// hoặc socks5://)' });
  }

  const proxy = proxyPool.addProxy(label, url);
  res.json({ success: true, proxy });
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
          status: bot.status,
          clientActive: !!(bot.lastClientActive && (Date.now() - bot.lastClientActive < 12000)),
          error: bot.error,
          lastUpdate: bot.lastUpdate,
          settings: bot.settings,
          proxyId: bot.proxyId,
          proxyInfo: req.user.role === 'admin' ? proxyPool.getBotProxyInfo(bot.line_uid) : null,
          combatRates: bot.getCombatRates ? bot.getCombatRates() : { killsPerMin: 0, goldPerMin: 0, expPerMin: 0 },
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
          aliveBossCount: bot.bosses ? bot.bosses.filter(b => (b.hp || 0) > 0).length : 0,
          bossHuntActive: bot.settings.bossHuntMode !== 'off',
          aliveBosses: (bot.bosses || []).filter(b => (b.hp || 0) > 0).map(b => ({
            id: b.id,
            name: b.name || 'Boss',
            emoji: b.emoji || '👾',
            lv: b.lv || 1,
            hp: b.hp,
            hp_max: b.hp_max,
            x: b.x,
            y: b.y,
            isTarget: b.id === bot.lastTargetedBossId
          }))
        };
      });
    res.json(list);
  } catch (err) {
    console.error('Error in GET /api/accounts:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tài khoản: ' + err.message });
  }
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
        Object.values(botInstances).forEach(otherBot => {
          if (otherBot.userId === bot.userId && otherBot.line_uid !== bot.line_uid) {
            if (otherBot.settings.teamRole === 'leader') {
              otherBot.settings.teamRole = 'none';
              otherBot.addLog('SYSTEM', 'Vai trò Leader đã được chuyển giao cho tài khoản khác.');
            }
          }
        });
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
        currentAccounts.forEach(acc => {
          if (acc.userId === bot.userId && acc.line_uid !== bot.line_uid) {
            if (acc.settings && acc.settings.teamRole === 'leader') {
              acc.settings.teamRole = 'none';
            }
          }
        });
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

  const currentAccounts = loadAccounts();
  let syncCount = 0;
  const leaderSettings = { ...leaderBot.settings };
  
  // We should not copy teamRole to members, keeping their role as 'member'
  delete leaderSettings.teamRole;

  currentAccounts.forEach(acc => {
    if (acc.userId === leaderBot.userId && acc.line_uid !== leaderBot.line_uid) {
      if (acc.settings && acc.settings.teamRole === 'member') {
        // Copy settings
        acc.settings = {
          ...leaderSettings,
          teamRole: 'member' // preserve member role
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

// Trigger manual action
app.post('/api/accounts/:line_uid/action', requireAuth, async (req, res) => {
  const { line_uid } = req.params;
  const { action, param, extra } = req.body;
  const bot = botInstances[line_uid];
  if (!checkAccountOwnership(req, res, bot)) return;

  if (action === 'force_mvp_hunt') {
    try {
      bot.updateSettings({ bossHuntMode: 'type2' });
      
      // Save settings changes to accounts.json
      const currentAccounts = loadAccounts();
      const index = currentAccounts.findIndex(acc => acc.line_uid === line_uid);
      if (index !== -1) {
        currentAccounts[index].settings = bot.settings;
        saveAccounts(currentAccounts);
      }

      bot.triggerMvpCycle(true);
      return res.json({ ok: true, msg: 'Đã kích hoạt chế độ đi săn Boss xoay vòng map chỉ định!' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (action === 'set_boss_target') {
    const bossId = extra && extra.bossId !== undefined ? Number(extra.bossId) : null;
    if (bossId === null) {
      bot.manualTargetBossId = null;
      bot.addLog('SYSTEM', '🎯 [Manual Target] Đã hủy chỉ định boss thủ công. Quay lại chế độ tự động.');
      return res.json({ ok: true, msg: 'Đã hủy chỉ định boss. Bot sẽ tự chọn mục tiêu.' });
    }
    const aliveBoss = bot.bosses ? bot.bosses.find(b => b.id === bossId && (b.hp || 0) > 0) : null;
    if (!aliveBoss) {
      return res.status(400).json({ error: 'Boss không tồn tại hoặc đã chết.' });
    }
    bot.manualTargetBossId = bossId;
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

    const response = await bot.sendRequest(url, payload);
    if (response.player) {
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
async function proxyRequest(req, res, targetUrl, uid = null) {
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

    // Use specific bot's dispatcher if uid is provided, to ensure matching outbound IP addresses
    const dispatcher = uid ? proxyPool.getDispatcher(uid) : proxyPool.getDefaultDispatcher();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      dispatcher: dispatcher
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
}

module.exports = {
  tierGold,
  tierRes,
  _upgCostMult,
  getArmorUpgradeCost,
  getCatUpgradeCost,
  getDroneUpgradeCost,
  getMineUpgradeCost,
  BotInstance
};
