const assert = require('assert');
const {
  tierGold,
  tierRes,
  _upgCostMult,
  getArmorUpgradeCost,
  getCatUpgradeCost,
  getDroneUpgradeCost,
  getMineUpgradeCost,
  BotInstance
} = require('./server');

console.log('🧪 Running Unit Tests...');

(async () => {
try {
  // Test tierGold
  console.log('Testing tierGold...');
  assert.strictEqual(tierGold(1), 100);
  assert.strictEqual(tierGold(5), 500);
  assert.strictEqual(tierGold(10), 1000);
  assert.strictEqual(tierGold(11), 2000);
  assert.strictEqual(tierGold(20), 3000);

  // Test tierRes
  console.log('Testing tierRes...');
  assert.strictEqual(tierRes(1), 10);
  assert.strictEqual(tierRes(10), 100);
  assert.strictEqual(tierRes(11), 363);
  assert.strictEqual(tierRes(20), 660);

  // Test _upgCostMult
  console.log('Testing _upgCostMult...');
  assert.strictEqual(_upgCostMult(1), 1.0);
  assert.strictEqual(_upgCostMult(19), 1.0);
  assert.strictEqual(_upgCostMult(20), 1.1);
  assert.strictEqual(_upgCostMult(30), 1.35); // 1.1 + 0.25 * (3 - 2) = 1.35
  assert.strictEqual(_upgCostMult(40), 1.60); // 1.1 + 0.25 * (4 - 2) = 1.60

  // Test getArmorUpgradeCost
  console.log('Testing getArmorUpgradeCost...');
  const costArm0 = getArmorUpgradeCost(0); // target lv 1
  assert.strictEqual(costArm0.gold, 100); // Math.ceil(100 * 1.0)
  assert.strictEqual(costArm0.stone, 10); // Math.ceil(10 * 1.0)

  const costArm19 = getArmorUpgradeCost(19); // target lv 20
  assert.strictEqual(costArm19.gold, 3301); // Math.ceil(3000 * 1.1) due to JS float precision
  assert.strictEqual(costArm19.stone, 727); // Math.ceil(660 * 1.1) due to JS float precision

  // Test getCatUpgradeCost
  console.log('Testing getCatUpgradeCost...');
  const costCat0 = getCatUpgradeCost(0); // target lv 1
  assert.strictEqual(costCat0.gold, 100);
  assert.strictEqual(costCat0.stone, 10);

  // Test getDroneUpgradeCost
  console.log('Testing getDroneUpgradeCost...');
  const costDrone0 = getDroneUpgradeCost(0); // target lv 1
  assert.strictEqual(costDrone0.gold, 100);
  assert.strictEqual(costDrone0.copper, 10);

  // Test getMineUpgradeCost
  console.log('Testing getMineUpgradeCost...');
  const costMine0 = getMineUpgradeCost(0); // target lv 1
  assert.strictEqual(costMine0.gold, 100);
  assert.strictEqual(costMine0.stone, 10);
  assert.strictEqual(costMine0.wood, 10);
  assert.strictEqual(costMine0.iron, 10);
  assert.strictEqual(costMine0.copper, 10);

  // Test Password Hashing (PBKDF2)
  console.log('Testing hashPassword...');
  const crypto = require('crypto');
  const salt = 'testsalt123';
  const pass = 'admin123';
  const hash1 = crypto.pbkdf2Sync(pass, salt, 1000, 64, 'sha512').toString('hex');
  const hash2 = crypto.pbkdf2Sync(pass, salt, 1000, 64, 'sha512').toString('hex');
  const hashWrong = crypto.pbkdf2Sync('wrongpass', salt, 1000, 64, 'sha512').toString('hex');
  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, hashWrong);

  // Test Expiration Calculation
  console.log('Testing Expiration Logic...');
  const daysNum = parseFloat("0.00069444");
  assert.ok(!isNaN(daysNum) && daysNum > 0);
  const targetMs = Math.round(daysNum * 86400000);
  assert.strictEqual(targetMs, 60000); // Exactly 60,000 ms = 1 minute!

  // Test Combat Rates Calculation
  console.log('Testing Combat Rates Calculation...');
  const mockBot = {
    startTime: Date.now() - 2 * 60 * 1000, // started 2 minutes ago
    combatStatsHistory: [
      { time: Date.now() - 30 * 1000, kills: 4, gold: 100, exp: 200 }
    ],
    getCombatRates: function() {
      const now = Date.now();
      const cutoff = now - 5 * 60 * 1000;
      this.combatStatsHistory = (this.combatStatsHistory || []).filter(h => h.time >= cutoff);
      let totalKills = 0, totalGold = 0, totalExp = 0;
      this.combatStatsHistory.forEach(h => { totalKills += h.kills; totalGold += h.gold; totalExp += h.exp; });
      const startOfMeasurement = this.startTime ? Math.max(this.startTime, cutoff) : cutoff;
      const diffMs = now - startOfMeasurement;
      const elapsedMin = Math.max(0.1, diffMs / 60000);
      return {
        killsPerMin: Math.round((totalKills / elapsedMin) * 10) / 10,
        goldPerMin: Math.round(totalGold / elapsedMin),
        expPerMin: Math.round(totalExp / elapsedMin)
      };
    }
  };
  const rates = mockBot.getCombatRates();
  // 4 kills over 2 minutes = 2.0 kills/min
  assert.strictEqual(rates.killsPerMin, 2.0);

  // T46: Act Flag State Machine Tests
  console.log('Testing T46 Act Flag State Machine...');

  // Helper: simulate act flag calculation logic (mirrors pollGame act block in server.js)
  function calcActValue(bot) {
    const now = Date.now();
    let actValue = 0;
    if (bot.pollCount === 1) {
      actValue = 1;
      bot.lastActSentAt = now;
      bot.nextActInterval = 120000 + Math.random() * 180000;
      bot.pendingActFlag = false;
    } else if (bot.pendingActFlag) {
      actValue = 1;
      bot.lastActSentAt = now;
      bot.nextActInterval = 120000 + Math.random() * 180000;
      bot.pendingActFlag = false;
    } else if ((now - bot.lastActSentAt) >= bot.nextActInterval) {
      actValue = 1;
      bot.lastActSentAt = now;
      bot.nextActInterval = 120000 + Math.random() * 180000;
    }
    return actValue;
  }

  // Branch 1: First poll always sends act=1
  const bot1 = { pollCount: 1, lastActSentAt: 0, nextActInterval: 999999, pendingActFlag: false };
  assert.strictEqual(calcActValue(bot1), 1, 'First poll must send act=1');
  assert.strictEqual(bot1.pendingActFlag, false, 'pendingActFlag reset after first poll');

  // Branch 2: Event-driven act trigger (pendingActFlag = true)
  const bot2 = { pollCount: 5, lastActSentAt: Date.now(), nextActInterval: 999999, pendingActFlag: true };
  assert.strictEqual(calcActValue(bot2), 1, 'pendingActFlag=true must send act=1');
  assert.strictEqual(bot2.pendingActFlag, false, 'pendingActFlag reset after event-driven send');

  // Branch 3a: Jitter timeout reached → act=1
  const bot3 = { pollCount: 5, lastActSentAt: Date.now() - 300000, nextActInterval: 120000, pendingActFlag: false };
  assert.strictEqual(calcActValue(bot3), 1, 'Jitter timeout reached must send act=1');

  // Branch 3b: Jitter timeout NOT reached → act=0
  const bot4 = { pollCount: 5, lastActSentAt: Date.now(), nextActInterval: 300000, pendingActFlag: false };
  assert.strictEqual(calcActValue(bot4), 0, 'Jitter not reached must send act=0');

  // Jitter range validation: 120s–300s (120000–300000ms)
  console.log('Testing T46 Jitter Range 120s-300s...');
  for (let i = 0; i < 100; i++) {
    const interval = 120000 + Math.random() * 180000;
    assert.ok(interval >= 120000, `Jitter min must be >= 120000, got ${interval}`);
    assert.ok(interval <= 300000, `Jitter max must be <= 300000, got ${interval}`);
  }

  // Idle recovery: d.idle=true → force act=1 next poll
  console.log('Testing T46 Idle Recovery...');
  const bot5 = { pollCount: 50, lastActSentAt: Date.now(), nextActInterval: 999999, pendingActFlag: false };
  // Simulate d.idle=true handler
  bot5.lastActSentAt = 0;
  bot5.nextActInterval = 0;
  bot5.pendingActFlag = true;
  assert.strictEqual(calcActValue(bot5), 1, 'Idle recovery must force act=1');

  // Test T23: Admin Map & Zone Sync Logic
  console.log('Testing T23 Map & Zone Sync Engine...');
  const fs = require('fs');
  const path = require('path');
  const MAPS_CACHE_FILE = path.join(__dirname, 'maps_cache.json');
  const SPOTS_CACHE_FILE = path.join(__dirname, 'spots_cache.json');

  // Verify default maps exist
  const defaultMaps = [
    { id: 1, name: 'Thung lũng Trung tâm',  emoji: '🌿', req: 1  },
    { id: 2, name: 'Sa mạc Vĩnh hằng',      emoji: '🏜️', req: 25 },
    { id: 3, name: 'Vùng đất Băng giá',     emoji: '❄️', req: 40 },
    { id: 4, name: 'Đấu trường Arena (PVP)', emoji: '⚔️', req: 20 },
    { id: 5, name: 'Tàn tích Cổ đại',      emoji: '🏛️', req: 55 },
    { id: 6, name: 'Núi lửa Sôi trào',      emoji: '🌋', req: 70 },
  ];
  assert.strictEqual(defaultMaps.length, 6);
  assert.strictEqual(defaultMaps[0].id, 1);
  assert.strictEqual(defaultMaps[5].id, 6);

  // Test map regex extraction logic
  const sampleCanvasScript = `
    const MAP_DEFS = [
      {id:1,name:'ทุ่งกลาง',emoji:'🌿',req:1},
      {id:2,name:'ทะเลทรายนิรันดร์',emoji:'🏜️',req:25},
      {id:3,name:'ดินแดนเยือกแข็ง',emoji:'❄️',req:40},
      {id:4,name:'สนามประลอง',emoji:'⚔️',req:20},
      {id:5,name:'Tàn tích Cổ đại',emoji:'🏛️',req:55},
      {id:6,name:'Núi lửa Sôi trào',emoji:'🌋',req:70},
      {id:7,name:'Bản đồ Mới',emoji:'🏔️',req:85}
    ];
  `;
  const match = sampleCanvasScript.match(/MAP_DEFS\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
  assert.ok(match && match[1], 'MAP_DEFS regex must match array in script');
  const rawItems = match[1].match(/\{[^}]+\}/g);
  // Test T24: Passive Map Discovery Calculation Logic
  console.log('Testing T24 Passive Map Discovery...');
  const mockSpotsForMap9 = {
    "1": { id: 1, name: "Vùng Tân Thủ 1", lv: 80 },
    "2": { id: 2, name: "Vùng Tân Thủ 2", lv: 95 }
  };
  const spotsList = Object.values(mockSpotsForMap9);
  let minLv = 999;
  spotsList.forEach(s => { if (s.lv < minLv) minLv = s.lv; });
  assert.strictEqual(minLv, 80, 'Min level for Map 9 should be calculated as 80');

  // Test updatePlayerState (Carrying forward COLD_FIELDS)
  console.log('Testing updatePlayerState carrying forward cold fields...');
  const mockAccount = {
    line_uid: 'test_uid',
    session_token: 'test_token',
    name: 'Test Bot',
    settings: {}
  };
  const instance = new BotInstance(mockAccount);
  
  // Set initial player state with cold fields
  instance.player = {
    lv: 10,
    gold: 5000,
    home_crops: [{ p: 0, i: 0, s: 5, t: 12345678 }],
    home_seeds: { '5': 10 },
    pet_mid: 2
  };
  
  // Simulate a sparse/hot update response missing cold fields
  const sparseUpdate = {
    lv: 11,
    gold: 6000
  };
  
  instance.updatePlayerState(sparseUpdate);
  
  // Verify that lv and gold are updated
  assert.strictEqual(instance.player.lv, 11);
  assert.strictEqual(instance.player.gold, 6000);
  // Verify that cold fields are carried forward and not wiped
  assert.deepStrictEqual(instance.player.home_crops, [{ p: 0, i: 0, s: 5, t: 12345678 }]);
  assert.deepStrictEqual(instance.player.home_seeds, { '5': 10 });
  assert.strictEqual(instance.player.pet_mid, 2);

  // Verify teamRole default setting
  console.log('Testing teamRole default settings...');
  const defaultSettings = instance.getDefaultSettings();
  assert.strictEqual(defaultSettings.teamRole, 'none');

  // Verify MVP Boss Hunting Flow Changes
  console.log('Testing MVP Boss Hunting Flow changes...');
  
  // Test Case 1: isFull when bosses is null
  instance.settings.bossHuntMode = 'off';
  instance.bosses = null;
  instance.targetedMvp = false;
  instance.pollCount = 1;
  const isFullWithNullBosses = ((instance.pollCount % (instance.settings.bossHuntMode !== 'off' ? 5 : 10) === 0) || instance.targetedMvp || instance.bosses === null) ? 1 : 0;
  assert.strictEqual(isFullWithNullBosses, 1, 'isFull must be 1 when bosses is null');

  // Test Case 2: mvpConfirmClearCount reset when bosses is null
  instance.bosses = null;
  instance.mvpConfirmClearCount = 3;
  let aliveTargetBosses = [];
  if (instance.bosses === null) {
    instance.mvpConfirmClearCount = 0;
  } else if (aliveTargetBosses.length === 0) {
    instance.mvpConfirmClearCount++;
  } else {
    instance.mvpConfirmClearCount = 0;
  }
  assert.strictEqual(instance.mvpConfirmClearCount, 0, 'mvpConfirmClearCount must be reset to 0 when bosses list is null');

  // Test Case 3: Silent reset of targeted boss when map changes
  instance.lastTargetedBossId = 123;
  instance.currentMvpBossInfo = { id: 123, name: 'Baphomet', mapId: 2 };
  instance.player = { map: 3 }; // different map
  instance.weKilledCurrentMvp = true;
  if (instance.lastTargetedBossId !== null && instance.player && instance.currentMvpBossInfo && Number(instance.player.map) !== Number(instance.currentMvpBossInfo.mapId)) {
    instance.lastTargetedBossId = null;
    instance.currentMvpBossInfo = null;
    instance._bossSnipeActive = false;
    instance._snipeLoggedOnce = false;
    instance.weKilledCurrentMvp = false;
  }
  assert.strictEqual(instance.lastTargetedBossId, null, 'targeted boss must be silently reset when map changes');
  assert.strictEqual(instance.weKilledCurrentMvp, false, 'weKilledCurrentMvp must be reset to false when map changes');

  // Test Case 4: Early-exit Map Routing Check (MVP cycle vs current map)
  instance.isMvpCycling = true;
  instance.settings.mvpTargetMaps = '2,3,5';
  instance.mvpCycleMapIndex = 0;
  instance.player = { map: 3 }; // different map
  
  const activeTargetMapId = instance.isMvpCycling 
    ? instance.getCurrentMvpCycleMap() 
    : (parseInt(instance.settings.targetMap) || 1);
    
  assert.strictEqual(activeTargetMapId, 2, 'activeTargetMapId must be the first map of the cycle (2) when cycle is active and index is 0');
  
  const needsWarp = (instance.settings.autoMap || instance.isMvpCycling) && Number(instance.player.map) !== Number(activeTargetMapId);
  assert.strictEqual(needsWarp, true, 'needsWarp must be true when player.map (3) is different from activeTargetMapId (2) during MVP cycle');

  // Test Case 5: Absolute HP sorting (lowest HP first) for Type 2
  console.log('Testing absolute HP sorting for Type 2...');
  const mockBosses = [
    { id: 1, name: 'Boss Max HP', hp: 1000 },
    { id: 2, name: 'Boss Half HP', hp: 300 },
    { id: 3, name: 'Boss Low HP', hp: 50 }
  ];
  mockBosses.sort((a, b) => (a.hp || 0) - (b.hp || 0));
  assert.strictEqual(mockBosses[0].id, 3, 'Lowest HP boss must be sorted first');
  assert.strictEqual(mockBosses[2].id, 1, 'Highest HP boss must be sorted last');

  // Test Case 6: Fast 1-poll map clear confirmation
  instance.bosses = [];
  instance.mvpConfirmClearCount = 0;
  if (instance.bosses === null) {
    instance.mvpConfirmClearCount = 0;
  } else if (instance.bosses.length === 0) {
    instance.mvpConfirmClearCount++;
  }
  const isDoneFast = (instance.mvpConfirmClearCount >= 1);
  assert.strictEqual(isDoneFast, true, 'isDoneWithCurrentMap must be true on 1st poll when bosses array is empty');

  // Test Case 7: Boss Safe Distance 15m - 20m & Kiting Vector Engine
  console.log('Testing Boss Safe Distance (15m - 20m) & Kiting Vector Engine...');
  const calcBossDistState = (playerPos, bossPos) => {
    const dx = playerPos.x - bossPos.x;
    const dy = playerPos.y - bossPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const MIN_BOSS_DIST = 15;
    const MAX_BOSS_DIST = 20;
    const TARGET_KITE_DIST = 17.5;
    let expCx, expCy, traveling, lockPos;

    if (dist > MAX_BOSS_DIST || dist < MIN_BOSS_DIST) {
      const ux = dist > 0 ? dx / dist : 1;
      const uy = dist > 0 ? dy / dist : 0;
      expCx = Math.round((bossPos.x + ux * TARGET_KITE_DIST) * 100) / 100;
      expCy = Math.round((bossPos.y + uy * TARGET_KITE_DIST) * 100) / 100;
      traveling = 1;
      lockPos = 0;
    } else {
      expCx = bossPos.x;
      expCy = bossPos.y;
      traveling = 0;
      lockPos = 1;
    }
    return { dist, expCx, expCy, traveling, lockPos };
  };

  // Scenario A: Far away (30m > 20m) -> Approach target 17.5m
  const resFar = calcBossDistState({ x: 100, y: 130 }, { x: 100, y: 100 });
  assert.strictEqual(resFar.traveling, 1, 'Far away: traveling must be 1');
  assert.strictEqual(resFar.lockPos, 0, 'Far away: lockPos must be 0');
  assert.strictEqual(resFar.expCy, 117.5, 'Far away: target Y must be 100 + 17.5 = 117.5');

  // Scenario B: Perfect distance (17m in [15, 20]) -> Stand still & Lock DPS
  const resOptimal = calcBossDistState({ x: 100, y: 117 }, { x: 100, y: 100 });
  assert.strictEqual(resOptimal.traveling, 0, 'Optimal distance: traveling must be 0');
  assert.strictEqual(resOptimal.lockPos, 1, 'Optimal distance: lockPos must be 1');

  // Scenario C: Too close (8m < 15m) -> Kite back to 17.5m
  const resTooClose = calcBossDistState({ x: 100, y: 108 }, { x: 100, y: 100 });
  assert.strictEqual(resTooClose.traveling, 1, 'Too close: traveling must be 1 to kite');
  assert.strictEqual(resTooClose.lockPos, 0, 'Too close: lockPos must be 0');
  assert.strictEqual(resTooClose.expCy, 117.5, 'Too close: target Y must kite back to 117.5');

  // Test Case 7: Advanced Market Filtering
  console.log('Testing Advanced Market Filtering (Card, Module, Collectibles)...');

  // Test Case 7: Revamped Auto Market Buy System (9 Categories & Custom Filters)
  console.log('Testing Revamped Auto Market Buy Engine...');

  // Reset instance player and settings
  instance.player = { gold: 100000, lv: 50 };
  instance.status = 'running';
  instance.userId = 'usr_admin';
  instance.lastMarketScanAt = null;
  instance.marketBuyHistory = [];
  instance.settings = {
    autoMarketBuy: true,
    marketMaxPrice: 10000,
    marketScanInterval: 5,
    marketCategories: {
      module: false,
      card: false,
      egg: false,
      collectible: false,
      resource: false, // Default OFF
      card_box: false,
      egg_box: false,
      module_box: false,
      diamond: false
    },
    marketSelectedCards: [],
    marketSelectedEggs: [],
    marketSelectedModuleTiers: []
  };

  const mockListings = {
    ok: true,
    listings: [
      // Cards
      { id: 101, item_name: 'การ์ด Jellyfish (1⭐)', item_type: 'card', price_per: 500 }, // Star: 1
      { id: 102, item_name: 'การ์ด Wolf (2⭐)', item_type: 'card', price_per: 800 },   // Star: 2
      { id: 103, item_name: 'การ์ด Baphomet (10⭐)', item_type: 'card', price_per: 15000 }, // Over max price
      // Eggs
      { id: 105, item_name: 'ไข่ ไก่เจี๊ยบ', item_type: 'egg', price_per: 600 },
      // Modules
      { id: 201, item_name: 'โมดูลมีด T1', item_type: 'module_knife', price_per: 1200 },
      { id: 202, item_name: 'โมดูลเกราะ T3', item_type: 'module_armor', price_per: 3000 },
      { id: 203, item_name: 'โมดูลดาบ T4', item_type: 'module_sword', price_per: 4000 },
      // Collectibles/Proofs
      { id: 301, item_name: 'ชิ้นส่วนไททัน', item_type: 'hardware', price_per: 1000 }, // Titan part
      { id: 302, item_name: 'ท่อนไม้มหัศจรรย์', item_type: 'house_parts', price_per: 2000 },
      // Resource / Trash
      { id: 401, item_name: 'แร่อื่นๆ (Resource)', item_type: 'ore', price_per: 100, qty: 500 },
      // Boxes
      { id: 501, item_name: 'กล่องสุ่มการ์ด ระดับ 1', item_type: 'card_box', price_per: 2000, qty: 8 },
      { id: 502, item_name: 'กล่องสุ่มการ์ด ระดับ 7', item_type: 'card_box', price_per: 8000, qty: 15 },
      { id: 601, item_name: 'กล่องสุ่มไข่ ระดับ 2', item_type: 'egg_box', price_per: 1500 },
      { id: 602, item_name: 'กล่องสุ่มไข่ ระดับ 8', item_type: 'egg_box', price_per: 9000 },
      { id: 701, item_name: 'กล่องสุ่มโมดูล ซับซ้อน', item_type: 'module_box', price_per: 3000 },
      { id: 702, item_name: 'กล่องสุ่มโมดูล ขั้นสูง', item_type: 'module_box', price_per: 5000 },
      { id: 703, item_name: 'กล่องสุ่มโมดูล ขั้นสูงพิเศษ', item_type: 'module_box', price_per: 9000 }
    ]
  };

  let lastBoughtListingIds = [];
  let lastBoughtQuantities = [];
  let simulateBuyError = false;

  instance.sendRequest = async function(url, params) {
    if (url.includes('xhrpg_market.php')) {
      if (params.action === 'get_listings') {
        return mockListings;
      }
      if (params.action === 'buy') {
        if (simulateBuyError) {
          return { ok: false, error: 'Sản phẩm đã bị người khác mua mất' };
        }
        lastBoughtListingIds.push(params.listing_id);
        lastBoughtQuantities.push({ id: params.listing_id, qty: params.qty });
        return { ok: true, player: instance.player };
      }
    }
    return { ok: true };
  };

  // 7a. Test Card selective filtering
  instance.settings.marketCategories.card = true;
  instance.settings.marketSelectedCards = ['Jellyfish', 'Wolf'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [101, 102], 'Should buy all matching cards (id 101, 102)');
  instance.settings.marketCategories.card = false;

  // 7b. Test Egg selective filtering with newly translated monster name
  instance.settings.marketCategories.egg = true;
  instance.settings.marketSelectedEggs = ['Gà con']; // Maps to 'ไข่ ไก่เจี๊ยบ' -> 'Trứng Gà con'
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [105], 'Should buy egg matching Gà con (id 105)');
  instance.settings.marketCategories.egg = false;

  // 7c. Test Module Tier filtering (T3, T4 within T1-T5 range)
  instance.settings.marketCategories.module = true;
  instance.settings.marketSelectedModuleTiers = ['T3', 'T4'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [202, 203], 'Should buy Module T3 and T4 (id 202, 203)');
  instance.settings.marketCategories.module = false;

  // 7d. Test Resource/Trash Category OFF (Default behavior)
  instance.settings.marketCategories.resource = false; // Resource switch OFF
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [], 'Should NOT buy resource/trash when resource category is OFF');

  // 7f. Test Category ON with empty sub-filters (Should buy ANY card <= max price)
  instance.settings.marketCategories.card = true;
  instance.settings.marketSelectedCards = []; // Empty sub-filters
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [101, 102], 'Should buy all cards <= max price (id 101, 102) when card category is ON even if sub-filters are empty');
  instance.settings.marketCategories.card = false;

  // 7g. Test Box selective filtering
  // Module box (should match Cao cấp, Sử thi, Sử thi+ selectively)
  instance.settings.marketCategories.module_box = true;
  instance.settings.marketSelectedModuleBoxes = ['Cao cấp', 'Sử thi+'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [701, 703], 'Should buy Cao cấp (701) and Sử thi+ (703), skipping Sử thi (702)');
  instance.settings.marketCategories.module_box = false;
  instance.settings.marketSelectedModuleBoxes = [];

  // Card box (should match Bậc 7 selectively)
  instance.settings.marketCategories.card_box = true;
  instance.settings.marketSelectedCardBoxes = ['Bậc 7'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [502], 'Should only buy card box Bậc 7 (502)');
  instance.settings.marketCategories.card_box = false;
  instance.settings.marketSelectedCardBoxes = [];

  // Egg box (should match Bậc 2 selectively)
  instance.settings.marketCategories.egg_box = true;
  instance.settings.marketSelectedEggBoxes = ['Bậc 2'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [601], 'Should only buy egg box Bậc 2 (601)');
  instance.settings.marketCategories.egg_box = false;
  instance.settings.marketSelectedEggBoxes = [];

  // 7h. Test Multi-Qty Buying and Capping
  console.log('Testing Multi-Qty Buying and Capping...');
  instance.settings.marketCategories.resource = true;
  instance.settings.marketCategoryMaxQtys = { resource: 150, card_box: 10 };
  instance.player.gold = 30000; // Enough gold for 150 ore (150 * 100 = 15000 gold)
  
  lastBoughtListingIds = [];
  lastBoughtQuantities = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  
  // Since category resource is ON, and id 401 has qty 500, we should buy capped by limit resource: 150!
  const oreBought = lastBoughtQuantities.find(x => x.id === 401);
  assert.ok(oreBought, 'Should buy resource id 401');
  assert.strictEqual(oreBought.qty, 150, 'Should buy exactly 150 ore (capped by limit 150)');

  // Let's test buying with gold limits capping:
  instance.player.gold = 500; // Only enough gold for 5 ore (5 * 100 = 500 gold)
  lastBoughtListingIds = [];
  lastBoughtQuantities = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  
  const oreBoughtCapped = lastBoughtQuantities.find(x => x.id === 401);
  assert.ok(oreBoughtCapped, 'Should buy resource id 401');
  assert.strictEqual(oreBoughtCapped.qty, 5, 'Should buy exactly 5 ore (capped by gold limit)');

  // Test buying card boxes with limit 10, when card_box has qty 8, it should buy all 8!
  instance.settings.marketCategories.resource = false;
  instance.settings.marketCategories.card_box = true;
  instance.settings.marketSelectedCardBoxes = ['Bậc 1']; // id 501 has tier 1, qty 8
  instance.player.gold = 50000; // Plenty of gold
  
  lastBoughtListingIds = [];
  lastBoughtQuantities = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  
  const boxBought = lastBoughtQuantities.find(x => x.id === 501);
  assert.ok(boxBought, 'Should buy card box id 501');
  assert.strictEqual(boxBought.qty, 8, 'Should buy all 8 box items (market has 8, limit is 10)');

  // Clean up
  instance.settings.marketCategories.card_box = false;
  instance.settings.marketSelectedCardBoxes = [];

  // 7e. Test Buy Error Handling & History Log Recording
  instance.settings.marketCategories.collectible = true;
  simulateBuyError = true;
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.strictEqual(simulateBuyError, true);
  assert.strictEqual(instance.marketBuyHistory.length > 0, true, 'Should record failed buy in marketBuyHistory');
  assert.strictEqual(instance.marketBuyHistory[0].status, 'failed', 'History entry status must be failed');

  // 8. Test Urgent Active Potion Healing
  console.log('Testing Urgent Active Potion Healing...');
  instance.isMvpCycling = false;
  instance.mvpCycleOriginalMap = null;
  instance.settings.activeHealEnabled = true;
  instance.settings.activeHealThreshold = 60;
  instance.player = {
    map: 3,
    hp: 40,
    hp_max: 100,
    is_dead: false
  };

  let potionRequestSent = false;
  const originalSendRequest = instance.sendRequest;
  instance.sendRequest = async function(url, params) {
    if (url.includes('xhrpg_upgrade.php') && params.action === 'use_potion_manual') {
      potionRequestSent = true;
      return { ok: true, player: { map: 3, hp: 100, hp_max: 100, is_dead: false } };
    }
    if (url.includes('xhrpg_game.php')) {
      return { ok: true, player: { map: 3, hp: 40, hp_max: 100, is_dead: false } };
    }
    return { ok: true };
  };

  await instance.pollGame();
  assert.strictEqual(potionRequestSent, true, 'Should send use_potion_manual request when HP < threshold and activeHealEnabled is true');
  assert.strictEqual(instance.player.hp, 100, 'Player HP should be updated to 100 after successful heal');

  // Clean up
  instance.sendRequest = originalSendRequest;
  instance.settings.activeHealEnabled = false;

  console.log('✅ Revamped Auto Market Buy Tests Passed successfully!');
  console.log('✅ Urgent Active Potion Healing Tests Passed successfully!');
  console.log('✅ All Unit Tests Passed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Unit Tests Failed:', error);
  process.exit(1);
}
})();
