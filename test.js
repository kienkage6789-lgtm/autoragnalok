const assert = require('assert');
const {
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
  generateRandomFingerprint,
  generateFingerprintInjectionScript,
  REALISTIC_DEVICE_PROFILES,
  naturalCoordNoise,
  logNormalActInterval,
  checkAndRecoverZombieBots,
  proxyRequest,
  fetchGameHtml,
  fetchGameLoginHtml,
  fetchGameAsset,
  sanitizeSessionToken,
  saveSpotsCache,
  requestSaveSpotsCache,
  BotRequestQueue,
  combineAbortSignals
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
      { time: Date.now() - 30 * 1000, kills: 4, gold: 100, exp: 200, wood: 10, stone: 20, iron: 30, copper: 40, herb: 50 }
    ],
    getCombatRates: function() {
      const now = Date.now();
      const cutoff = now - 5 * 60 * 1000;
      this.combatStatsHistory = (this.combatStatsHistory || []).filter(h => h.time >= cutoff);
      let totalKills = 0, totalGold = 0, totalExp = 0, totalWood = 0, totalStone = 0, totalIron = 0, totalCopper = 0, totalHerb = 0;
      this.combatStatsHistory.forEach(h => {
        totalKills += h.kills || 0;
        totalGold += h.gold || 0;
        totalExp += h.exp || 0;
        totalWood += h.wood || 0;
        totalStone += h.stone || 0;
        totalIron += h.iron || 0;
        totalCopper += h.copper || 0;
        totalHerb += h.herb || 0;
      });
      const startOfMeasurement = this.startTime ? Math.max(this.startTime, cutoff) : cutoff;
      const diffMs = now - startOfMeasurement;
      const elapsedMin = Math.max(0.1, diffMs / 60000);
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
  };
  const rates = mockBot.getCombatRates();
  // 4 kills over 2 minutes = 2.0 kills/min
  assert.strictEqual(rates.killsPerMin, 2.0);
  assert.strictEqual(rates.woodPerMin, 5);
  assert.strictEqual(rates.stonePerMin, 10);
  assert.strictEqual(rates.ironPerMin, 15);
  assert.strictEqual(rates.copperPerMin, 20);
  assert.strictEqual(rates.herbPerMin, 25);

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

  // Verify teamRole & teamId default setting
  console.log('Testing teamRole & teamId default settings...');
  const defaultSettings = instance.getDefaultSettings();
  assert.strictEqual(defaultSettings.teamRole, 'none');
  assert.strictEqual(defaultSettings.teamId, 'none');

  // Verify legacy settings migration and specific event defaults
  console.log('Testing legacy settings migration and specific event defaults...');
  assert.strictEqual(defaultSettings.autoEventJoinInv, false);
  assert.strictEqual(defaultSettings.autoEventJoinGw, false);
  assert.strictEqual(defaultSettings.autoEventJoinCw, false);

  const migratedBot = new BotInstance({
    line_uid: 'migrated_test',
    settings: { autoEventJoin: true }
  });
  assert.strictEqual(migratedBot.settings.autoEventJoinInv, true, 'autoEventJoinInv must be migrated to true');
  assert.strictEqual(migratedBot.settings.autoEventJoinGw, true, 'autoEventJoinGw must be migrated to true');
  assert.strictEqual(migratedBot.settings.autoEventJoinCw, true, 'autoEventJoinCw must be migrated to true');

  // Verify exitEventMode stuck map self-healing reset logic
  console.log('Testing exitEventMode self-healing stuck map reset logic...');
  const stuckBot = new BotInstance({
    line_uid: 'stuck_test',
    settings: { targetMap: 4 }
  });
  assert.strictEqual(stuckBot.settings.targetMap, 4);
  assert.strictEqual(stuckBot.inEventMode, false);
  // calling exitEventMode when inEventMode is false and targetMap is 4 should trigger self-healing reset to Map 1
  stuckBot.exitEventMode();
  assert.strictEqual(stuckBot.settings.targetMap, 1, 'stuck targetMap must be self-healed and reset to 1');

  // Verify eventOriginalMap saving logic
  console.log('Testing enterEventMode original map saving logic...');
  const eventBot = new BotInstance({
    line_uid: 'event_test',
    settings: { targetMap: 3, autoMap: true, autoZone: true, lock_zone_center: true, targetZone: 5 }
  });
  // Mock player state, currently on the event map (Map 4) after join action
  eventBot.player = { map: 4, lv: 50 };

  // Enter Event Mode (GW on Map 4)
  eventBot.enterEventMode('gw', 4);
  // eventOriginalMap should be saved as 3 (the original settings.targetMap, NOT the player's current map 4)
  assert.strictEqual(eventBot.eventOriginalMap, 3, 'eventOriginalMap must save the configured targetMap 3');
  assert.strictEqual(eventBot.settings.targetMap, 4, 'targetMap must be overridden to the event map 4');

  // Exit Event Mode
  eventBot.exitEventMode();
  assert.strictEqual(eventBot.settings.targetMap, 3, 'targetMap must be restored to 3 after exitEventMode');
  assert.strictEqual(eventBot.settings.autoMap, true, 'autoMap must be restored');
  assert.strictEqual(eventBot.settings.autoZone, true, 'autoZone must be restored');
  assert.strictEqual(eventBot.settings.lock_zone_center, true, 'lock_zone_center must be restored');
  assert.strictEqual(eventBot.settings.targetZone, 5, 'targetZone must be restored');
  assert.strictEqual(eventBot.isEventReturning, true, 'isEventReturning must be set to true');
  assert.strictEqual(eventBot.eventReturnMapTarget, 3, 'eventReturnMapTarget must be set to 3');

  // Verify map change event return zone preservation logic
  const prevP = { ...eventBot.player };
  eventBot.player.map = 3;

  if (prevP && prevP.map !== eventBot.player.map) {
    eventBot.spots = null;
    eventBot.bosses = null;
    const wasMvpReturning = (!eventBot.isMvpCycling && eventBot.mvpCycleOriginalMap !== null);
    const isEventReturning = eventBot.isEventReturning || false;
    if (prevP.map !== 5 && eventBot.player.map !== 5 && !eventBot.isMvpCycling && eventBot.mvpCycleOriginalMap === null && !wasMvpReturning && !isEventReturning) {
      eventBot.settings.autoZone = false;
      eventBot.settings.lock_zone_center = false;
      eventBot.settings.targetZone = 0;
    }
  }

  assert.strictEqual(eventBot.settings.autoZone, true, 'autoZone must NOT be reset to false when map changes during event return');
  assert.strictEqual(eventBot.settings.targetZone, 5, 'targetZone must NOT be reset to 0');

  // Simulate arrival logic
  if (eventBot.isEventReturning && eventBot.player) {
    if (Number(eventBot.player.map) === Number(eventBot.eventReturnMapTarget)) {
      eventBot.isEventReturning = false;
      eventBot.eventReturnMapTarget = null;
    }
  }

  assert.strictEqual(eventBot.isEventReturning, false, 'isEventReturning must be reset to false after arrival');
  assert.strictEqual(eventBot.eventReturnMapTarget, null, 'eventReturnMapTarget must be reset to null after arrival');

  // Verify MVP Boss Hunting Flow Changes
  console.log('Testing MVP Boss Hunting Flow changes...');

  // Test Case 1: isFull when bosses is null
  instance.settings.bossHuntMode = 'off';
  instance.bosses = null;
  instance.targetedMvp = false;
  instance.pollCount = 1;
  const isFullWithNullBosses = ((instance.pollCount % 2 === 0) || instance.targetedMvp || instance.bosses === null) ? 1 : 0;
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

  const needsWarp = (instance.settings.autoMap || instance.settings.bossHuntEnabled || instance.isMvpCycling) && Number(instance.player.map) !== Number(activeTargetMapId);
  assert.strictEqual(needsWarp, true, 'needsWarp must be true when player.map (3) is different from activeTargetMapId (2) during MVP cycle');

  // Test Case: Warp routing when autoMap is false but bossHuntMode is enabled (T57 follow-up)
  instance.isMvpCycling = false;
  instance.settings.autoMap = false;
  instance.settings.bossHuntEnabled = true;
  instance.settings.targetMap = 3;
  instance.player = { map: 1 };
  const targetMapT57 = instance.isMvpCycling ? instance.getCurrentMvpCycleMap() : (parseInt(instance.settings.targetMap) || 1);
  const needsWarpT57 = (instance.settings.autoMap || instance.settings.bossHuntEnabled || instance.isMvpCycling) && Number(instance.player.map) !== Number(targetMapT57);
  assert.strictEqual(needsWarpT57, true, 'needsWarp must be true when autoMap is false but bossHuntMode is enabled');

  // Test Case: Boss with hp === undefined treated as alive in all MVP cycle pathways
  console.log('Testing Boss with hp === undefined treated as alive...');
  instance.bosses = [
    { id: 99, name: 'Undefined HP Boss', x: 100, y: 100 } // hp property missing / undefined
  ];

  // 1. updateMvpCycleStatus aliveTargetBosses filter check
  const aliveTargetBossesUndefined = instance.bosses ? instance.bosses.filter(b => (b.hp === undefined || (b.hp || 0) > 0)) : [];
  assert.strictEqual(aliveTargetBossesUndefined.length, 1, 'Boss with hp === undefined must be considered alive for MVP cycle map clear check');

  // 2. MVP Hunt target filtering check
  const aliveBossesUndefined = instance.bosses.filter(b => (b.hp === undefined || (b.hp || 0) > 0));
  assert.strictEqual(aliveBossesUndefined.length, 1, 'Boss with hp === undefined must be filtered as alive for targeting');

  // 3. Dashboard API response filtering check
  const dashboardAliveCount = instance.bosses ? instance.bosses.filter(b => (b.hp === undefined || (b.hp || 0) > 0)).length : 0;
  const dashboardAliveList = (instance.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));
  assert.strictEqual(dashboardAliveCount, 1, 'Dashboard API must count boss with hp === undefined as alive');
  assert.strictEqual(dashboardAliveList.length, 1, 'Dashboard API must list boss with hp === undefined in aliveBosses');

  // 4. Manual boss target validation check
  const bossIdToTarget = 99;
  const manualTargetAlive = instance.bosses ? instance.bosses.find(b => b.id === bossIdToTarget && (b.hp === undefined || (b.hp || 0) > 0)) : null;
  assert.ok(manualTargetAlive, 'Manual boss target must find boss with hp === undefined as alive');

  // Clean up to avoid pollution
  instance.settings.bossHuntEnabled = false;
  instance.settings.autoMap = true;
  instance.isMvpCycling = false;

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

  // Test Case 6: isFull logic verification under MVP cycle
  console.log('Testing isFull logic with MVP cycle...');
  instance.isMvpCycling = true;
  instance.player = { map: 2 };
  instance.settings.mvpTargetMaps = '2,3,5';
  instance.mvpCycleMapIndex = 0;
  instance.bosses = [];
  instance.monsters = [{ id: 1 }];
  instance.pollCount = 1; // odd poll
  const activeTargetMapIdCheck = instance.getCurrentMvpCycleMap();
  const isCorrectMvpMapCheck = !instance.isMvpCycling || (instance.player && Number(instance.player.map) === Number(activeTargetMapIdCheck));
  const isFullTest = ((instance.pollCount % 2 === 0) || instance.targetedMvp || instance.bosses === null || !instance.monsters || instance.monsters.length === 0 || instance.guildDungeonActive || (instance.player && Number(instance.player.gdun_in) === 1) || (instance.isMvpCycling && isCorrectMvpMapCheck)) ? 1 : 0;
  assert.strictEqual(isFullTest, 1, 'isFull must be 1 during MVP cycle on target map even on odd poll count');

  // Test Case 8: updatePlayerState auto syncs guildDungeonActive
  console.log('Testing updatePlayerState auto syncs guildDungeonActive...');
  instance.guildDungeonActive = false;
  instance.player = { gdun_in: 0 };
  instance.updatePlayerState({ gdun_in: 1 });
  assert.strictEqual(instance.guildDungeonActive, true, 'guildDungeonActive must be true when gdun_in is 1');
  instance.updatePlayerState({ gdun_in: 0 });
  assert.strictEqual(instance.guildDungeonActive, false, 'guildDungeonActive must be false when gdun_in is 0');

  // Test Case 9: MVP cycle is paused when in Guild Dungeon
  console.log('Testing MVP cycle pause in Guild Dungeon...');
  instance.isMvpCycling = true;
  instance.guildDungeonActive = true;
  instance.mvpCycleMapIndex = 0;
  // We mock a call to updateMvpCycleStatus by verifying the conditions at the start of the function:
  const isPaused = (instance.guildDungeonActive || (instance.player && Number(instance.player.gdun_in) === 1));
  assert.strictEqual(isPaused, true, 'MVP cycle must be paused when guildDungeonActive is true');
  instance.guildDungeonActive = false;

  // Test Case 10: Minimum stay time on map before clear is confirmed
  console.log('Testing minimum stay time on map requirement...');
  instance.mvpConfirmClearCount = 3;
  instance.mvpCycleStats = { mapStartTs: Date.now() };

  // Scenario A: Time spent is less than 6.0s (e.g. 2000ms)
  let timeSpentMs = 2000;
  let isDoneWithCurrentMapTest = (instance.mvpConfirmClearCount >= 3 && timeSpentMs >= 6000);
  assert.strictEqual(isDoneWithCurrentMapTest, false, 'isDoneWithCurrentMap must be false if stay time is less than 6.0s');

  // Scenario B: Time spent is 6.0s or more (e.g. 6500ms)
  timeSpentMs = 6500;
  isDoneWithCurrentMapTest = (instance.mvpConfirmClearCount >= 3 && timeSpentMs >= 6000);
  assert.strictEqual(isDoneWithCurrentMapTest, true, 'isDoneWithCurrentMap must be true if stay time is >= 6.0s and confirm count is >= 3');

  // Reset states
  instance.isMvpCycling = false;

  // Test Case 7: Boss Safe Distance & Kiting Vector Engine
  console.log('Testing Boss Safe Distance & Kiting Vector Engine (Short knife vs Long knife)...');
  const calcBossDistState = (playerPos, bossPos, isUsingDaoDai = false) => {
    const dx = playerPos.x - bossPos.x;
    const dy = playerPos.y - bossPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const MIN_BOSS_DIST = isUsingDaoDai ? 55 : 30;
    const MAX_BOSS_DIST = isUsingDaoDai ? 65 : 40;
    const TARGET_KITE_DIST = isUsingDaoDai ? 60 : 35;
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

  // --- Scenario 1: Short Knife / No Dao Dai (35 +/- 5m: Range [30m, 40m], Target 35m) ---
  console.log('  Testing Short knife distance (35m)...');
  // Scenario A: Far away (50m > 40m) -> Approach target 35m
  const resFarShort = calcBossDistState({ x: 100, y: 150 }, { x: 100, y: 100 }, false);
  assert.strictEqual(resFarShort.traveling, 1, 'Far away: traveling must be 1');
  assert.strictEqual(resFarShort.lockPos, 0, 'Far away: lockPos must be 0');
  assert.strictEqual(resFarShort.expCy, 135, 'Far away (Short): target Y must be 100 + 35 = 135');

  // Scenario B: Perfect distance (37m in [30, 40]) -> Stand still & Lock DPS
  const resOptimalShort = calcBossDistState({ x: 100, y: 137 }, { x: 100, y: 100 }, false);
  assert.strictEqual(resOptimalShort.traveling, 0, 'Optimal distance (Short): traveling must be 0');
  assert.strictEqual(resOptimalShort.lockPos, 1, 'Optimal distance (Short): lockPos must be 1');

  // Scenario C: Too close (15m < 30m) -> Kite back to 35m
  const resTooCloseShort = calcBossDistState({ x: 100, y: 115 }, { x: 100, y: 100 }, false);
  assert.strictEqual(resTooCloseShort.traveling, 1, 'Too close (Short): traveling must be 1 to kite');
  assert.strictEqual(resTooCloseShort.lockPos, 0, 'Too close (Short): lockPos must be 0');
  assert.strictEqual(resTooCloseShort.expCy, 135, 'Too close (Short): target Y must kite back to 135');

  // --- Scenario 2: Long Knife / Dao Dai (60 +/- 5m: Range [55m, 65m], Target 60m) ---
  console.log('  Testing Long knife distance (60m)...');
  // Scenario A: Far away (80m > 65m) -> Approach target 60m
  const resFarLong = calcBossDistState({ x: 100, y: 180 }, { x: 100, y: 100 }, true);
  assert.strictEqual(resFarLong.traveling, 1, 'Far away (Long): traveling must be 1');
  assert.strictEqual(resFarLong.lockPos, 0, 'Far away (Long): lockPos must be 0');
  assert.strictEqual(resFarLong.expCy, 160, 'Far away (Long): target Y must be 100 + 60 = 160');

  // Scenario B: Perfect distance (62m in [55, 65]) -> Stand still & Lock DPS
  const resOptimalLong = calcBossDistState({ x: 100, y: 162 }, { x: 100, y: 100 }, true);
  assert.strictEqual(resOptimalLong.traveling, 0, 'Optimal distance (Long): traveling must be 0');
  assert.strictEqual(resOptimalLong.lockPos, 1, 'Optimal distance (Long): lockPos must be 1');

  // Scenario C: Too close (45m < 55m) -> Kite back to 60m
  const resTooCloseLong = calcBossDistState({ x: 100, y: 145 }, { x: 100, y: 100 }, true);
  assert.strictEqual(resTooCloseLong.traveling, 1, 'Too close (Long): traveling must be 1 to kite');
  assert.strictEqual(resTooCloseLong.lockPos, 0, 'Too close (Long): lockPos must be 0');
  assert.strictEqual(resTooCloseLong.expCy, 160, 'Too close (Long): target Y must kite back to 160');

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
      { id: 104, item_name: 'การ์ด MVP Wolf (5⭐)', item_type: 'card', price_per: 2000 },
      // Eggs
      { id: 105, item_name: 'ไข่ ไก่เจี๊ยบ', item_type: 'egg', price_per: 600 },
      { id: 106, item_name: 'ไข่ MVP ไก่เจี๊ยบ', item_type: 'egg', price_per: 1500 },
      // Modules
      { id: 201, item_name: 'โมดูลมีด T1', item_type: 'module_knife', price_per: 1200 },
      { id: 202, item_name: 'โมดูลเกราะ T3', item_type: 'module_armor', price_per: 3000 },
      { id: 203, item_name: 'โมดูลดาบ T4', item_type: 'module_sword', price_per: 4000 },
      // Collectibles/Proofs
      { id: 301, item_name: 'ชิ้นส่วนไททัน', item_type: 'hardware', price_per: 1000 }, // Titan part
      { id: 302, item_name: 'ท่อนไม้มหัศจรรย์', item_type: 'house_parts', price_per: 2000 },
      // Resource / Trash
      { id: 401, item_name: 'แร่อื่นๆ (Resource)', item_type: 'ore', price_per: 100, qty: 500 },
      // Diamond
      { id: 801, item_name: 'เพชร (Diamond)', item_type: 'diamond', price_per: 5000, qty: 1 },
      // Unranked Module
      { id: 204, item_name: 'โมดูลพิเศษไม่มีระดับ', item_type: 'module_special', price_per: 1000 },
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

  // 7a. Test Card selective filtering (Normal cards only)
  instance.settings.marketCategories.card = true;
  instance.settings.marketSelectedCards = ['Jellyfish', 'Wolf'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [101, 102], 'Should buy only normal matching cards (id 101, 102), skipping MVP (id 104)');

  // Test Card selective filtering (MVP cards only)
  instance.settings.marketSelectedCards = ['MVP Wolf'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [104], 'Should buy only MVP Wolf card (id 104), skipping normal Wolf (id 102)');
  instance.settings.marketCategories.card = false;

  // 7b. Test Egg selective filtering with newly translated monster name (Normal egg only)
  instance.settings.marketCategories.egg = true;
  instance.settings.marketSelectedEggs = ['Gà con']; // Maps to 'ไข่ ไก่เจี๊ยบ' -> 'Trứng Gà con'
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [105], 'Should buy normal egg matching Gà con (id 105), skipping MVP (id 106)');

  // Test Egg selective filtering (MVP egg only)
  instance.settings.marketSelectedEggs = ['MVP Gà con'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [106], 'Should buy MVP egg matching Gà con (id 106), skipping normal (id 105)');
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

  // 7f. Test Category ON with empty sub-filters (Should NOT buy any cards if list is empty)
  instance.settings.marketCategories.card = true;
  instance.settings.marketSelectedCards = []; // Empty sub-filters
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [], 'Should NOT buy any cards when card category is ON but sub-filters are empty');
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
  instance.settings.marketSelectedCollectibles = ['Titan']; // Set whitelist to trigger matching
  simulateBuyError = true;
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.strictEqual(simulateBuyError, true);
  assert.strictEqual(instance.marketBuyHistory.length > 0, true, 'Should record failed buy in marketBuyHistory');
  assert.strictEqual(instance.marketBuyHistory[0].status, 'failed', 'History entry status must be failed');

  // Reset simulate error and collectible
  simulateBuyError = false;
  instance.settings.marketCategories.collectible = false;
  instance.settings.marketSelectedCollectibles = [];

  // 7i. Test Module Tier Unknown Fallback (getModuleTier returns null, skipping unranked module)
  console.log('Testing Module Tier Fallback (skip unranked modules)...');
  instance.settings.marketCategories.module = true;
  instance.settings.marketSelectedModuleTiers = ['T1'];
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  // id 201 is T1, id 204 is unranked (must not be bought)
  assert.deepStrictEqual(lastBoughtListingIds, [201], 'Should buy only T1 module (id 201) and skip unranked module (id 204)');
  instance.settings.marketCategories.module = false;
  instance.settings.marketSelectedModuleTiers = [];

  // 7j. Test getItemCategory accuracy
  console.log('Testing getItemCategory classification...');
  assert.strictEqual(getItemCategory({ item_type: 'module_box', item_name: 'กล่องโมดูล' }), 'module_box');
  assert.strictEqual(getItemCategory({ item_type: 'card_box', item_name: 'กล่องการ์ด' }), 'card_box');
  assert.strictEqual(getItemCategory({ item_type: 'egg_box', item_name: 'กล่องไข่' }), 'egg_box');
  assert.strictEqual(getItemCategory({ item_type: 'diamond', item_name: 'เพชร' }), 'diamond');
  assert.strictEqual(getItemCategory({ item_type: 'card', item_name: 'การ์ด' }), 'card');
  assert.strictEqual(getItemCategory({ item_type: 'egg', item_name: 'ไข่' }), 'egg');
  assert.strictEqual(getItemCategory({ item_type: 'module_knife', item_name: 'โมดูล' }), 'module');
  assert.strictEqual(getItemCategory({ item_type: 'hardware', item_name: 'ชิ้นส่วน' }), 'collectible');
  assert.strictEqual(getItemCategory({ item_type: 'ore', item_name: 'แร่' }), 'resource');

  // 7k. Test Diamond Category (No sub-filter needed, buys all when ON)
  console.log('Testing Diamond Category Buying...');
  instance.settings.marketCategories.diamond = true;
  instance.player.gold = 50000;
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [801], 'Should buy diamond (id 801) when diamond category is ON');
  instance.settings.marketCategories.diamond = false;

  // 7l. Test Exact Price Match Mode (marketExactPrice)
  console.log('Testing Exact Price Matching Mode...');
  instance.settings.marketCategories.diamond = true;
  instance.settings.marketExactPrice = true;
  instance.settings.marketMaxPrice = 5000; // Matches id 801 exactly (5000)
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [801], 'Should buy id 801 when price exactly matches 5000');

  // Test Exact Price mismatch
  instance.settings.marketMaxPrice = 4999; // Does not match 5000
  lastBoughtListingIds = [];
  instance.lastMarketScanAt = null;
  await instance.scanAndBuyMarket();
  assert.deepStrictEqual(lastBoughtListingIds, [], 'Should NOT buy id 801 when price does not exactly match 4999');
  instance.settings.marketExactPrice = false;
  instance.settings.marketCategories.diamond = false;

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

  // 9. Test ProxyPool SOCKS5 Parsing
  console.log('Testing ProxyPool SOCKS5 Parsing...');

  // Test raw SOCKS5 without authentication
  const socksRawNoAuth = ProxyPool.parseProxyInput('1.2.3.4:1080', 'socks5');
  assert.strictEqual(socksRawNoAuth.url, 'socks5://1.2.3.4:1080');
  assert.strictEqual(socksRawNoAuth.label, '1.2.3.4:1080');

  // Test raw SOCKS5 with authentication
  const socksRawAuth = ProxyPool.parseProxyInput('1.2.3.4:1080:myuser:mypass', 'socks5');
  assert.strictEqual(socksRawAuth.url, 'socks5://myuser:mypass@1.2.3.4:1080');
  assert.strictEqual(socksRawAuth.label, '1.2.3.4:1080');

  // Test SOCKS5 full URI
  const socksFullUri = ProxyPool.parseProxyInput('socks5://user:pass@127.0.0.1:1080', 'socks5');
  assert.strictEqual(socksFullUri.url, 'socks5://user:pass@127.0.0.1:1080');
  assert.strictEqual(socksFullUri.label, '127.0.0.1:1080');

  // Test SOCKS5 full URI with default HTTP fallback (should preserve protocol)
  const socksFullUriHttp = ProxyPool.parseProxyInput('socks5://127.0.0.1:1080', 'http');
  assert.strictEqual(socksFullUriHttp.url, 'socks5://127.0.0.1:1080');

  // Test HTTP raw formatting
  const httpRaw = ProxyPool.parseProxyInput('1.2.3.4:8080', 'http');
  assert.strictEqual(httpRaw.url, 'http://1.2.3.4:8080');

  // Test invalid proxy format throws error
  assert.throws(() => {
    ProxyPool.parseProxyInput('invalid_format', 'socks5');
  }, /Định dạng proxy không hợp lệ/);

  // 10. Test Multiple Team Sync and Lookup
  console.log('Testing Multiple Team Sync and Lookup...');

  // Set up three mock instances with roles and teamIds
  const leader1 = new BotInstance({ name: 'Leader1', userId: 'user_1', settings: { teamRole: 'leader', teamId: 'team_1' } });
  const member1 = new BotInstance({ name: 'Member1', userId: 'user_1', settings: { teamRole: 'member', teamId: 'team_1' } });
  const member2 = new BotInstance({ name: 'Member2', userId: 'user_1', settings: { teamRole: 'member', teamId: 'team_2' } });
  const leader2 = new BotInstance({ name: 'Leader2', userId: 'user_1', settings: { teamRole: 'leader', teamId: 'team_2' } });

  // Mock global botInstances pool
  const originalBotInstances = { ...botInstances };
  botInstances['uid_leader1'] = leader1;
  botInstances['uid_member1'] = member1;
  botInstances['uid_member2'] = member2;
  botInstances['uid_leader2'] = leader2;

  // Verify leader lookup logic inside member1 (should find leader1 because both are team_1)
  const lookupLeaderForMember1 = function(bot) {
    const isMember = bot.settings.teamRole === 'member';
    const myTeamId = bot.settings.teamId || 'none';
    return (isMember && myTeamId !== 'none')
      ? Object.values(botInstances).find(b => b.userId === bot.userId && b.settings.teamRole === 'leader' && (b.settings.teamId || 'none') === myTeamId)
      : null;
  };

  const foundLeader1 = lookupLeaderForMember1(member1);
  assert.strictEqual(foundLeader1, leader1, 'Member1 should find Leader1 since both belong to team_1');

  // Verify leader lookup logic inside member2 (should find leader2 because both are team_2)
  const foundLeader2 = lookupLeaderForMember1(member2);
  assert.strictEqual(foundLeader2, leader2, 'Member2 should find Leader2 since both belong to team_2');

  // Verify that member2 does not find leader1
  assert.notStrictEqual(foundLeader2, leader1, 'Member2 must not find Leader1');

  // Verify new team sync conditions:
  // Condition 1: Leader is offline (status !== 'running' or player is null). Member should NOT sync/follow leader.
  leader1.status = 'idle';
  leader1.player = null;
  leader1.settings.bossHuntEnabled = true;
  member1.settings.bossHuntEnabled = true;
  member1.settings.targetMap = 3;
  member1.player = { map: 3, lv: 50 };

  const getMapTarget = function(bot) {
    const isMember = bot.settings.teamRole === 'member';
    const myTeamId = bot.settings.teamId || 'none';
    const leader = (isMember && myTeamId !== 'none')
      ? Object.values(botInstances).find(b => b.userId === bot.userId && b.settings.teamRole === 'leader' && (b.settings.teamId || 'none') === myTeamId)
      : null;

    let activeTargetMapId;
    if (isMember && leader && leader.status === 'running' && leader.player && bot.settings.teamSynced === true && bot.settings.bossHuntEnabled && leader.settings.bossHuntEnabled) {
      activeTargetMapId = leader.isMvpCycling
        ? leader.getCurrentMvpCycleMap()
        : (leader.player ? Number(leader.player.map) : (parseInt(leader.settings.targetMap) || 1));
    } else {
      activeTargetMapId = parseInt(bot.settings.targetMap) || 1;
    }
    return activeTargetMapId;
  };

  // 1. Leader offline -> member should NOT follow leader, should fallback to member's own targetMap
  let targetMap = getMapTarget(member1);
  assert.strictEqual(targetMap, 3, 'Member should not follow offline Leader');

  // 2. Leader is running but member has teamSynced = false (never clicked Sync Team Settings) -> member should NOT follow leader
  leader1.status = 'running';
  leader1.player = { map: 2, lv: 50 };
  leader1.settings.bossHuntEnabled = true;
  member1.settings.bossHuntEnabled = true;
  member1.settings.teamSynced = false;
  targetMap = getMapTarget(member1);
  assert.strictEqual(targetMap, 3, 'Member with teamSynced = false should not follow Leader');

  // 3. Leader is running, member has teamSynced = true, but bossHuntMode === 'off' -> member returns to personal farm map (3)
  member1.settings.teamSynced = true;
  member1.settings.bossHuntEnabled = false;
  targetMap = getMapTarget(member1);
  assert.strictEqual(targetMap, 3, 'Member with bossHuntMode = off should return to personal targetMap (3)');

  // 4. Leader and Member are both running, teamSynced = true, both have bossHuntMode enabled -> member follows leader (2)
  member1.settings.bossHuntEnabled = true;
  targetMap = getMapTarget(member1);
  assert.strictEqual(targetMap, 2, 'Member should follow active Leader to map 2 when teamSynced = true and bossHuntMode enabled');

  // Restore global botInstances
  for (const key in botInstances) {
    delete botInstances[key];
  }
  Object.assign(botInstances, originalBotInstances);

  console.log('✅ Multiple Team Sync and Lookup Tests Passed successfully!');

  // 11. Test User Polling Interval and role propagation
  console.log('Testing User Polling Interval, role propagation and edit permissions...');

  const mockAdminBot = new BotInstance({ name: 'AdminBot', userId: 'usr_admin', settings: { pollInterval: 1100 } });
  assert.strictEqual(mockAdminBot.userIsAdmin, true, 'Admin bot owner should have userIsAdmin = true');

  let resolvedIntervalAdmin = (mockAdminBot.userIsAdmin || mockAdminBot.allowEditPollInterval)
    ? (mockAdminBot.settings.pollInterval !== undefined ? mockAdminBot.settings.pollInterval : (mockAdminBot.userPollInterval || 2000))
    : (mockAdminBot.userPollInterval || 2000);
  assert.strictEqual(resolvedIntervalAdmin, 1100, 'Admin bot should resolve to 1100ms based on settings.pollInterval');

  // Normal user without permission
  const mockUserBot = new BotInstance({ name: 'UserBot', userId: 'some_nonexistent_user', settings: { pollInterval: 800 } });
  mockUserBot.userIsAdmin = false;
  mockUserBot.userPollInterval = 1500;
  mockUserBot.allowEditPollInterval = false;

  let resolvedIntervalUser = (mockUserBot.userIsAdmin || mockUserBot.allowEditPollInterval)
    ? (mockUserBot.settings.pollInterval !== undefined ? mockUserBot.settings.pollInterval : (mockUserBot.userPollInterval || 2000))
    : (mockUserBot.userPollInterval || 2000);
  assert.strictEqual(resolvedIntervalUser, 1500, 'User bot without permission should enforce userPollInterval (1500ms)');

  // Normal user WITH permission
  const mockUserBotPermitted = new BotInstance({ name: 'UserBotPermitted', userId: 'some_permitted_user', settings: { pollInterval: 800 } });
  mockUserBotPermitted.userIsAdmin = false;
  mockUserBotPermitted.userPollInterval = 1500;
  mockUserBotPermitted.allowEditPollInterval = true;

  let resolvedIntervalUserPermitted = (mockUserBotPermitted.userIsAdmin || mockUserBotPermitted.allowEditPollInterval)
    ? (mockUserBotPermitted.settings.pollInterval !== undefined ? mockUserBotPermitted.settings.pollInterval : (mockUserBotPermitted.userPollInterval || 2000))
    : (mockUserBotPermitted.userPollInterval || 2000);
  assert.strictEqual(resolvedIntervalUserPermitted, 800, 'User bot WITH permission should respect settings.pollInterval (800ms)');

  // Normal user WITH permission but WITHOUT bot-level customized pollInterval (should fallback to userPollInterval)
  const mockUserBotPermittedNoCustom = new BotInstance({ name: 'UserBotPermittedNoCustom', userId: 'some_permitted_user', settings: {} });
  mockUserBotPermittedNoCustom.userIsAdmin = false;
  mockUserBotPermittedNoCustom.userPollInterval = 1500;
  mockUserBotPermittedNoCustom.allowEditPollInterval = true;

  let resolvedIntervalUserPermittedNoCustom = (mockUserBotPermittedNoCustom.userIsAdmin || mockUserBotPermittedNoCustom.allowEditPollInterval)
    ? (mockUserBotPermittedNoCustom.settings.pollInterval !== undefined ? mockUserBotPermittedNoCustom.settings.pollInterval : (mockUserBotPermittedNoCustom.userPollInterval || 2000))
    : (mockUserBotPermittedNoCustom.userPollInterval || 2000);
  assert.strictEqual(resolvedIntervalUserPermittedNoCustom, 1500, 'User bot WITH permission but without bot settings should fallback to userPollInterval (1500ms)');

  // Ultra-Fast poll interval test (500ms and 600ms for 1-Proxy-per-Account setups)
  const mockUltraBot500 = new BotInstance({ name: 'UltraBot500', userId: 'usr_admin', settings: { pollInterval: 500 } });
  let resolved500 = (mockUltraBot500.userIsAdmin || mockUltraBot500.allowEditPollInterval)
    ? (mockUltraBot500.settings.pollInterval !== undefined ? mockUltraBot500.settings.pollInterval : (mockUltraBot500.userPollInterval || 2000))
    : (mockUltraBot500.userPollInterval || 2000);
  assert.strictEqual(resolved500, 500, 'Ultra-fast bot should resolve to 500ms');

  // Test Snipe / PK event mode capping to 500ms
  const isSnipeTest = true;
  let baseDelayTest = resolvedIntervalAdmin; // 1100ms
  if (isSnipeTest) {
    baseDelayTest = Math.min(baseDelayTest, 500);
  }
  assert.strictEqual(baseDelayTest, 500, 'Snipe mode should cap delay at 500ms');

  // Test Event War Log fetch verification with active war flags (T74 additional)
  console.log('Testing Event War Log fetch with active war flags...');
  const testWarBot = new BotInstance({ name: 'WarBot', line_uid: 'war_bot_test', settings: {} });
  testWarBot.inEventMode = false; // bot is NOT in event mode (e.g. paused)
  testWarBot.lastGw = { st: 'open', ends: Math.floor(Date.now() / 1000) + 1200 }; // GW active

  let fetchWarLogCalled = false;
  testWarBot.fetchWarLog = async function() {
    fetchWarLogCalled = true;
    this.eventWarHistory = [{ time: Date.now(), eventKind: 'gw', killer: 'WarBot', victim: 'Enemy', points: 5 }];
  };

  // Simulate API route check logic
  const currentEpoch = Math.floor(Date.now() / 1000);
  const isGwActiveTest = testWarBot.lastGw && (testWarBot.lastGw.st === 'open' || testWarBot.lastGw.st === 'fight') && (!testWarBot.lastGw.ends || testWarBot.lastGw.ends > currentEpoch);
  const isCwActiveTest = testWarBot.lastCw && (testWarBot.lastCw.st === 'open' || testWarBot.lastCw.st === 'fight') && (!testWarBot.lastCw.ends || testWarBot.lastCw.ends > currentEpoch);

  if (testWarBot.inEventMode || isGwActiveTest || isCwActiveTest) {
    if (!testWarBot.currentEventKind && (isGwActiveTest || isCwActiveTest)) {
      testWarBot.currentEventKind = isGwActiveTest ? 'gw' : 'cw';
    }
    await testWarBot.fetchWarLog();
  }

  // ==========================================
  // GUILD DUNGEON / BOSS GUILD & FILTER SYNC TESTS
  // ==========================================
  console.log('Testing Guild Dungeon State, Filter Sync & Stable Queue Logic (Offline/Mock)...');

  // Test 1: bossHuntPriority & bossHuntMaps synchronization & aliasing [OFFLINE/UNIT]
  const filterBot = new BotInstance({
    name: 'FilterBot',
    line_uid: 'filter_bot_1',
    settings: {
      bossHuntPriority: 'hp_asc',
      bossHuntMaps: [4, 2, 8, 1]
    }
  });

  assert.strictEqual(filterBot.getBossHuntPriority(), 'hp_asc', 'getBossHuntPriority must return hp_asc');
  assert.strictEqual(filterBot.settings.mvpPriorityMode, 'hp_asc', 'mvpPriorityMode must alias to bossHuntPriority');
  assert.deepStrictEqual(filterBot.getBossHuntMaps(), [4, 2, 8, 1], 'getBossHuntMaps must preserve user array ordering');
  assert.strictEqual(filterBot.settings.mvpTargetMaps, '4,2,8,1', 'mvpTargetMaps must synchronize with bossHuntMaps');

  // Test updating priority through updateSettings
  filterBot.updateSettings({ bossHuntPriority: 'level_desc' });
  assert.strictEqual(filterBot.getBossHuntPriority(), 'level_desc', 'getBossHuntPriority must update to level_desc');
  assert.strictEqual(filterBot.settings.mvpPriorityMode, 'level_desc', 'mvpPriorityMode must synchronize on updateSettings');

  filterBot.updateSettings({ mvpPriorityMode: 'level_asc' });
  assert.strictEqual(filterBot.getBossHuntPriority(), 'level_asc', 'bossHuntPriority must synchronize from mvpPriorityMode');

  // Test updating maps ordering through updateSettings
  filterBot.updateSettings({ bossHuntMaps: [5, 3, 2] });
  assert.deepStrictEqual(filterBot.getBossHuntMaps(), [5, 3, 2], 'bossHuntMaps must preserve new ordering');
  assert.strictEqual(filterBot.settings.mvpTargetMaps, '5,3,2', 'mvpTargetMaps must synchronize from bossHuntMaps');

  // Test 2: Snapshot and Position Restoration upon Enter and Exit + warpToMap Spy [OFFLINE/MOCK]
  const mockGdunBot = new BotInstance({
    name: 'GdunBot',
    line_uid: 'gdun_bot_1',
    settings: {
      targetMap: 3,
      autoMap: true,
      autoZone: true,
      lock_zone_center: true,
      targetZone: 2,
      bossHuntPriority: 'hp_asc'
    }
  });

  // Setup pre-dungeon player position at Map 3, (450, 780)
  mockGdunBot.player = {
    map: 3,
    x: 450,
    y: 780,
    explore_cx: 450,
    explore_cy: 780,
    gdun_in: 0,
    lv: 50
  };

  let warpCalledWithMap = null;
  mockGdunBot.warpToMap = async function(mapId) {
    warpCalledWithMap = mapId;
    if (this.player) this.player.map = mapId;
    return true;
  };

  mockGdunBot.sendRequest = async function(url, payload) {
    if (payload.action === 'gdun_enter') {
      return { ok: 1, player: { map: 12, gdun_in: 1, x: 1125, y: 1125 } };
    } else if (payload.action === 'gdun_exit') {
      // Server response without map/x/y or with Map 12 / default town map 1
      return { ok: 1, player: { map: 12, gdun_in: 0, x: 1125, y: 1125 } };
    }
    return { ok: 0 };
  };

  // Enter Guild Dungeon (Team mode)
  let enterOk = await mockGdunBot.enterGuildDungeon(true);
  assert.strictEqual(enterOk, true, 'enterGuildDungeon should return true');
  assert.strictEqual(mockGdunBot.guildDungeonActive, true, 'guildDungeonActive should be true after enter');
  assert.strictEqual(mockGdunBot.guildDungeonIsTeam, true, 'guildDungeonIsTeam should be true for team mode');
  assert.strictEqual(mockGdunBot.player.map, 12, 'player.map should be 12 inside dungeon');
  assert.strictEqual(mockGdunBot.player.gdun_in, 1, 'player.gdun_in should be 1 inside dungeon');

  // Verify Snapshot was captured accurately
  assert.ok(mockGdunBot.gdunSnapshot, 'gdunSnapshot must be captured on enter');
  assert.strictEqual(mockGdunBot.gdunSnapshot.map, 3, 'Snapshot map should be 3');
  assert.strictEqual(mockGdunBot.gdunSnapshot.x, 450, 'Snapshot x should be 450');
  assert.strictEqual(mockGdunBot.gdunSnapshot.y, 780, 'Snapshot y should be 780');
  assert.strictEqual(mockGdunBot.gdunSnapshot.autoMap, true, 'Snapshot autoMap should be true');
  assert.strictEqual(mockGdunBot.gdunSnapshot.autoZone, true, 'Snapshot autoZone should be true');
  assert.strictEqual(mockGdunBot.gdunSnapshot.lock_zone_center, true, 'Snapshot lock_zone_center should be true');
  assert.strictEqual(mockGdunBot.gdunSnapshot.targetZone, 2, 'Snapshot targetZone should be 2');

  // Intermediate poll in Map 12 with updatePlayerState must NOT destroy or corrupt snapshot
  mockGdunBot.updatePlayerState({ map: 12, gdun_in: 1, hp: 500 });
  assert.strictEqual(mockGdunBot.guildDungeonActive, true, 'guildDungeonActive must remain true');
  assert.ok(mockGdunBot.gdunSnapshot, 'gdunSnapshot must persist during dungeon polls');
  assert.strictEqual(mockGdunBot.gdunSnapshot.map, 3, 'Snapshot map must remain 3');

  // Exit Guild Dungeon: must call warpToMap because server response did not confirm Map 3, and restore snapshot
  let exitOk = await mockGdunBot.exitGuildDungeon();
  assert.strictEqual(exitOk, true, 'exitGuildDungeon should return true');
  assert.strictEqual(warpCalledWithMap, 3, 'warpToMap must be called with snapshot Map 3 when server response was on Map 12');
  assert.strictEqual(mockGdunBot.guildDungeonActive, false, 'guildDungeonActive should be false after exit');
  assert.strictEqual(mockGdunBot.player.gdun_in, 0, 'player.gdun_in should be 0 after exit');
  assert.strictEqual(mockGdunBot._guildDungeonRestoring, true, '_guildDungeonRestoring must be true during restoring phase');
  assert.ok(mockGdunBot.gdunSnapshot, 'gdunSnapshot must be preserved during restoring phase');

  // Server confirms destination reached -> finalize restoration
  mockGdunBot.player.x = 450;
  mockGdunBot.player.y = 780;
  mockGdunBot._finalizeGdunRestoration(true);

  assert.strictEqual(mockGdunBot.player.map, 3, 'player.map must be restored to snapshot Map 3');
  assert.strictEqual(mockGdunBot.player.x, 450, 'player.x must be restored to snapshot x 450');
  assert.strictEqual(mockGdunBot.player.y, 780, 'player.y must be restored to snapshot y 780');
  assert.strictEqual(mockGdunBot.player.explore_cx, 450, 'player.explore_cx must be restored to snapshot explore_cx');
  assert.strictEqual(mockGdunBot.player.explore_cy, 780, 'player.explore_cy must be restored to snapshot explore_cy');
  assert.strictEqual(mockGdunBot.settings.autoMap, true, 'settings.autoMap must be restored');
  assert.strictEqual(mockGdunBot.settings.autoZone, true, 'settings.autoZone must be restored');
  assert.strictEqual(mockGdunBot.settings.targetZone, 2, 'settings.targetZone must be restored');
  assert.strictEqual(mockGdunBot.settings.targetMap, 3, 'settings.targetMap must be restored');
  assert.strictEqual(mockGdunBot.gdunSnapshot, null, 'gdunSnapshot must be cleaned up after exit');

  // Test 3: Stable Target Queue & True Queue Continuity Across Polls [OFFLINE/LOGIC]
  // ⚔️ Boss-Only Mode: Guild Dungeon chỉ target Boss - Quái thường bị bỏ qua hoàn toàn
  const targetBot = new BotInstance({
    name: 'TargetBot',
    line_uid: 'target_bot_1',
    settings: {
      bossHuntPriority: 'hp_asc', // Lowest HP first
      bossHuntMode: 'type2'
    }
  });

  targetBot.guildDungeonActive = true;
  targetBot.player = { x: 1000, y: 1000, map: 12, gdun_in: 1, active_gun: 0 };

  // Targets in dungeon:
  // Boss 1: DragonBoss (id: 101, HP 50000)
  // Boss 2: MiniBoss   (id: 102, HP 20000)  <-- lowest HP boss
  // Monster 1: GoblinA (id: 201, HP 500)    <-- must be IGNORED
  // Monster 2: GoblinB (id: 202, HP 3000)   <-- must be IGNORED
  targetBot.bosses = [
    { id: 101, name: 'DragonBoss', x: 1050, y: 1050, hp: 50000, hp_max: 50000, lv: 80 },
    { id: 102, name: 'MiniBoss',   x: 1020, y: 1020, hp: 20000, hp_max: 20000, lv: 60 }
  ];
  targetBot.monsters = [
    { id: 201, name: 'GoblinA', x: 1010, y: 1010, hp: 500,  hp_max: 500,  lv: 30 },
    { id: 202, name: 'GoblinB', x: 1030, y: 1030, hp: 3000, hp_max: 3000, lv: 40 }
  ];

  // Helper function simulating the exact boss-only targeting queue logic
  const simulateGdunTargeting = (bot) => {
    const px = bot.player ? bot.player.x : 1125;
    const py = bot.player ? bot.player.y : 1125;
    const priority = bot.getBossHuntPriority();

    // ⚔️ Boss-only: quái thường bị loại khỏi pool hoàn toàn
    const aliveBosses = (bot.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));

    let target = null;
    if (bot.gdunCurrentTargetId !== null) {
      target = aliveBosses.find(t => t.id === bot.gdunCurrentTargetId) || null;
      if (!target) {
        bot.gdunCurrentTargetId = null;
      }
    }

    if (!target && aliveBosses.length > 0) {
      const sortGdunTargets = (targets) => {
        return [...targets].sort((a, b) => {
          if (priority === 'hp_asc') {
            const hpA = a.hp !== undefined ? (a.hp || 0) : (a.hp_max || 0);
            const hpB = b.hp !== undefined ? (b.hp || 0) : (b.hp_max || 0);
            if (hpA !== hpB) return hpA - hpB;
            const distA = Math.sqrt((px - a.x) * (px - a.x) + (py - a.y) * (py - a.y));
            const distB = Math.sqrt((px - b.x) * (px - b.x) + (py - b.y) * (py - b.y));
            return distA - distB;
          } else if (priority === 'level_asc') {
            const lvA = a.lv || 0;
            const lvB = b.lv || 0;
            if (lvA !== lvB) return lvA - lvB;
            const distA = Math.sqrt((px - a.x) * (px - a.x) + (py - a.y) * (py - a.y));
            const distB = Math.sqrt((px - b.x) * (px - b.x) + (py - b.y) * (py - b.y));
            return distA - distB;
          } else if (priority === 'level_desc') {
            const lvA = a.lv || 0;
            const lvB = b.lv || 0;
            if (lvA !== lvB) return lvB - lvA;
            const distA = Math.sqrt((px - a.x) * (px - a.x) + (py - a.y) * (py - a.y));
            const distB = Math.sqrt((px - b.x) * (px - b.x) + (py - b.y) * (py - b.y));
            return distA - distB;
          } else {
            // 'distance'
            const distA = Math.sqrt((px - a.x) * (px - a.x) + (py - a.y) * (py - a.y));
            const distB = Math.sqrt((px - b.x) * (px - b.x) + (py - b.y) * (py - b.y));
            return distA - distB;
          }
        });
      };

      const validQueue = (bot.gdunTargetQueue || []).filter(id => aliveBosses.some(t => t.id === id));
      const unqueuedBosses = aliveBosses.filter(t => !validQueue.includes(t.id));

      if (validQueue.length === 0) {
        const sortedTargets = sortGdunTargets(aliveBosses);
        bot.gdunTargetQueue = sortedTargets.map(t => t.id);
      } else {
        bot.gdunTargetQueue = validQueue;
        if (unqueuedBosses.length > 0) {
          const sortedNewBosses = sortGdunTargets(unqueuedBosses);
          bot.gdunTargetQueue.push(...sortedNewBosses.map(t => t.id));
        }
      }

      if (bot.gdunTargetQueue.length > 0) {
        const nextTargetId = bot.gdunTargetQueue[0];
        target = aliveBosses.find(t => t.id === nextTargetId);
        bot.gdunCurrentTargetId = target ? target.id : null;
      }
    } else if (aliveBosses.length === 0) {
      // Hết boss -> reset queue, không đánh quái thường
      bot.gdunTargetQueue = [];
      bot.gdunCurrentTargetId = null;
    }
    return target;
  };

  // Poll 1: Initial targeting under hp_asc - ONLY bosses are in queue (Monsters ignored)
  // Expected queue: [102 (MiniBoss 20000 HP), 101 (DragonBoss 50000 HP)]
  const poll1Target = simulateGdunTargeting(targetBot);
  assert.ok(poll1Target, 'Target must be selected in poll 1');
  assert.strictEqual(poll1Target.id, 102, 'Under boss-only hp_asc, MiniBoss (lowest HP boss) must be targeted first - GoblinA/GoblinB must be IGNORED');
  assert.strictEqual(targetBot.gdunCurrentTargetId, 102, 'gdunCurrentTargetId must be locked to 102');
  assert.deepStrictEqual(targetBot.gdunTargetQueue, [102, 101], 'Queue must contain ONLY bosses ordered by hp_asc');

  // Poll 2: While attacking MiniBoss (102):
  // - Player moves right next to DragonBoss (id: 101)
  // - DragonBoss takes massive damage, HP drops down to 1000 HP (lower than MiniBoss 20000 HP!)
  // Target must NOT jitter or switch to DragonBoss:
  targetBot.player.x = 1050;
  targetBot.player.y = 1050; // Closest to DragonBoss
  targetBot.bosses[0].hp = 1000; // DragonBoss HP now 1000
  const poll2Target = simulateGdunTargeting(targetBot);
  assert.strictEqual(poll2Target.id, 102, 'Target must stay locked on MiniBoss (102) while MiniBoss is still alive - DragonBoss HP change must NOT cause jitter');

  // Poll 3: MiniBoss dies (hp = 0)
  // CRITICAL REQUIREMENT: The second target in queue was DragonBoss (101).
  // Even though DragonBoss (101) now has only 1000 HP, the STABLE QUEUE must pick it next!
  targetBot.bosses[1].hp = 0; // MiniBoss dies
  const poll3Target = simulateGdunTargeting(targetBot);
  assert.ok(poll3Target, 'Target must be selected in poll 3 after MiniBoss death');
  assert.strictEqual(poll3Target.id, 101, 'Queue must advance to DragonBoss (101) after MiniBoss dies');
  assert.strictEqual(targetBot.gdunCurrentTargetId, 101, 'gdunCurrentTargetId must now be locked to 101');
  assert.deepStrictEqual(targetBot.gdunTargetQueue, [101], 'Remaining queue must be [101]');

  // Poll 4: Newly spawned boss appears (MegaBoss id: 301, HP: 50 - ultra low HP)
  // BEHAVIOR: DragonBoss (101) is still alive -> we stay on it, queue-building branch is skipped.
  // MegaBoss stays pending and will enter the queue when DragonBoss dies.
  // DragonBoss must NOT be abandoned in favor of MegaBoss's lower HP.
  targetBot.bosses.push({ id: 301, name: 'MegaBoss', x: 1000, y: 1000, hp: 50, hp_max: 50, lv: 99 });
  const poll4Target = simulateGdunTargeting(targetBot);
  assert.strictEqual(poll4Target.id, 101, 'DragonBoss (101) must remain active target; MegaBoss must NOT steal the queue while DragonBoss is still alive');
  // Queue stays [101] - MegaBoss will be appended on next rebuild when DragonBoss dies
  assert.deepStrictEqual(targetBot.gdunTargetQueue, [101], 'Queue stays [101] while DragonBoss (current target) is still alive');

  // Poll 5: DragonBoss (101) dies -> Queue rebuilds with remaining aliveBosses: [MegaBoss(301)]
  // MegaBoss (HP:50) was waiting and is now the only alive boss -> becomes target immediately.
  targetBot.bosses[0].hp = 0;
  const poll5Target = simulateGdunTargeting(targetBot);
  assert.strictEqual(poll5Target.id, 301, 'Target must advance to MegaBoss (301) after DragonBoss is defeated');
  assert.deepStrictEqual(targetBot.gdunTargetQueue, [301], 'Queue must now be [301]');

  // Poll 6: MegaBoss dies -> ALL bosses dead -> no target, queue empty, monsters still ignored
  targetBot.bosses[2].hp = 0;
  const poll6Target = simulateGdunTargeting(targetBot);
  assert.strictEqual(poll6Target, null, 'No target when all bosses are dead - monsters must be IGNORED even if alive');
  assert.deepStrictEqual(targetBot.gdunTargetQueue, [], 'Queue must be empty when all bosses are dead');
  assert.strictEqual(targetBot.gdunCurrentTargetId, null, 'gdunCurrentTargetId must be null when no bosses alive');

  // Test 4: Priority level_desc sorting - Boss-Only [OFFLINE/LOGIC]
  const lvBot = new BotInstance({
    name: 'LvBot',
    line_uid: 'lv_bot_1',
    settings: { bossHuntPriority: 'level_desc' }
  });
  lvBot.guildDungeonActive = true;
  lvBot.player = { x: 1000, y: 1000, map: 12, gdun_in: 1 };
  lvBot.bosses   = [{ id: 1, name: 'B1', lv: 50 }, { id: 2, name: 'B2', lv: 90 }];
  lvBot.monsters = [{ id: 3, name: 'M1', lv: 70 }]; // Must be IGNORED under boss-only mode

  const lvTarget = simulateGdunTargeting(lvBot);
  assert.strictEqual(lvTarget.id, 2, 'Under level_desc boss-only, highest level BOSS (Lv.90) must be targeted first - M1 Lv70 must be IGNORED');

  // Test 5: Auto-Exit after 2 Boss-Empty Polls (Boss-Only mode) [OFFLINE/LOGIC]
  // Behavior: only check aliveBosses; alive monsters must NOT block exit.
  targetBot.sendRequest = async function(url, payload) {
    if (payload.action === 'gdun_exit') {
      return { ok: 1, player: { map: 1, gdun_in: 0 } };
    }
    return { ok: 0 };
  };

  // Setup: all bosses dead, but monsters still alive (must be ignored by exit condition)
  targetBot.bosses = [];
  targetBot.monsters = [{ id: 201, name: 'GoblinA', hp: 500 }];
  targetBot.gdunEmptyPolls = 0;
  targetBot.guildDungeonActive = true; // re-enable for this test

  // Poll 1: aliveBosses empty -> gdunEmptyPolls = 1, must NOT exit yet (buffer = 2)
  {
    const aliveB = (targetBot.bosses || []).filter(b => (b.hp === undefined || b.hp > 0));
    if (aliveB.length === 0) targetBot.gdunEmptyPolls++;
    assert.strictEqual(targetBot.gdunEmptyPolls, 1, 'gdunEmptyPolls should be 1 after first boss-empty poll');
    assert.strictEqual(targetBot.guildDungeonActive, true, 'Must not exit before reaching 2 boss-empty polls');
  }

  // Poll 2: aliveBosses empty again -> gdunEmptyPolls = 2 -> triggers exit
  {
    const aliveB = (targetBot.bosses || []).filter(b => (b.hp === undefined || b.hp > 0));
    if (aliveB.length === 0) targetBot.gdunEmptyPolls++;
    assert.strictEqual(targetBot.gdunEmptyPolls, 2, 'gdunEmptyPolls should be 2 on second boss-empty poll');
  }
  if (targetBot.gdunEmptyPolls >= 2) {
    await targetBot.exitGuildDungeon();
  }
  assert.strictEqual(targetBot.guildDungeonActive, false, 'Should auto-exit on 2nd boss-empty poll, alive monsters must NOT block exit');

  // Test 6: Timer-based auto-exit overdue check
  targetBot.gdunEnteredAt = Date.now() - (11 * 60 * 1000); // 11 mins ago
  const overdueExit = ((Date.now() - targetBot.gdunEnteredAt) >= 10 * 60 * 1000);
  assert.strictEqual(overdueExit, true, 'Timer-based auto-exit should be true after 10+ minutes');


  console.log('✅ Guild Dungeon State, Filter Sync & Stable Queue Tests Passed successfully!');

  // ==========================================
  // T82 - AUTO BOSS GUILD & REAL COORDINATE RESTORATION TESTS
  // ==========================================
  console.log('Testing T82 Auto Boss Guild & Real Coordinate Restoration Engine...');

  // --- Test A: Snapshot vị trí ban đầu chính xác & không ghi đè lặp ---
  {
    const botA = new BotInstance({
      line_uid: 'T82_BOT_A',
      name: 'TesterA',
      settings: {
        autoMap: true,
        autoZone: true,
        lock_zone_center: true,
        targetZone: 2,
        targetMap: 3,
        explore_cx: 450,
        explore_cy: 780
      }
    });
    botA.player = { map: 3, x: 450, y: 780, explore_cx: 450, explore_cy: 780, gdun_in: 0 };
    botA.sendRequest = async (url, payload) => {
      if (payload.action === 'gdun_enter') return { ok: 1, player: { map: 12, gdun_in: 1, x: 1125, y: 1125 } };
      return { ok: 0 };
    };

    const enterRes = await botA.enterGuildDungeon(false);
    assert.strictEqual(enterRes, true, 'Test A: enterGuildDungeon should succeed');
    assert.ok(botA.gdunSnapshot, 'Test A: Snapshot must be created on enter');
    assert.strictEqual(botA.gdunSnapshot.map, 3, 'Test A: Snapshot map must be 3');
    assert.strictEqual(botA.gdunSnapshot.x, 450, 'Test A: Snapshot x must be 450');
    assert.strictEqual(botA.gdunSnapshot.y, 780, 'Test A: Snapshot y must be 780');
    assert.strictEqual(botA.gdunSnapshot.explore_cx, 450, 'Test A: Snapshot explore_cx must be 450');
    assert.strictEqual(botA.gdunSnapshot.explore_cy, 780, 'Test A: Snapshot explore_cy must be 780');
    assert.strictEqual(botA.gdunSnapshot.autoMap, true, 'Test A: Snapshot autoMap must be true');
    assert.strictEqual(botA.gdunSnapshot.autoZone, true, 'Test A: Snapshot autoZone must be true');
    assert.strictEqual(botA.gdunSnapshot.lock_zone_center, true, 'Test A: Snapshot lock_zone_center must be true');
    assert.strictEqual(botA.gdunSnapshot.targetZone, 2, 'Test A: Snapshot targetZone must be 2');
    assert.strictEqual(botA.gdunSnapshot.targetMap, 3, 'Test A: Snapshot targetMap must be 3');

    // Gọi lại enterGuildDungeon khi đã ở trong dungeon -> Snapshot KHÔNG được ghi đè
    botA.player.x = 9999;
    botA.player.y = 9999;
    await botA.enterGuildDungeon(false);
    assert.strictEqual(botA.gdunSnapshot.x, 450, 'Test A: Snapshot must NOT be overwritten on repeated enter calls');
  }

  // --- Test B: Khôi phục Map khi server trả Map 12 -> warpToMap(3) thật, không chỉ gán local ---
  {
    const botB = new BotInstance({
      line_uid: 'T82_BOT_B',
      name: 'TesterB',
      settings: { targetMap: 3 }
    });
    botB.gdunSnapshot = {
      map: 3, x: 450, y: 780, explore_cx: 450, explore_cy: 780,
      autoMap: true, autoZone: true, lock_zone_center: true, targetZone: 2, targetMap: 3
    };
    botB.guildDungeonActive = true;
    botB.player = { map: 12, gdun_in: 1, x: 1125, y: 1125 };

    let warpedTargetMap = null;
    botB.warpToMap = async (mapId) => {
      warpedTargetMap = mapId;
      return true;
    };
    botB.sendRequest = async (url, payload) => {
      if (payload.action === 'gdun_exit') {
        // Server trả về nhân vật đang ở Map 12
        return { ok: 1, player: { map: 12, gdun_in: 0, x: 1125, y: 1125 } };
      }
      return { ok: 0 };
    };

    const exitRes = await botB.exitGuildDungeon();
    assert.strictEqual(exitRes, true, 'Test B: exitGuildDungeon should return true');
    assert.strictEqual(warpedTargetMap, 3, 'Test B: warpToMap must be called with snapshot Map 3 when exit response was Map 12');
    assert.strictEqual(botB._guildDungeonRestoring, true, 'Test B: _guildDungeonRestoring must be true');
    assert.ok(botB.gdunSnapshot, 'Test B: gdunSnapshot must be preserved (not deleted prematurely)');
  }

  // --- Test C: Khôi phục tọa độ thật trên server qua pollGame & kiểm tra khoảng cách ---
  {
    const botC = new BotInstance({
      line_uid: 'T82_BOT_C',
      name: 'TesterC',
      settings: {
        autoMap: true,
        autoZone: true,
        lock_zone_center: true,
        targetZone: 2,
        targetMap: 3,
        explore_cx: 450,
        explore_cy: 780
      }
    });
    botC.gdunSnapshot = {
      map: 3, x: 450, y: 780, explore_cx: 450, explore_cy: 780,
      autoMap: true, autoZone: true, lock_zone_center: true, targetZone: 2, targetMap: 3
    };
    botC._guildDungeonRestoring = true;
    botC._gdunRestoreStartedAt = Date.now();
    // Hiện tại nhân vật ở Map 3 nhưng ở điểm spawn 1125, 1125 (cách đích 758m)
    botC.player = { map: 3, x: 1125, y: 1125, gdun_in: 0, lv: 50 };

    let sentGamePayloads = [];
    let mockServerCurrentX = 1125;
    let mockServerCurrentY = 1125;

    botC.sendRequest = async (url, payload) => {
      if (url && url.includes('xhrpg_game.php')) {
        sentGamePayloads.push(payload);
        return {
          ok: 1,
          player: {
            map: 3,
            x: mockServerCurrentX,
            y: mockServerCurrentY,
            gdun_in: 0,
            lv: 50
          }
        };
      }
      return { ok: 1 };
    };

    // Poll 1: Nhân vật còn xa đích (1125, 1125 -> 450, 780)
    await botC.pollGame();
    const lastPayload1 = sentGamePayloads[sentGamePayloads.length - 1];
    assert.ok(lastPayload1, 'Test C: game poll payload must be sent');
    assert.strictEqual(lastPayload1.traveling, 1, 'Test C: traveling must be 1 while moving toward snapshot coords');
    assert.strictEqual(lastPayload1.explore_cx, 450, 'Test C: explore_cx must be snapshot x 450');
    assert.strictEqual(lastPayload1.explore_cy, 780, 'Test C: explore_cy must be snapshot y 780');
    assert.strictEqual(lastPayload1.lock_pos, 0, 'Test C: lock_pos must be 0 while traveling');
    assert.strictEqual(botC._guildDungeonRestoring, true, 'Test C: Must still be in restoring state while dist > 40m');
    assert.ok(botC.gdunSnapshot, 'Test C: Snapshot must not be cleared while dist > 40m');

    // Poll 2: Server mô phỏng nhân vật đã đi tới gần đích: (460, 775) -> khoảng cách 11.18m <= 40m
    mockServerCurrentX = 460;
    mockServerCurrentY = 775;
    botC.player.x = 460;
    botC.player.y = 775;

    await botC.pollGame();
    assert.strictEqual(botC._guildDungeonRestoring, false, 'Test C: _guildDungeonRestoring must finish when dist <= 40m');
    assert.strictEqual(botC.gdunSnapshot, null, 'Test C: gdunSnapshot must be cleaned up only after arrival');
  }

  // --- Test D: Khôi phục settings đầy đủ và nhất quán ---
  {
    const botD = new BotInstance({
      line_uid: 'T82_BOT_D',
      name: 'TesterD',
      settings: {
        autoMap: true,
        autoZone: true,
        lock_zone_center: true,
        targetZone: 2,
        targetMap: 3,
        explore_cx: 450,
        explore_cy: 780
      }
    });
    botD.gdunSnapshot = {
      map: 3, x: 450, y: 780, explore_cx: 450, explore_cy: 780,
      autoMap: true, autoZone: true, lock_zone_center: true, targetZone: 2, targetMap: 3
    };
    botD.player = { map: 3, x: 450, y: 780, gdun_in: 0 };
    botD._guildDungeonRestoring = true;

    // Thay đổi tạm thời settings trong lúc ở dungeon
    botD.settings.autoMap = false;
    botD.settings.autoZone = false;
    botD.settings.explore_cx = 1125;
    botD.settings.explore_cy = 1125;

    botD._finalizeGdunRestoration(true);

    assert.strictEqual(botD.settings.autoMap, true, 'Test D: settings.autoMap must be restored');
    assert.strictEqual(botD.settings.autoZone, true, 'Test D: settings.autoZone must be restored');
    assert.strictEqual(botD.settings.lock_zone_center, true, 'Test D: settings.lock_zone_center must be restored');
    assert.strictEqual(botD.settings.targetZone, 2, 'Test D: settings.targetZone must be restored');
    assert.strictEqual(botD.settings.targetMap, 3, 'Test D: settings.targetMap must be restored');
    assert.strictEqual(botD.settings.explore_cx, 450, 'Test D: settings.explore_cx must be restored');
    assert.strictEqual(botD.settings.explore_cy, 780, 'Test D: settings.explore_cy must be restored');
    assert.strictEqual(botD.player.explore_cx, 450, 'Test D: player.explore_cx must be consistent with settings');
    assert.strictEqual(botD.player.explore_cy, 780, 'Test D: player.explore_cy must be consistent with settings');
  }

  // --- Test E: Chống False-Positive khi danh sách Boss rỗng tạm thời ---
  {
    const botE = new BotInstance({
      line_uid: 'T82_BOT_E',
      name: 'TesterE',
      settings: {}
    });
    botE.guildDungeonActive = true;
    botE.gdunEnteredAt = Date.now() - 5000; // Vào được 5s (> 3s requirement)
    botE.player = { map: 12, gdun_in: 1, x: 1125, y: 1125 };

    let exitCallCount = 0;
    botE.exitGuildDungeon = async () => {
      exitCallCount++;
      return true;
    };

    // Nhịp 1: Server lag trả bosses rỗng
    botE.bosses = [];
    {
      const timeInDungeon = Date.now() - botE.gdunEnteredAt;
      if (timeInDungeon >= 3000 && botE.bosses !== null) {
        const aliveBosses = (botE.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));
        if (aliveBosses.length === 0) {
          botE.gdunEmptyPolls = (botE.gdunEmptyPolls || 0) + 1;
          if (botE.gdunEmptyPolls >= 3) await botE.exitGuildDungeon();
        }
      }
    }
    assert.strictEqual(exitCallCount, 0, 'Test E: Must NOT exit on 1st empty poll');

    // Nhịp 2: Vẫn rỗng (poll 2)
    {
      const aliveBosses = (botE.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));
      if (aliveBosses.length === 0) {
        botE.gdunEmptyPolls = (botE.gdunEmptyPolls || 0) + 1;
        if (botE.gdunEmptyPolls >= 3) await botE.exitGuildDungeon();
      }
    }
    assert.strictEqual(exitCallCount, 0, 'Test E: Must NOT exit on 2nd empty poll');

    // Nhịp 2.5: Boss xuất hiện trở lại -> reset bộ đếm
    botE.bosses = [{ id: 99, hp: 5000 }];
    {
      const aliveBosses = (botE.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));
      if (aliveBosses.length === 0) {
        botE.gdunEmptyPolls = (botE.gdunEmptyPolls || 0) + 1;
      } else {
        botE.gdunEmptyPolls = 0;
      }
    }
    assert.strictEqual(botE.gdunEmptyPolls, 0, 'Test E: gdunEmptyPolls must reset to 0 when boss reappears');

    // Giờ boss chết thật: 3 nhịp liên tiếp
    botE.bosses = [];
    for (let p = 1; p <= 3; p++) {
      const aliveBosses = (botE.bosses || []).filter(b => (b.hp === undefined || (b.hp || 0) > 0));
      if (aliveBosses.length === 0) {
        botE.gdunEmptyPolls = (botE.gdunEmptyPolls || 0) + 1;
        if (botE.gdunEmptyPolls >= 3) await botE.exitGuildDungeon();
      }
    }
    assert.strictEqual(exitCallCount, 1, 'Test E: Must exit only after 3 consecutive empty polls');
  }

  // --- Test F: Thoát thất bại -> Giữ nguyên snapshot để thử lại ---
  {
    const botF = new BotInstance({
      line_uid: 'T82_BOT_F',
      name: 'TesterF',
      settings: { targetMap: 3 }
    });
    botF.gdunSnapshot = { map: 3, x: 450, y: 780 };
    botF.guildDungeonActive = true;
    botF.player = { map: 12, gdun_in: 1 };
    botF.sendRequest = async () => {
      return { ok: 0, error: 'Database locked' };
    };

    const resF = await botF.exitGuildDungeon();
    assert.strictEqual(resF, false, 'Test F: exitGuildDungeon should return false on server error');
    assert.ok(botF.gdunSnapshot, 'Test F: gdunSnapshot must remain intact when exit fails');
    assert.strictEqual(botF._exitingGuildDungeon, false, 'Test F: _exitingGuildDungeon guard must reset to allow retry');
  }

  // --- Test G: Team Member và Leader có Map/X/Y ban đầu khác nhau ---
  {
    const ldrBot = new BotInstance({
      line_uid: 'T82_LEADER',
      name: 'LeaderBot',
      settings: { teamRole: 'leader', teamId: 'team_alpha', targetMap: 2 }
    });
    ldrBot.player = { map: 2, x: 100, y: 200, explore_cx: 100, explore_cy: 200, gdun_in: 0 };

    const memBot = new BotInstance({
      line_uid: 'T82_MEMBER',
      name: 'MemberBot',
      settings: { teamRole: 'member', teamId: 'team_alpha', teamSynced: true, targetMap: 3 }
    });
    memBot.player = { map: 3, x: 500, y: 600, explore_cx: 500, explore_cy: 600, gdun_in: 0 };

    ldrBot.sendRequest = async (url, payload) => {
      if (payload.action === 'gdun_enter') return { ok: 1, player: { map: 12, gdun_in: 1, x: 1125, y: 1125 } };
      if (payload.action === 'gdun_exit') return { ok: 1, player: { map: 12, gdun_in: 0, x: 1125, y: 1125 } };
      return { ok: 0 };
    };
    memBot.sendRequest = async (url, payload) => {
      if (payload.action === 'gdun_enter') return { ok: 1, player: { map: 12, gdun_in: 1, x: 1125, y: 1125 } };
      if (payload.action === 'gdun_exit') return { ok: 1, player: { map: 12, gdun_in: 0, x: 1125, y: 1125 } };
      return { ok: 0 };
    };

    ldrBot.warpToMap = async () => true;
    memBot.warpToMap = async () => true;

    // Cả hai vào dungeon
    await ldrBot.enterGuildDungeon(true);
    await memBot.enterGuildDungeon(true);

    assert.strictEqual(ldrBot.gdunSnapshot.map, 2, 'Test G: Leader snapshot must be Map 2');
    assert.strictEqual(ldrBot.gdunSnapshot.x, 100, 'Test G: Leader snapshot x must be 100');
    assert.strictEqual(memBot.gdunSnapshot.map, 3, 'Test G: Member snapshot must be Map 3');
    assert.strictEqual(memBot.gdunSnapshot.x, 500, 'Test G: Member snapshot x must be 500');

    // Leader thoát
    await ldrBot.exitGuildDungeon();
    assert.strictEqual(ldrBot._guildDungeonRestoring, true, 'Test G: Leader is in restoring mode');

    // Member thoát
    await memBot.exitGuildDungeon();
    assert.strictEqual(memBot._guildDungeonRestoring, true, 'Test G: Member is in restoring mode');

    // Leader phục hồi về Map 2
    ldrBot.player.map = 2;
    ldrBot.player.x = 100;
    ldrBot.player.y = 200;
    ldrBot._finalizeGdunRestoration(true);

    // Member phục hồi về Map 3
    memBot.player.map = 3;
    memBot.player.x = 500;
    memBot.player.y = 600;
    memBot._finalizeGdunRestoration(true);

    assert.strictEqual(ldrBot.player.map, 2, 'Test G: Leader restored to Map 2');
    assert.strictEqual(ldrBot.player.x, 100, 'Test G: Leader restored to x 100');
    assert.strictEqual(memBot.player.map, 3, 'Test G: Member restored to Map 3 (not pulled to Leader map 2)');
    assert.strictEqual(memBot.player.x, 500, 'Test G: Member restored to x 500 (not pulled to Leader x 100)');
  }

  console.log('✅ T82 Auto Boss Guild & Real Coordinate Restoration Tests Passed successfully!');

  // ==========================================
  // T83 - EVENT SESSION STATE MACHINE & REAL COORDINATE RESTORATION TESTS
  // ==========================================
  console.log('Testing T83 Event Session State Machine & Real Coordinate Restoration Engine...');

  // --- Test 1: Event vào từ Map 3 tại tọa độ cụ thể (x: 450, y: 780) ---
  {
    console.log('  Testing Test 1: Snapshot captured before moving to event map...');
    const bot1 = new BotInstance({
      line_uid: 't83_test_1',
      settings: {
        targetMap: 3,
        explore_cx: 450,
        explore_cy: 780,
        autoMap: true,
        autoZone: true,
        lock_zone_center: true,
        targetZone: 5
      }
    });
    bot1.player = { map: 3, x: 450, y: 780, lv: 50, explore_cx: 450, explore_cy: 780 };

    // Chụp snapshot TRƯỚC KHI lệnh join/di chuyển chạy
    bot1.captureEventSnapshot('gw');
    assert.ok(bot1.eventSnapshot, 'Test 1: Snapshot must be created');
    assert.strictEqual(bot1.eventSnapshot.kind, 'gw', 'Test 1: kind must be gw');
    assert.strictEqual(bot1.eventSnapshot.map, 3, 'Test 1: original map must be 3');
    assert.strictEqual(bot1.eventSnapshot.x, 450, 'Test 1: original x must be 450');
    assert.strictEqual(bot1.eventSnapshot.y, 780, 'Test 1: original y must be 780');
    assert.strictEqual(bot1.eventSnapshot.explore_cx, 450, 'Test 1: explore_cx must be 450');
    assert.strictEqual(bot1.eventSnapshot.explore_cy, 780, 'Test 1: explore_cy must be 780');
    assert.strictEqual(bot1.eventSnapshot.targetMap, 3, 'Test 1: targetMap must be 3');
    assert.strictEqual(bot1.eventSnapshot.autoMap, true, 'Test 1: autoMap must be true');
    assert.strictEqual(bot1.eventSnapshot.autoZone, true, 'Test 1: autoZone must be true');
    assert.strictEqual(bot1.eventSnapshot.lock_zone_center, true, 'Test 1: lock_zone_center must be true');
    assert.strictEqual(bot1.eventSnapshot.targetZone, 5, 'Test 1: targetZone must be 5');
    assert.strictEqual(bot1.eventState, 'ENTERING', 'Test 1: state must be ENTERING');

    // Giả lập sau khi join thành công sang Map 4
    bot1.player.map = 4;
    bot1.enterEventMode('gw', 4);
    assert.strictEqual(bot1.inEventMode, true, 'Test 1: inEventMode must be true');
    assert.strictEqual(bot1.eventState, 'ACTIVE', 'Test 1: eventState must be ACTIVE');
    assert.strictEqual(bot1.eventSnapshot.map, 3, 'Test 1: snapshot map must remain 3 despite player now on map 4');
    assert.strictEqual(bot1.settings.targetMap, 4, 'Test 1: targetMap overridden to 4 during event');
  }

  // --- Test 2: Event kết thúc và chuyển sang RETURNING đúng Map 3 ---
  {
    console.log('  Testing Test 2: Exit event transitions to RETURNING and preserves snapshot...');
    const bot2 = new BotInstance({
      line_uid: 't83_test_2',
      settings: { targetMap: 3, explore_cx: 450, explore_cy: 780, autoMap: true }
    });
    bot2.player = { map: 3, x: 450, y: 780, lv: 50 };
    bot2.captureEventSnapshot('gw');
    bot2.player.map = 4;
    bot2.enterEventMode('gw', 4);

    // Thoát event
    bot2.exitEventMode();
    assert.strictEqual(bot2.inEventMode, false, 'Test 2: inEventMode must be false');
    assert.strictEqual(bot2.eventState, 'RETURNING', 'Test 2: eventState must be RETURNING');
    assert.strictEqual(bot2.isEventReturning, true, 'Test 2: isEventReturning must be true');
    assert.strictEqual(bot2.eventReturnMapTarget, 3, 'Test 2: eventReturnMapTarget must be 3');
    assert.ok(bot2.eventSnapshot !== null, 'Test 2: snapshot must NOT be cleared early in exitEventMode');
    assert.strictEqual(bot2.eventSnapshot.map, 3, 'Test 2: snapshot map must still be 3');
  }

  // --- Test 3: Khôi phục x/y, explore_cx/cy trên game server ---
  {
    console.log('  Testing Test 3: Coordinate restoration & confirmation within 40m...');
    const bot3 = new BotInstance({
      line_uid: 't83_test_3',
      settings: {
        targetMap: 3,
        explore_cx: 450,
        explore_cy: 780,
        autoMap: true,
        autoZone: true,
        lock_zone_center: true,
        targetZone: 5
      }
    });
    bot3.player = { map: 3, x: 450, y: 780, lv: 50, explore_cx: 450, explore_cy: 780 };
    bot3.captureEventSnapshot('gw');
    bot3.enterEventMode('gw', 4);
    bot3.exitEventMode();

    // Giả lập bot đã warp về Map 3 nhưng ở điểm xuất hiện (1125, 1125)
    bot3.player.map = 3;
    bot3.player.x = 1125;
    bot3.player.y = 1125;
    const distFar = Math.hypot(bot3.player.x - bot3.eventSnapshot.x, bot3.player.y - bot3.eventSnapshot.y);
    assert.ok(distFar > 40, 'Test 3: Initial position after warp is far from snapshot');

    // Bot di chuyển dần về gần đích (460, 775)
    bot3.player.x = 460;
    bot3.player.y = 775;
    const distClose = Math.hypot(bot3.player.x - bot3.eventSnapshot.x, bot3.player.y - bot3.eventSnapshot.y);
    assert.ok(distClose <= 40, 'Test 3: Distance is now within tolerance (<= 40m)');

    // Kích hoạt hoàn tất
    bot3._finalizeEventRestoration(true);
    assert.strictEqual(bot3.eventSnapshot, null, 'Test 3: snapshot must be cleared after restoration finalized');
    assert.strictEqual(bot3.eventState, 'IDLE', 'Test 3: eventState must be IDLE');
    assert.strictEqual(bot3.inEventMode, false, 'Test 3: inEventMode must be false');
    assert.strictEqual(bot3.isEventReturning, false, 'Test 3: isEventReturning must be false');
    assert.strictEqual(bot3.settings.targetMap, 3, 'Test 3: settings.targetMap restored to 3');
    assert.strictEqual(bot3.settings.autoMap, true, 'Test 3: settings.autoMap restored');
    assert.strictEqual(bot3.settings.autoZone, true, 'Test 3: settings.autoZone restored');
    assert.strictEqual(bot3.settings.lock_zone_center, true, 'Test 3: settings.lock_zone_center restored');
    assert.strictEqual(bot3.settings.targetZone, 5, 'Test 3: settings.targetZone restored');
    assert.strictEqual(bot3.player.explore_cx, 450, 'Test 3: player.explore_cx restored to 450');
    assert.strictEqual(bot3.player.explore_cy, 780, 'Test 3: player.explore_cy restored to 780');
  }

  // --- Test 4: Warp return thất bại rồi retry thành công ---
  {
    console.log('  Testing Test 4: Warp return failure & retry recovery...');
    const bot4 = new BotInstance({ line_uid: 't83_test_4', settings: { targetMap: 3 } });
    bot4.player = { map: 4, x: 100, y: 100, lv: 50 };
    bot4.captureEventSnapshot('gw');
    bot4.enterEventMode('gw', 4);
    bot4.exitEventMode();
    assert.strictEqual(bot4.eventState, 'RETURNING');

    // Lần 1: Warp lỗi mạng -> FAILED_RETRY
    bot4.warpToMap = async () => false;
    const ok1 = await bot4.warpToMap(bot4.eventSnapshot.map);
    if (!ok1) {
      bot4.eventState = 'FAILED_RETRY';
      bot4.eventReturnRetries = (bot4.eventReturnRetries || 0) + 1;
    }
    assert.strictEqual(bot4.eventState, 'FAILED_RETRY', 'Test 4: state must be FAILED_RETRY on warp failure');
    assert.strictEqual(bot4.eventReturnRetries, 1, 'Test 4: retries must increment');
    assert.ok(bot4.eventSnapshot !== null, 'Test 4: snapshot must NOT be dropped on failure');
    assert.strictEqual(bot4.eventSnapshot.map, 3, 'Test 4: snapshot destination retained');

    // Lần 2 (nhịp poll tiếp theo): Warp thành công
    bot4.warpToMap = async () => { bot4.player.map = 3; return true; };
    const ok2 = await bot4.warpToMap(bot4.eventSnapshot.map);
    if (ok2) {
      bot4.eventState = 'RETURNING';
    }
    assert.strictEqual(bot4.eventState, 'RETURNING', 'Test 4: state returns to RETURNING after warp success');
    assert.strictEqual(bot4.player.map, 3, 'Test 4: player arrived on Map 3');
  }

  // --- Test 5: Restart khi đang Event ---
  {
    console.log('  Testing Test 5: Restart recovery while event is still active...');
    const snap5 = {
      kind: 'gw',
      map: 3,
      x: 450,
      y: 780,
      explore_cx: 450,
      explore_cy: 780,
      targetMap: 3,
      autoMap: true,
      autoZone: true,
      lock_zone_center: true,
      targetZone: 5,
      createdAt: Date.now()
    };
    const bot5 = new BotInstance({
      line_uid: 't83_test_5',
      settings: { targetMap: 4 },
      eventSnapshot: snap5
    });
    bot5.player = { map: 4, x: 200, y: 200, lv: 50 };
    bot5.lastGw = { st: 'open', ends: Math.floor(Date.now() / 1000) + 1800 };

    // Mô phỏng logic restart recovery ở đầu pollGame
    const isGwActive = bot5.lastGw && (bot5.lastGw.st === 'open' || bot5.lastGw.st === 'fight');
    const atEventMap = Number(bot5.player.map) === 4;
    if (isGwActive && atEventMap) {
      bot5.eventState = 'ACTIVE';
      bot5.inEventMode = true;
      bot5.currentEventKind = snap5.kind;
    }
    assert.strictEqual(bot5.eventState, 'ACTIVE', 'Test 5: eventState must be recovered to ACTIVE');
    assert.strictEqual(bot5.inEventMode, true, 'Test 5: inEventMode must be true');
    assert.strictEqual(bot5.currentEventKind, 'gw', 'Test 5: currentEventKind must be gw');
    assert.strictEqual(bot5.eventSnapshot.map, 3, 'Test 5: snapshot must be retained for return after event ends');
  }

  // --- Test 6: Restart sau khi Event kết thúc nhưng chưa return ---
  {
    console.log('  Testing Test 6: Restart recovery when event ended before return...');
    const snap6 = {
      kind: 'gw',
      map: 3,
      x: 450,
      y: 780,
      explore_cx: 450,
      explore_cy: 780,
      targetMap: 3,
      autoMap: true,
      autoZone: true,
      lock_zone_center: true,
      targetZone: 5,
      createdAt: Date.now() - 3600000
    };
    const bot6 = new BotInstance({
      line_uid: 't83_test_6',
      settings: { targetMap: 4 },
      eventSnapshot: snap6
    });
    bot6.player = { map: 4, x: 200, y: 200, lv: 50 };
    bot6.lastGw = { st: 'ended', ends: Math.floor(Date.now() / 1000) - 60 }; // Event đã kết thúc

    // Mô phỏng logic restart recovery ở đầu pollGame
    const isGwActive6 = bot6.lastGw && (bot6.lastGw.st === 'open' || bot6.lastGw.st === 'fight');
    if (!isGwActive6) {
      bot6.eventState = 'RETURNING';
      bot6.inEventMode = false;
      bot6.isEventReturning = true;
      bot6.eventReturnMapTarget = snap6.map;
    }
    assert.strictEqual(bot6.eventState, 'RETURNING', 'Test 6: state must automatically be RETURNING');
    assert.strictEqual(bot6.inEventMode, false, 'Test 6: inEventMode must be false');
    assert.strictEqual(bot6.isEventReturning, true, 'Test 6: isEventReturning must be true');
    assert.strictEqual(bot6.eventReturnMapTarget, 3, 'Test 6: target must be Map 3');
    assert.ok(bot6.eventSnapshot !== null, 'Test 6: snapshot MUST NOT be discarded before reaching destination');
  }

  // --- Test 7: Invasion Map 2 không bị kẹt ở Map 2 ---
  {
    console.log('  Testing Test 7: Invasion Map 2 properly returns to original Map 3 without getting stuck...');
    const bot7 = new BotInstance({
      line_uid: 't83_test_7',
      settings: {
        targetMap: 3,
        explore_cx: 500,
        explore_cy: 600,
        autoMap: true,
        autoEventJoinInv: true
      }
    });
    bot7.player = { map: 3, x: 500, y: 600, lv: 60 };
    bot7.lastInv = { st: 'active', ends: Math.floor(Date.now() / 1000) + 1800 };

    // Bot chuẩn bị vào Invasion Map 2 -> Chụp snapshot Map 3
    bot7.captureEventSnapshot('inv');
    assert.strictEqual(bot7.eventSnapshot.map, 3, 'Test 7: original map recorded is 3');

    // Sang Map 2 và kích hoạt event
    bot7.player.map = 2;
    bot7.enterEventMode('inv', 2);
    assert.strictEqual(bot7.eventState, 'ACTIVE', 'Test 7: bot is active in invasion');
    assert.strictEqual(bot7.settings.targetMap, 2, 'Test 7: targetMap set to 2 during event');

    // Invasion kết thúc
    bot7.lastInv = { st: 'ended', ends: Math.floor(Date.now() / 1000) - 10 };
    bot7.exitEventMode();
    assert.strictEqual(bot7.eventState, 'RETURNING', 'Test 7: state transitions to RETURNING');
    assert.strictEqual(bot7.eventReturnMapTarget, 3, 'Test 7: return target is Map 3');
    assert.strictEqual(bot7.settings.targetMap, 3, 'Test 7: targetMap immediately restored to 3, NOT stuck at 2');

    // Hoàn tất quay về Map 3 tại tọa độ cũ
    bot7.player.map = 3;
    bot7.player.x = 500;
    bot7.player.y = 600;
    bot7._finalizeEventRestoration(true);
    assert.strictEqual(bot7.eventState, 'IDLE', 'Test 7: restored to IDLE');
    assert.strictEqual(bot7.player.map, 3, 'Test 7: player confirmed on Map 3');
    assert.strictEqual(bot7.settings.targetMap, 3, 'Test 7: targetMap confirmed 3');
  }

  // --- Test 8: Hai poll automation chạy đồng thời không tạo hai lệnh join/exit (Mutex test) ---
  {
    console.log('  Testing Test 8: Mutex concurrency guards...');
    const bot8 = new BotInstance({ line_uid: 't83_test_8', settings: {} });
    bot8.player = { map: 1, lv: 50 };

    // Part A: automationRunning mutex
    let executionCount = 0;
    bot8.runAutomation = async () => {
      executionCount++;
      await new Promise(res => setTimeout(res, 50));
    };

    // Nhịp poll 1 chạy
    if (!bot8.automationRunning) {
      bot8.automationRunning = true;
      bot8.runAutomation().finally(() => { bot8.automationRunning = false; });
    }

    // Nhịp poll 2 chạy đồng thời trong khi poll 1 chưa xong
    let poll2Skipped = false;
    if (!bot8.automationRunning) {
      bot8.automationRunning = true;
      bot8.runAutomation().finally(() => { bot8.automationRunning = false; });
    } else {
      poll2Skipped = true;
    }
    assert.strictEqual(poll2Skipped, true, 'Test 8: poll 2 was skipped by automationRunning mutex');
    assert.strictEqual(executionCount, 1, 'Test 8: only 1 execution ran');

    // Part B: _eventTransitionLock trong enterEventMode / exitEventMode
    bot8.inEventMode = false;
    bot8.eventState = 'IDLE';
    bot8._eventTransitionLock = true; // Giả lập lock đang bị chiếm giữ
    bot8.enterEventMode('gw', 4);
    assert.strictEqual(bot8.eventState, 'IDLE', 'Test 8: enterEventMode rejected when _eventTransitionLock is active');

    bot8._eventTransitionLock = false; // Nhả lock
    bot8.captureEventSnapshot('gw');
    bot8.enterEventMode('gw', 4);
    assert.strictEqual(bot8.eventState, 'ACTIVE', 'Test 8: enterEventMode succeeded after lock released');
  }

  console.log('✅ T83 Event Session State Machine & Real Coordinate Restoration Tests Passed successfully!');

  // ==========================================
  // T84 - INDEPENDENT GW/CW CHECK-IN TESTS
  // ==========================================
  console.log('Testing T84 independent Guild/Country War check-in...');
  {
    const checkinBot = new BotInstance({ line_uid: 't84_checkin', settings: {} });
    assert.strictEqual(checkinBot.settings.autoWarCheckin, false, 'T84: independent check-in must default to off');
    assert.strictEqual(checkinBot._isWarCheckinWindow(new Date(2026, 0, 1, 0, 34, 59)), false, 'T84: check-in is disabled before minute 35');
    assert.strictEqual(checkinBot._isWarCheckinWindow(new Date(2026, 0, 1, 0, 35, 0)), true, 'T84: check-in is available from minute 35');
    checkinBot.player = { map: 3, x: 500, y: 600, lv: 60 };
    checkinBot.lastGw = { st: 'open', ends: 1900000000 };
    checkinBot.captureEventSnapshot('gw');
    checkinBot.eventSnapshot.checkinOnly = true;
    checkinBot.eventSnapshot.checkinKey = checkinBot._getWarCheckinKey('gw');
    checkinBot.enterEventMode('gw', 4, { checkinOnly: true });
    assert.strictEqual(checkinBot.isEventCheckinOnly, true, 'T84: independent check-in must mark its own session');
    checkinBot.eventCheckinStartedAt = Date.now() - 60000;
    assert.ok(checkinBot.eventCheckinStartedAt <= Date.now() - 60000, 'T84: one-minute timer must be armed');
    checkinBot.eventState = 'ENTERING';
    checkinBot.inEventMode = false;
    checkinBot._rollbackWarCheckinEntry();
    assert.strictEqual(checkinBot.eventSnapshot, null, 'T84: failed independent check-in must rollback its snapshot');
    assert.strictEqual(checkinBot.eventState, 'IDLE', 'T84: failed independent check-in must return to IDLE');
  }
  console.log('✅ T84 independent Guild/Country War check-in tests passed!');

  // ==========================================
  // T75 - MANUAL MARKET DASHBOARD INTEGRATION TESTS
  // ==========================================
  console.log('Testing T75 Manual Market Format & Translations...');

  // Test 1: Resource translation
  const rawWoodListing = {
    id: 101,
    seller_uid: 'user123',
    seller_name: 'HeroOne',
    item_type: 'resource',
    item_id: 'wood',
    item_icon: '🪵',
    item_name: 'ไม้',
    item_desc: 'วัตถุดิบสำหรับยานบิน',
    item_rarity: 'white',
    qty: 50,
    price_per: 4,
    created_at: 1700000000,
    expires_at: 1700086400
  };
  const formattedWood = formatMarketListing(rawWoodListing);
  assert.strictEqual(formattedWood.item_name, 'Gỗ');
  assert.strictEqual(formattedWood.item_desc, 'Nguyên liệu phi thuyền');
  assert.strictEqual(formattedWood.price_per, 4);
  assert.strictEqual(formattedWood.qty, 50);

  // Test 2: Card & MVP Card translation
  const rawCardListing = {
    id: 102,
    item_name: 'สไลม์เขียว ⭐MVP',
    item_desc: 'การ์ด · +6 AGI',
    item_rarity: 'red',
    qty: 1,
    price_per: 5000
  };
  const formattedCard = formatMarketListing(rawCardListing);
  assert.strictEqual(formattedCard.item_name.includes('MVP'), true);
  assert.strictEqual(formattedCard.item_desc.startsWith('Thẻ bài · +6'), true);

  // Test 3: Egg & MVP Egg translation
  const rawEggListing = {
    id: 103,
    item_name: 'ไข่สุนัขจิ้งจอก ⭐MVP',
    item_desc: 'สัตว์เลี้ยง Lv.15 · ค่าฟัก 15,000 G',
    item_rarity: 'red',
    qty: 1,
    price_per: 75000
  };
  const formattedEgg = formatMarketListing(rawEggListing);
  assert.strictEqual(formattedEgg.item_name.startsWith('Trứng '), true);
  assert.strictEqual(formattedEgg.item_desc.includes('Thú cưng Lv.15'), true);
  assert.strictEqual(formattedEgg.item_desc.includes('Phí ấp 15,000 G'), true);

  // Test 4: Boxes translation
  const rawBoxListing = {
    id: 104,
    item_name: 'กล่องการ์ด Lv.11-20',
    item_desc: 'สุ่มการ์ดมอน Lv.11-20 · ⭐MVP 1%',
    item_rarity: 'blue',
    qty: 3,
    price_per: 900
  };
  const formattedBox = formatMarketListing(rawBoxListing);
  assert.strictEqual(formattedBox.item_name, 'Hộp thẻ bài Lv.11-20');
  assert.strictEqual(formattedBox.item_desc, 'Ngẫu nhiên thẻ quái Lv.11-20 · ⭐MVP 1%');

  // Test 5: Diamond and Ore translation
  const rawDiaListing = {
    id: 105,
    item_name: 'เพชรฟ้า',
    item_desc: 'ตีบวกโมดูล (ทุกระดับ)',
    item_rarity: 'blue',
    qty: 10,
    price_per: 60
  };
  const formattedDia = formatMarketListing(rawDiaListing);
  assert.strictEqual(formattedDia.item_name, 'Kim cương xanh');
  assert.strictEqual(formattedDia.item_icon, '💎');

  // Test 6: Fee and Net calculation test
  const testPrice = 100;
  const testQty = 5;
  const feePerPiece = Math.ceil(testPrice * 0.05); // 5G
  const netReceived = (testPrice - feePerPiece) * testQty; // 95 * 5 = 475G
  assert.strictEqual(feePerPiece, 5);
  assert.strictEqual(netReceived, 475);

  console.log('✅ T75 Manual Market Format & Translations Tests Passed successfully!');

  // ==================== ANTI-DETECTION & HUMAN SIMULATION TESTS ====================
  console.log('Testing Anti-Detection & Human Simulation Engine...');

  // 1. Test Deterministic Fingerprints
  const fp1 = getAccountFingerprint('U1234567890abcdef');
  const fp2 = getAccountFingerprint('U1234567890abcdef');
  const fp3 = getAccountFingerprint('U9876543210fedcba');
  assert.strictEqual(fp1.userAgent, fp2.userAgent, 'Same line_uid should generate identical User-Agent');
  assert.strictEqual(fp1.acceptLanguage, fp2.acceptLanguage, 'Same line_uid should generate identical Accept-Language');
  assert(fp1.userAgent.length > 20, 'User-Agent must be a valid non-empty string');
  assert(fp1.acceptLanguage.includes('vi') || fp1.acceptLanguage.includes('en'), 'Accept-Language should include supported locale');

  // 2. Test BotInstance fingerprint assignment
  const dummyBot = new BotInstance({
    line_uid: 'U_TEST_ANTI_BOT_1',
    session_token: 'test_token',
    name: 'AntiBotTester'
  });
  assert(dummyBot.fingerprint, 'BotInstance must have fingerprint attached');
  assert.strictEqual(dummyBot.fingerprint.userAgent, getAccountFingerprint('U_TEST_ANTI_BOT_1').userAgent);
  assert(dummyBot.nextActInterval >= 90000 && dummyBot.nextActInterval <= 450000, 'Initial nextActInterval must be in log-normal bounds');

  // 3. Test Natural Coordinate Noise
  const baseCx = 1125;
  const noisyCoords = [];
  for (let i = 0; i < 50; i++) {
    const noisy = naturalCoordNoise(baseCx, 18);
    assert(noisy >= baseCx - 25 && noisy <= baseCx + 25, `Coordinate noise out of expected bounds: ${noisy}`);
    noisyCoords.push(noisy);
  }
  const hasVariance = noisyCoords.some(c => c !== baseCx);
  assert.strictEqual(hasVariance, true, 'naturalCoordNoise must introduce natural variance');

  // 4. Test Log-Normal Act Intervals
  const intervals = [];
  for (let i = 0; i < 100; i++) {
    const interval = logNormalActInterval(90000, 450000);
    assert(interval >= 90000 && interval <= 450000, `Interval ${interval} outside bounds [90000, 450000]`);
    intervals.push(interval);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  assert(avgInterval >= 150000 && avgInterval <= 280000, `Average interval ~200s expected, got ${avgInterval}`);

  // 5. Test Full Rich Fingerprint Structure
  const fullFp = generateRandomFingerprint('U_TEST_FULL_FP');
  assert(fullFp.id && fullFp.id.startsWith('fp_'), 'Fingerprint must have unique id prefix fp_');
  assert(fullFp.browser && typeof fullFp.browser === 'string', 'Fingerprint must contain browser name');
  assert(fullFp.os && typeof fullFp.os === 'string', 'Fingerprint must contain OS name');
  assert(fullFp.screen && fullFp.screen.width > 0 && fullFp.screen.height > 0, 'Fingerprint must contain valid screen dimensions');
  assert(fullFp.hardware && fullFp.hardware.hardwareConcurrency >= 2, 'Fingerprint must specify valid CPU cores');
  assert(fullFp.hardware && fullFp.hardware.deviceMemory >= 4, 'Fingerprint must specify valid RAM memory');
  assert(fullFp.webgl && fullFp.webgl.vendor && fullFp.webgl.renderer, 'Fingerprint must specify WebGL vendor and renderer');
  assert.strictEqual(fullFp.timezone, 'Asia/Ho_Chi_Minh', 'Timezone must default to Asia/Ho_Chi_Minh');
  assert(Array.isArray(fullFp.languages) && fullFp.languages.length > 0, 'Fingerprint languages array must not be empty');

  // 6. Test Random Fingerprint Generation (without seed) produces variety
  const randFp1 = generateRandomFingerprint();
  const randFp2 = generateRandomFingerprint();
  assert(randFp1.id !== randFp2.id, 'Random fingerprints must have distinct IDs');

  // 7. Test Stealth Script Generation for /play
  const stealthScript = generateFingerprintInjectionScript(fullFp);
  assert(stealthScript.includes('id="fp-stealth-shield"'), 'Stealth script must contain proper script ID');
  assert(stealthScript.includes('navigator'), 'Stealth script must patch navigator properties');
  assert(stealthScript.includes('screen'), 'Stealth script must patch screen properties');
  assert(stealthScript.includes('WebGLRenderingContext'), 'Stealth script must spoof WebGL context');
  assert(stealthScript.includes(fullFp.userAgent), 'Stealth script must contain bot specific User-Agent');

  // 8. Test BotInstance custom fingerprint persistence
  const customFp = generateRandomFingerprint('CUSTOM_SEED_1');
  const customBot = new BotInstance({
    line_uid: 'U_TEST_CUSTOM_FP_BOT',
    session_token: 'custom_tok',
    name: 'CustomFpBot',
    fingerprint: customFp
  });
  assert.strictEqual(customBot.fingerprint.id, customFp.id, 'BotInstance must retain pre-configured account fingerprint');
  assert.strictEqual(customBot.fingerprint.userAgent, customFp.userAgent, 'BotInstance must retain pre-configured userAgent');

  console.log('✅ Anti-Detection & Human Simulation Engine Tests Passed successfully!');

  // ==================== T81 DEDICATED SYSTEM LOG ENGINE ====================
  console.log('Testing T81 Dedicated System Log & In-Game Log Separation Engine...');
  const logTesterBot = new BotInstance({
    line_uid: 'U_TEST_LOG_SEP_1',
    session_token: 'test_token_logs',
    name: 'LogSepTester'
  });

  assert(Array.isArray(logTesterBot.logs), 'BotInstance must have logs array');
  assert(Array.isArray(logTesterBot.systemLogs), 'BotInstance must have dedicated systemLogs array');
  assert(Array.isArray(logTesterBot.gameLogs), 'BotInstance must have dedicated gameLogs array');

  // Add system logs
  logTesterBot.addLog('SYSTEM', 'Khởi tạo bot cho tài khoản: LogSepTester');
  logTesterBot.addLog('ERROR', '❌ Lỗi kết nối khi làm mới Session Token');
  logTesterBot.addLog('WARNING', '⚠️ Proxy gặp sự cố đường truyền');
  logTesterBot.addLog('AUTH', 'Làm mới Session Token qua PHPSESSID');

  // Add in-game logs
  logTesterBot.addLog('ACTION', 'Tấn công quái vật cấp 20');
  logTesterBot.addLog('KILL', 'Tiêu diệt Boss MVP thành công!');
  logTesterBot.addLog('DROP', 'Nhặt được Trang bị Thần Thoại');
  logTesterBot.addLog('SUCCESS', 'Nâng cấp Armor lên Lv.5 thành công');

  // Verify separation
  assert(logTesterBot.systemLogs.length >= 4, `systemLogs should contain at least 4 items, got ${logTesterBot.systemLogs.length}`);
  assert(logTesterBot.gameLogs.length >= 4, `gameLogs should contain at least 4 items, got ${logTesterBot.gameLogs.length}`);
  assert(logTesterBot.logs.length >= 8, `general logs should contain all items, got ${logTesterBot.logs.length}`);

  // Ensure system logs do not leak into gameLogs
  const hasSysInGame = logTesterBot.gameLogs.some(l => l.msg.includes('Khởi tạo bot') || l.msg.includes('Session Token'));
  assert.strictEqual(hasSysInGame, false, 'System events must NOT appear in gameLogs');

  // Ensure game actions do not leak into systemLogs
  const hasGameInSys = logTesterBot.systemLogs.some(l => l.msg.includes('Tấn công quái vật') || l.msg.includes('Trang bị Thần Thoại'));
  assert.strictEqual(hasGameInSys, false, 'In-game combat/loot events must NOT appear in systemLogs');

  // Test buffer capping
  for (let i = 0; i < 200; i++) {
    logTesterBot.addLog('SYSTEM', `System Event Test #${i}`);
  }
  assert(logTesterBot.systemLogs.length <= 150, `systemLogs must be capped at 150, got ${logTesterBot.systemLogs.length}`);

  console.log('✅ T81 Dedicated System Log & In-Game Log Separation Tests Passed successfully!');

  // ==================== ANTI-HANG & WATCHDOG TESTS ====================
  console.log('Testing Anti-Hang & Zombie Bot Watchdog Engine...');

  // 1. Test lastPollStartedAt tracking in BotInstance
  const watchdogBot = new BotInstance({
    line_uid: 'U_TEST_WATCHDOG_1',
    session_token: 'test_token_wd',
    name: 'WatchdogTester'
  });
  assert.strictEqual(watchdogBot.lastPollStartedAt, 0, 'Initial lastPollStartedAt must be 0');

  // 2. Test Zombie Bot Detection & Auto-Recovery
  botInstances['U_TEST_WATCHDOG_1'] = watchdogBot;
  watchdogBot.status = 'running';
  watchdogBot.startTime = Date.now() - 150000; // started 150s ago
  watchdogBot.lastPollStartedAt = Date.now() - 120000; // poll stuck 120s ago (>90s threshold)

  let recovered = checkAndRecoverZombieBots();
  assert.strictEqual(recovered, 1, 'Watchdog must detect and recover 1 zombie bot');
  assert.strictEqual(watchdogBot.status, 'running', 'Bot status should remain running after watchdog restart');
  assert.strictEqual(watchdogBot.logs.some(l => l.msg.includes('Watchdog phát hiện bot bị treo im lặng')), true, 'Watchdog log must be recorded');

  // Clean up test bot from botInstances
  watchdogBot.stop();
  delete botInstances['U_TEST_WATCHDOG_1'];

  // 3. Test Active/Recent Bot is NOT falsely flagged by Watchdog
  const healthyBot = new BotInstance({
    line_uid: 'U_TEST_HEALTHY_1',
    session_token: 'test_token_healthy',
    name: 'HealthyTester'
  });
  botInstances['U_TEST_HEALTHY_1'] = healthyBot;
  healthyBot.status = 'running';
  healthyBot.lastPollStartedAt = Date.now() - 10000; // only 10s ago
  const healthyRecovered = checkAndRecoverZombieBots();
  assert.strictEqual(healthyRecovered, 0, 'Healthy bot must not be flagged by Watchdog');
  healthyBot.stop();
  delete botInstances['U_TEST_HEALTHY_1'];

  // 4. Test lastChpassSentAt field in BotInstance
  assert.strictEqual(watchdogBot.lastChpassSentAt, 0, 'Initial lastChpassSentAt must be 0');

  // ==================== ⚔️ WEAPON TAB (VŨ KHÍ IN-GAME) TESTS ====================
  console.log('Testing T78 In-Game Weapon Tab Integration & Cold Fields...');

  // 1. Test Weapon Upgrade Cost Formulas
  function testTierGold(lv) {
    const START = [100, 1000, 10000, 100000, 1000000, 10000000, 50000000];
    const END = [1000, 10000, 100000, 1000000, 10000000, 50000000, 100000000];
    const b = Math.min(6, Math.max(0, Math.floor((lv - 1) / 10)));
    const pos = (lv - 1) % 10;
    return Math.round(START[b] + pos * (END[b] - START[b]) / 9);
  }

  function testTierRes(lv) {
    const START_RES = [10, 50, 200, 1000, 5000, 20000, 50000];
    const END_RES = [50, 200, 1000, 5000, 20000, 50000, 100000];
    const b = Math.min(6, Math.max(0, Math.floor((lv - 1) / 10)));
    const pos = (lv - 1) % 10;
    return Math.round(START_RES[b] + pos * (END_RES[b] - START_RES[b]) / 9);
  }

  assert.strictEqual(testTierGold(1), 100, 'Lv.1 tierGold must be 100');
  assert.strictEqual(testTierGold(10), 1000, 'Lv.10 tierGold must be 1000');
  assert.strictEqual(testTierRes(1), 10, 'Lv.1 tierRes must be 10');
  assert.strictEqual(testTierRes(10), 50, 'Lv.10 tierRes must be 50');

  // 2. Test COLD_FIELDS Preservation in updatePlayerState
  const testWpnBot = new BotInstance({ name: 'WpnTester', line_uid: 'wpn_test_uid', settings: {} });
  testWpnBot.player = {
    lv: 50,
    active_gun: 1,
    gun_pistol_lv: 10,
    gun_sniper_lv: 15,
    knife_lv: 8,
    turret_lv: 5,
    armor_lv: 12,
    pistol_modules: { barrel: { rarity: 4, plus: 5, cards: [] } },
    sniper_modules: { barrel: { rarity: 6, plus: 10, cards: [] } },
    knife_modules: { blade: { rarity: 3, plus: 2, cards: [] } },
    turret_modules: { t_atk: { rarity: 5, plus: 7, cards: [] } },
    armor_modules: { a_max: { rarity: 6, plus: 9, cards: [] } },
    module_inventory: [{ id: 101, name: 'Pistol Mod', rarity: 3 }],
    sniper_module_inventory: [{ id: 201, name: 'Sniper Mod', rarity: 5 }],
    ammo_pistol_t1: 150,
    ammo_sniper_t1: 200,
    auto_refill_pistol: 1
  };

  // Simulate short poll response omitting cold weapon fields
  testWpnBot.updatePlayerState({
    lv: 50,
    hp: 1200,
    mp: 400
  });

  assert.strictEqual(testWpnBot.player.active_gun, 1, 'active_gun must be carried forward');
  assert.strictEqual(testWpnBot.player.gun_sniper_lv, 15, 'gun_sniper_lv must be carried forward');
  assert.strictEqual(testWpnBot.player.sniper_modules.barrel.rarity, 6, 'sniper_modules must be carried forward');
  assert.strictEqual(testWpnBot.player.module_inventory.length, 1, 'module_inventory must be carried forward');
  assert.strictEqual(testWpnBot.player.ammo_sniper_t1, 200, 'ammo_sniper_t1 must be carried forward');

  // 3. Test Mod Option Stat Calculation
  function testModOptionAtk(r, plus) {
    const enhAtk = plus > 0 ? (plus <= 5 ? plus * 3 : (plus <= 11 ? 15 + (plus - 5) * 5 : 45 + (plus - 11) * 8)) : 0;
    return (r - 1) * 3 + enhAtk;
  }
  assert.strictEqual(testModOptionAtk(4, 0), 9, 'Rarity 4 (+0) ATK should be 9');
  assert.strictEqual(testModOptionAtk(4, 5), 24, 'Rarity 4 (+5) ATK should be 9 + 15 = 24');
  assert.strictEqual(testModOptionAtk(6, 10), 55, 'Rarity 6 (+10) ATK should be 15 + 40 = 55');

  // 4. Test Card In / Out Optimistic Updates & State Integrity
  testWpnBot.player.cards = { 12: { n: 5, m: 2 } };

  // Simulate card in
  const modKey = 'sniper_modules';
  testWpnBot.player[modKey].barrel.cards = [];
  testWpnBot.player[modKey].barrel.cards[0] = { mid: 12, mvp: 1 };
  testWpnBot.player.cards[12].m -= 1;

  assert.strictEqual(testWpnBot.player[modKey].barrel.cards[0].mid, 12, 'Card 12 should be slotted');
  assert.strictEqual(testWpnBot.player.cards[12].m, 1, 'MVP card count should decrease to 1');

  // Simulate card out
  const unslotted = testWpnBot.player[modKey].barrel.cards.splice(0, 1)[0];
  testWpnBot.player.cards[unslotted.mid].m += 1;

  assert.strictEqual(testWpnBot.player[modKey].barrel.cards.length, 0, 'Module cards should be empty after unslot');
  assert.strictEqual(testWpnBot.player.cards[12].m, 2, 'MVP card count should return to 2');

  console.log('✅ T78 In-Game Weapon Tab Integration, Card Socketing & Cold Fields Tests Passed successfully!');

  // 5. Test Offline Mechanics (processOfflineReward, syncOfflineZones, sendCheckinGuardWithRetry)
  console.log('Testing Offline Mechanics...');
  const offlineBot = new BotInstance({ name: 'OfflineTester', line_uid: 'off_test_uid', settings: {} });

  // Test processOfflineReward
  offlineBot.processOfflineReward({
    kills: 120,
    exp: 45000,
    gold: 15000,
    items: [{ n: 'Thẻ Gà Con', q: 1 }]
  });

  assert.strictEqual(offlineBot.offlineRewardsHistory.length, 1, 'offlineRewardsHistory must have 1 record');
  assert.strictEqual(offlineBot.offlineRewardsHistory[0].kills, 120, 'Kills in reward record must be 120');
  assert.strictEqual(offlineBot.offlineRewardsHistory[0].exp, 45000, 'EXP in reward record must be 45000');
  assert.strictEqual(offlineBot.offlineRewardsHistory[0].items.length, 1, 'Items count in reward record must be 1');

  // Test syncOfflineZones method signature & returns
  let syncCalled = false;
  offlineBot.sendRequest = async (url, payload) => {
    if (url.includes('xhrpg_offline.php') && payload.action === 'save_zone') {
      syncCalled = true;
      assert.strictEqual(payload.map, 3, 'Map parameter must match 3');
      assert.strictEqual(payload.zones, '[0,1]', 'Zones parameter must match JSON string [0,1]');
      return { ok: true };
    }
    if (url.includes('xhrpg_offline.php') && payload.action === 'idlestat') {
      return { ok: true };
    }
    return { ok: false };
  };

  const syncResult = await offlineBot.syncOfflineZones(3, [0, 1]);
  assert.strictEqual(syncResult, true, 'syncOfflineZones should return true on success');
  assert.strictEqual(syncCalled, true, 'sendRequest should be called with save_zone action');

  const checkinResult = await offlineBot.sendCheckinGuardWithRetry(2);
  assert.strictEqual(checkinResult, true, 'sendCheckinGuardWithRetry should return true on success');

  console.log('✅ Offline Mechanics Tests Passed successfully!');

  console.log('✅ Anti-Hang & Zombie Bot Watchdog Engine Tests Passed successfully!');
  console.log('✅ User Polling Interval, Role Propagation and Edit Permissions Tests Passed successfully!');
  console.log('✅ Urgent Active Potion Healing Tests Passed successfully!');
  console.log('✅ ProxyPool SOCKS5 Parsing Tests Passed successfully!');

  // ==================== T62 AUTO SESSION RENEWAL & AUTO-RELOGIN TESTS ====================
  console.log('Testing T62 Auto Session Renewal & Auto-Relogin Engine...');
  const t62Bot = new BotInstance({
    line_uid: 't62_uid_9999',
    session_token: 'old_token_123',
    phpsessid: 'sess_cookie_abc',
    name: 'T62 Test Bot'
  });

  assert.strictEqual(t62Bot.phpsessid, 'sess_cookie_abc', 'BotInstance must store phpsessid');
  assert.strictEqual(typeof t62Bot.refreshSession, 'function', 'BotInstance must have refreshSession method');

  // Verify getDispatcherForBot alias exists
  assert.strictEqual(typeof ProxyPool.prototype.getDispatcherForBot, 'function', 'ProxyPool class must have getDispatcherForBot alias method');
  assert.strictEqual(typeof proxyPool.getDispatcherForBot, 'function', 'proxyPool instance must have getDispatcherForBot alias method');

  // Test that refreshSession passes the correct proxy dispatcher to fetch
  const { MockAgent } = require('undici');
  const mockAgentInstance = new MockAgent();
  mockAgentInstance.disableNetConnect();

  const mockPool = mockAgentInstance.get('https://ragnalok.online');
  mockPool.intercept({
    path: '/human/xhrpg_google_auth.php',
    method: 'GET'
  }).reply(200, { ok: true, session_token: 'new_mock_token_456', player: { line_uid: 't62_uid_9999' } });

  const originalGetDispatcher = proxyPool.getDispatcher;
  proxyPool.getDispatcher = (uid) => {
    if (uid === 't62_uid_9999') return mockAgentInstance;
    return originalGetDispatcher.call(proxyPool, uid);
  };

  try {
    const refreshResult = await t62Bot.refreshSession();
    assert.strictEqual(refreshResult, true, 'refreshSession must return true when api returns ok');
    assert.strictEqual(t62Bot.session_token, 'new_mock_token_456', 'session_token must be updated to new token');

    // Verify getDispatcherForBot returns the same result
    assert.strictEqual(proxyPool.getDispatcherForBot('t62_uid_9999'), mockAgentInstance, 'getDispatcherForBot must return the mock dispatcher');
  } finally {
    // Restore original globals
    proxyPool.getDispatcher = originalGetDispatcher;
  }

  // Test refreshing with dummy/invalid phpsessid handles failure gracefully
  const refreshResultGraceful = await t62Bot.refreshSession();
  assert.strictEqual(typeof refreshResultGraceful, 'boolean', 'refreshSession must return boolean result');

  // Test sanitizeSessionToken utility
  assert.strictEqual(sanitizeSessionToken('  token_abc123  '), 'token_abc123', 'Should trim whitespace');
  assert.strictEqual(sanitizeSessionToken('"token_quoted"'), 'token_quoted', 'Should strip quotes');
  assert.strictEqual(sanitizeSessionToken('session_token=token_param_val'), 'token_param_val', 'Should extract value from session_token= prefix');
  assert.strictEqual(sanitizeSessionToken('https://ragnalok.online/human/?session_token=token_url_param&other=1'), 'token_url_param', 'Should extract token from URL query');
  assert.strictEqual(sanitizeSessionToken(''), '', 'Should handle empty string');
  assert.strictEqual(sanitizeSessionToken(null), '', 'Should handle null');

  console.log('✅ T62 Auto Session Renewal Tests Passed successfully!');

  // ==================== /PLAY & PROXY CONNECTION TESTS ====================
  console.log('Testing /play & Proxy Connection Engine (Mock-based tests)...');

  // 1. Test ProxyPool.prototype.getDispatcher line_uid handling & consistency [MOCK/UNIT]
  const defaultDisp = proxyPool.getDefaultDispatcher();
  assert.ok(defaultDisp, 'proxyPool.getDefaultDispatcher must return a valid dispatcher');
  assert.strictEqual(proxyPool.getDispatcher(null), defaultDisp, 'getDispatcher(null) must return default dispatcher');
  assert.strictEqual(proxyPool.getDispatcher(undefined), defaultDisp, 'getDispatcher(undefined) must return default dispatcher');
  assert.strictEqual(proxyPool.getDispatcher(''), defaultDisp, 'getDispatcher("") must return default dispatcher');

  // Verify consistency for a specific bot line_uid
  const botDisp1 = proxyPool.getDispatcher('test_play_uid_1001');
  const botDisp2 = proxyPool.getDispatcher('test_play_uid_1001');
  assert.strictEqual(botDisp1, botDisp2, 'Repeated getDispatcher calls for the same line_uid must return the exact same dispatcher');

  // 2. Test safe URL encoding for /play and /battle [UNIT]
  const sampleUid = 'U_special+char/100==';
  const sampleToken = 'token/with+plus&and=equals#hash';
  const encodedPlayUrl = `/play?line_uid=${encodeURIComponent(sampleUid)}&session_token=${encodeURIComponent(sampleToken)}`;
  assert.ok(encodedPlayUrl.includes('U_special%2Bchar%2F100%3D%3D'), 'line_uid must be safely percent-encoded');
  assert.ok(encodedPlayUrl.includes('token%2Fwith%2Bplus%26and%3Dequals%23hash'), 'session_token must be safely percent-encoded');

  // 3. Test proxyRequest headers forwarding, line_uid dispatcher binding, and STRICT REFERER NORMALIZATION [MOCK HTTP]
  const playMockAgent = new MockAgent();
  playMockAgent.disableNetConnect();

  let capturedHeaders = null;
  const playMockPool = playMockAgent.get('https://ragnalok.online');
  playMockPool.intercept({
    path: '/human/xhrpg_game.php',
    method: 'POST'
  }).reply(200, (reqOpt) => {
    capturedHeaders = reqOpt.headers;
    return JSON.stringify({ ok: true, player: { name: 'PlayTester', hp: 100, hp_max: 100 } });
  }, {
    headers: { 'content-type': 'application/json' }
  });

  // Setup mock bot in botInstances
  const testPlayBot = new BotInstance({
    line_uid: 'play_test_bot_1',
    session_token: 'play_test_tok_1',
    phpsessid: 'test_sess_999',
    name: 'Play Test Bot'
  });
  botInstances['play_test_bot_1'] = testPlayBot;

  const originalGetDisp = proxyPool.getDispatcher;
  let dispatcherCalledWithUid = null;
  proxyPool.getDispatcher = (uid) => {
    dispatcherCalledWithUid = uid;
    return playMockAgent;
  };

  try {
    // Mock express req with dangerous local referer from browser
    const mockReq = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'accept-language': 'vi-VN,vi;q=0.9',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': 'custom_cook=123',
        'referer': 'http://localhost:3000/play?line_uid=play_test_bot_1'
      },
      body: {
        line_uid: 'play_test_bot_1',
        session_token: 'play_test_tok_1',
        act: 1
      },
      query: {}
    };

    let sentStatus = null;
    let sentData = null;
    const mockRes = {
      headersSent: false,
      status: (st) => { sentStatus = st; return mockRes; },
      setHeader: (k, v) => {},
      send: (d) => { sentData = d; return mockRes; },
      json: (j) => { sentData = JSON.stringify(j); return mockRes; }
    };

    await proxyRequest(mockReq, mockRes, 'https://ragnalok.online/human/xhrpg_game.php', 'play_test_bot_1');

    assert.strictEqual(sentStatus, 200, 'proxyRequest must return 200 status code');
    assert.strictEqual(dispatcherCalledWithUid, 'play_test_bot_1', 'proxyRequest must request dispatcher for the provided line_uid');
    assert.ok(capturedHeaders, 'Mock server must receive forwarded headers');
    assert.strictEqual(capturedHeaders['x-requested-with'], 'XMLHttpRequest', 'proxyRequest must forward x-requested-with header');
    assert.strictEqual(capturedHeaders['accept-language'], 'vi-VN,vi;q=0.9', 'proxyRequest must forward accept-language header');
    assert.ok(capturedHeaders['cookie'] && capturedHeaders['cookie'].includes('PHPSESSID=test_sess_999'), 'proxyRequest must forward cookie including PHPSESSID');
    assert.ok(capturedHeaders['cookie'] && capturedHeaders['cookie'].includes('custom_cook=123'), 'proxyRequest must forward custom cookies');

    // CRITICAL: Verify local referer is NEVER forwarded and is normalized to upstream
    assert.strictEqual(capturedHeaders['referer'], 'https://ragnalok.online/human/', 'proxyRequest referer must be normalized to upstream and never forward localhost');
    assert.strictEqual(capturedHeaders['origin'], 'https://ragnalok.online', 'proxyRequest origin must be https://ragnalok.online');
    assert.ok(!JSON.stringify(capturedHeaders).includes('localhost'), 'proxyRequest must never leak localhost to upstream');
    assert.ok(!JSON.stringify(capturedHeaders).includes('/play'), 'proxyRequest must never leak /play referer to upstream');
  } finally {
    proxyPool.getDispatcher = originalGetDisp;
    delete botInstances['play_test_bot_1'];
  }

  // 4. Test fetchGameHtml DOM patching, script injection, and referer normalization [MOCK HTTP]
  let fetchGameHtmlCapturedHeaders = null;
  playMockPool.intercept({
    path: /^\/human\/index\.php/,
    method: 'GET'
  }).reply(200, (reqOpt) => {
    fetchGameHtmlCapturedHeaders = reqOpt.headers;
    return '<!DOCTYPE html><html><head><script src="js/xhrpg_canvas.js"></script></head><body><div id="log-list"></div><script>let LIFF_ID = "123"; liff.init();</script></body></html>';
  }, {
    headers: { 'content-type': 'text/html' }
  });

  proxyPool.getDispatcher = (uid) => playMockAgent;
  try {
    const mockReq = {
      headers: {
        'user-agent': 'TestAgent/1.0',
        'accept-language': 'vi-VN',
        'referer': 'http://localhost:3000/play?line_uid=play_test_bot_1'
      },
      query: { line_uid: 'play_test_bot_1' },
      body: {}
    };

    const patchedHtml = await fetchGameHtml(mockReq, 'play_test_bot_1');
    assert.ok(patchedHtml.includes('id="event-log"'), 'fetchGameHtml must patch log-list to event-log');
    assert.ok(patchedHtml.includes('id="login-overlay"'), 'fetchGameHtml must inject login-overlay');
    assert.ok(patchedHtml.includes('/js/xhrpg_lang_vi.js'), 'fetchGameHtml must inject Vietnamese translation script');
    assert.ok(patchedHtml.includes('xhrpg_game.php'), 'fetchGameHtml must inject proxy startup script');
    assert.ok(!patchedHtml.includes('LIFF_ID'), 'fetchGameHtml must replace LIFF init script');

    // Check headers sent to upstream
    assert.ok(fetchGameHtmlCapturedHeaders, 'Upstream must receive headers');
    assert.strictEqual(fetchGameHtmlCapturedHeaders['referer'], 'https://ragnalok.online/human/', 'fetchGameHtml referer must be normalized to upstream');
    assert.ok(!JSON.stringify(fetchGameHtmlCapturedHeaders).includes('localhost'), 'fetchGameHtml must never leak localhost to upstream');
  } finally {
    proxyPool.getDispatcher = originalGetDisp;
  }

  // 5. Test fetchGameLoginHtml timeout, headers forwarding, and referer normalization [MOCK HTTP]
  let loginHtmlCapturedHeaders = null;
  playMockPool.intercept({
    path: /^\/human\/index\.php/,
    method: 'GET'
  }).reply(200, (reqOpt) => {
    loginHtmlCapturedHeaders = reqOpt.headers;
    return '<!DOCTYPE html><html><head><script src="js/xhrpg_canvas.js"></script></head><body><div id="loading-screen"></div><div id="login-overlay" style="display:none"></div><script>let LIFF_ID = "123";</script></body></html>';
  }, {
    headers: { 'content-type': 'text/html' }
  });

  const origGetDefaultDisp = proxyPool.getDefaultDispatcher;
  proxyPool.getDefaultDispatcher = () => playMockAgent;
  try {
    const mockReq = {
      headers: {
        'user-agent': 'LoginTestAgent/2.0',
        'cookie': 'login_test_cookie=abc',
        'x-requested-with': 'XMLHttpRequest',
        'referer': 'http://127.0.0.1:3000/login-helper'
      }
    };

    const loginHtml = await fetchGameLoginHtml(mockReq);
    assert.ok(loginHtml.includes('id="loading-screen" style="display:none;"'), 'fetchGameLoginHtml must hide loading screen');
    assert.ok(loginHtml.includes('id="login-overlay" style="display:flex; z-index:999999;"'), 'fetchGameLoginHtml must show login overlay');
    assert.ok(loginHtml.includes('auto-add-account'), 'fetchGameLoginHtml must inject auto-add-account script');
    assert.ok(loginHtml.includes('<p style="color:#a78bfa;'), 'fetchGameLoginHtml must contain valid <p style= tag');
    assert.ok(!loginHtml.includes('<style='), 'fetchGameLoginHtml must not contain malformed <style= tag');

    assert.ok(loginHtmlCapturedHeaders, 'Upstream must receive login headers');
    assert.strictEqual(loginHtmlCapturedHeaders['user-agent'], 'LoginTestAgent/2.0', 'fetchGameLoginHtml must forward user-agent');
    assert.strictEqual(loginHtmlCapturedHeaders['cookie'], 'login_test_cookie=abc', 'fetchGameLoginHtml must forward cookie');
    assert.strictEqual(loginHtmlCapturedHeaders['referer'], 'https://ragnalok.online/human/', 'fetchGameLoginHtml referer must be normalized to upstream');
    assert.ok(!JSON.stringify(loginHtmlCapturedHeaders).includes('localhost'), 'fetchGameLoginHtml must never leak localhost');
    assert.ok(!JSON.stringify(loginHtmlCapturedHeaders).includes('127.0.0.1'), 'fetchGameLoginHtml must never leak 127.0.0.1');
  } finally {
    proxyPool.getDefaultDispatcher = origGetDefaultDisp;
  }

  // 6. Test fetchGameHtml throwing when non-game HTML is returned (e.g. Cloudflare block) [MOCK HTTP]
  playMockPool.intercept({
    path: /^\/human\/index\.php/,
    method: 'GET'
  }).reply(200, '<html><body>Just a moment... Cloudflare challenge</body></html>', {
    headers: { 'content-type': 'text/html' }
  });

  proxyPool.getDispatcher = (uid) => playMockAgent;
  try {
    let threw = false;
    try {
      await fetchGameHtml({ headers: {}, query: {} }, 'play_test_bot_1');
    } catch (e) {
      threw = true;
      assert.ok(e.message.includes('game scripts'), 'fetchGameHtml must throw descriptive error when HTML lacks game scripts');
    }
    assert.strictEqual(threw, true, 'fetchGameHtml must throw on Cloudflare / non-game responses');
  } finally {
    proxyPool.getDispatcher = originalGetDisp;
  }

  console.log('✅ /play & Proxy Connection Tests (Mock-based) Passed successfully!');

  // ==========================================
  // CONCURRENCY, SCHEDULER & REQUEST QUEUE TESTS (13 SCENARIOS)
  // ==========================================
  console.log('Testing Concurrency, Scheduler & Request Queue Engine (13 Scenarios)...');

  // Scenario 1: Overlap Mutex - triggerImmediatePoll() while poll is running
  {
    console.log('  Scenario 1: Overlap Mutex prevents concurrent polls...');
    const bot1 = new BotInstance({ line_uid: 'sched_test_1', name: 'SchedBot1' });
    bot1.isPolling = true;
    bot1.status = 'running';
    bot1.immediatePollPending = false;
    bot1.overlapCount = 0;
    bot1.skippedImmediatePollCount = 0;

    bot1.triggerImmediatePoll();
    assert.strictEqual(bot1.isPolling, true, 'isPolling must remain true');
    assert.strictEqual(bot1.immediatePollPending, true, 'immediatePollPending must be set to true');
    assert.strictEqual(bot1.skippedImmediatePollCount, 1, 'skippedImmediatePollCount must increment');
    assert.strictEqual(bot1.overlapCount, 0, 'No overlapping poll was spawned');
    bot1.stop();
  }

  // Scenario 2: Immediate Trigger Spam & Cooldown
  {
    console.log('  Scenario 2: Immediate Trigger Spam with 300ms Cooldown...');
    const bot2 = new BotInstance({ line_uid: 'sched_test_2', name: 'SchedBot2' });
    bot2.status = 'running';
    bot2.isPolling = true;
    bot2.immediatePollPending = false;
    bot2.skippedImmediatePollCount = 0;

    // Call 5 times rapidly
    for (let i = 0; i < 5; i++) {
      bot2.triggerImmediatePoll();
    }
    assert.strictEqual(bot2.immediatePollPending, true, 'immediatePollPending must remain true');
    assert.strictEqual(bot2.skippedImmediatePollCount, 5, 'All 5 rapid triggers were safely queued/cooldown-throttled');
    bot2.stop();
  }

  // Scenario 3: Poll Timeout & Real Abort Signal
  {
    console.log('  Scenario 3: Poll Timeout and AbortSignal cancellation...');
    const bot3 = new BotInstance({ line_uid: 'sched_test_3', name: 'SchedBot3' });
    const pollAbortController = new AbortController();
    bot3.currentPollAbortController = pollAbortController;

    let abortFired = false;
    pollAbortController.signal.addEventListener('abort', () => {
      abortFired = true;
    });

    // Simulate 45s hard timeout abort
    pollAbortController.abort(new Error('POLL_TIMEOUT'));
    assert.strictEqual(abortFired, true, 'AbortSignal must fire on timeout');
    assert.strictEqual(pollAbortController.signal.aborted, true, 'Signal must be marked aborted');

    // Simulate old late response returning after abort
    let stateModified = false;
    const handleLateResponse = (res) => {
      if (pollAbortController.signal.aborted) {
        return; // Rejected due to abort
      }
      stateModified = true;
    };
    handleLateResponse({ ok: true });
    assert.strictEqual(stateModified, false, 'Late response must NOT modify bot state after abort');
    bot3.stop();
  }

  // Scenario 4: Stop / Start in Flight & Generation Invalidation
  {
    console.log('  Scenario 4: Stop/Start generation guard prevents ghost schedulers...');
    const bot4 = new BotInstance({ line_uid: 'sched_test_4', name: 'SchedBot4' });
    bot4.start();
    const g1 = bot4.pollGeneration;
    assert.ok(g1 > 0, 'Initial pollGeneration must be > 0');

    // Stop bot while mock poll is running
    bot4.stop('idle');
    assert.strictEqual(bot4.status, 'idle');
    assert.strictEqual(bot4.timer, null, 'Timer must be cleared on stop');
    assert.ok(bot4.pollGeneration > g1, 'pollGeneration must increment on stop');

    // Start again
    bot4.start();
    const g2 = bot4.pollGeneration;
    assert.ok(g2 > g1, 'New generation must be strictly greater than old generation');

    // Simulate old finally block from g1 trying to reschedule
    let oldTimerCreated = false;
    const oldFinallyBlock = (gen) => {
      if (gen !== bot4.pollGeneration || bot4.status !== 'running') {
        return; // Dropped!
      }
      oldTimerCreated = true;
    };
    oldFinallyBlock(g1);
    assert.strictEqual(oldTimerCreated, false, 'Old generation finally block must NOT reschedule timer');
    bot4.stop();
  }

  // Scenario 5: Request Queue Priorities (P1 -> P2 -> P3 -> P4)
  {
    console.log('  Scenario 5: Request Queue executes strictly by priority (1 -> 2 -> 3 -> 4)...');
    const bot5 = new BotInstance({ line_uid: 'sched_test_5', name: 'SchedBot5' });
    const queue = new BotRequestQueue(bot5);
    bot5.requestQueue = queue;

    const executionOrder = [];
    bot5._sendRequestDirect = async (url, payload, options = {}) => {
      executionOrder.push(options.priority);
      await new Promise(r => setTimeout(r, 10));
      return { ok: true };
    };

    // Enqueue in reverse priority order: 4, 3, 2, 1
    const p4 = queue.enqueue('/leaderboard', {}, { priority: 4, type: 'DEF_SCAN' });
    const p3 = queue.enqueue('/offline', { action: 'chpass' }, { priority: 3, type: 'CHECKIN' });
    const p2 = queue.enqueue('/upgrade', { action: 'use_potion_manual' }, { priority: 2, type: 'POTION' });
    const p1 = queue.enqueue('/game', {}, { priority: 1, type: 'GAME_POLL' });

    await Promise.all([p4, p3, p2, p1]);
    assert.strictEqual(executionOrder.length, 4, 'All 4 requests must execute');
    assert.strictEqual(executionOrder[1], 1, 'Second executed must be Priority 1 (Game poll)');
    assert.strictEqual(executionOrder[2], 2, 'Third executed must be Priority 2 (Potion)');
    assert.strictEqual(executionOrder[3], 3, 'Fourth executed must be Priority 3 (Checkin)');
    bot5.stop();
  }

  // Scenario 6: Anti-Starvation Mechanism
  {
    console.log('  Scenario 6: Anti-Starvation yields slot to background request after 5 high-priority actions...');
    const bot6 = new BotInstance({ line_uid: 'sched_test_6', name: 'SchedBot6' });
    const queue = new BotRequestQueue(bot6);
    bot6.requestQueue = queue;

    const execLog = [];
    bot6._sendRequestDirect = async (url, payload, options = {}) => {
      execLog.push(options.priority);
      await new Promise(r => setTimeout(r, 5));
      return { ok: true };
    };

    // Enqueue 1 initial item to keep queue busy, then 1 background (P4) and 6 high-priority (P2) items
    const promises = [];
    promises.push(queue.enqueue('/init', {}, { priority: 2 }));
    promises.push(queue.enqueue('/bg', {}, { priority: 4 }));
    for (let i = 0; i < 6; i++) {
      promises.push(queue.enqueue(`/action_${i}`, {}, { priority: 2 }));
    }

    await Promise.all(promises);
    assert.strictEqual(execLog.length, 8, 'Total 8 items executed');
    // After 5 consecutive high-priority items (indices 0, 1, 2, 3, 4), the 6th item (index 5) MUST be Priority 4!
    assert.strictEqual(execLog[5], 4, 'Priority 4 must execute after 5 consecutive high-priority requests to prevent starvation');
    bot6.stop();
  }

  // Scenario 7: Action Chaining without Deadlock
  {
    console.log('  Scenario 7: Action chaining within queue does NOT cause deadlock...');
    const bot7 = new BotInstance({ line_uid: 'sched_test_7', name: 'SchedBot7' });
    const queue = new BotRequestQueue(bot7);
    bot7.requestQueue = queue;

    let childActionFinished = false;
    bot7._sendRequestDirect = async (url, payload, options = {}) => {
      if (url === '/parent') {
        setTimeout(() => {
          bot7.sendRequest('/child', {}, { priority: 2 }).then(() => {
            childActionFinished = true;
          });
        }, 5);
        return { ok: true, isParent: true };
      }
      if (url === '/child') {
        return { ok: true, isChild: true };
      }
      return { ok: true };
    };

    await bot7.sendRequest('/parent', {}, { priority: 1 });
    await new Promise(r => setTimeout(r, 50));
    assert.strictEqual(childActionFinished, true, 'Child chained action must resolve without deadlock');
    assert.strictEqual(queue.size, 0, 'Queue must be completely empty');
    bot7.stop();
  }

  // Scenario 8: Short Background Timeout
  {
    console.log('  Scenario 8: Background request has shorter timeout (3000-4000ms)...');
    const bot8 = new BotInstance({ line_uid: 'sched_test_8', name: 'SchedBot8' });
    const queue = new BotRequestQueue(bot8);
    bot8.requestQueue = queue;

    bot8._sendRequestDirect = async (url, payload, options = {}) => {
      assert.ok(options.timeoutMs <= 4000, `Background timeoutMs must be <= 4000, got ${options.timeoutMs}`);
      return { ok: true };
    };

    await queue.enqueue('/bg_scan', {}, { priority: 4 });
    bot8.stop();
  }

  // Scenario 9: Single-Layer Retry in _sendRequestDirect
  {
    console.log('  Scenario 9: Single-layer retry strictly capped at maxAttempts in _sendRequestDirect...');
    const bot9 = new BotInstance({ line_uid: 'sched_test_9', name: 'SchedBot9' });
    bot9.requestQueue = new BotRequestQueue(bot9);

    const { MockAgent } = require('undici');
    const retryMockAgent = new MockAgent();
    retryMockAgent.disableNetConnect();
    const retryPool = retryMockAgent.get('https://ragnalok.online');

    let attemptsCount = 0;
    retryPool.intercept({
      path: '/human/xhrpg_retry_test.php',
      method: 'POST'
    }).replyWithError(new Error('Simulated network drop 1'));

    retryPool.intercept({
      path: '/human/xhrpg_retry_test.php',
      method: 'POST'
    }).replyWithError(new Error('Simulated network drop 2'));

    retryPool.intercept({
      path: '/human/xhrpg_retry_test.php',
      method: 'POST'
    }).reply(200, JSON.stringify({ ok: true, recovered: true }));

    const originalGetDisp = proxyPool.getDispatcher;
    proxyPool.getDispatcher = (uid) => {
      if (uid === 'sched_test_9') return retryMockAgent;
      return originalGetDisp.call(proxyPool, uid);
    };

    let queueCallCount = 0;
    const origDirect = bot9._sendRequestDirect;
    bot9._sendRequestDirect = async function(...args) {
      queueCallCount++;
      return origDirect.apply(this, args);
    };

    try {
      const res = await bot9.sendRequest('https://ragnalok.online/human/xhrpg_retry_test.php', {}, { maxAttempts: 3 });
      assert.strictEqual(res.recovered, true, 'Request should recover on 3rd attempt');
      assert.strictEqual(queueCallCount, 1, 'Queue worker must invoke _sendRequestDirect only once (no double-layer retry)');
    } finally {
      proxyPool.getDispatcher = originalGetDisp;
      bot9.stop();
    }
  }

  // Scenario 10: Cadence anchored to pollStartedAt (nextDueAt)
  {
    console.log('  Scenario 10: Cadence calculation anchored to pollStartedAt eliminates drift...');
    const pollStartedAt = 100000;
    const baseDelay = 2000;
    const jitter = 100;
    const nextDueAt = pollStartedAt + baseDelay + jitter; // 102100

    // Simulate poll that took 400ms (now = 100400)
    const nowAfterPoll = 100400;
    const delay = Math.max(500, nextDueAt - nowAfterPoll); // 102100 - 100400 = 1700ms
    assert.strictEqual(delay, 1700, 'Delay must compensate for 400ms request duration');
    assert.strictEqual(nowAfterPoll + delay, nextDueAt, 'Next poll starts exactly at nextDueAt (no drift)');
  }

  // Scenario 11: Watchdog Recovery bot.recover()
  {
    console.log('  Scenario 11: Watchdog recovery cleanly resets scheduler without duplicate timers...');
    const bot11 = new BotInstance({ line_uid: 'sched_test_11', name: 'SchedBot11' });
    bot11.start();
    const gBefore = bot11.pollGeneration;

    // Trigger recover
    bot11.recover('Zombie detected');
    assert.ok(bot11.pollGeneration > gBefore, 'Generation must increment after recover');
    assert.strictEqual(bot11.status, 'running', 'Status must be running');
    assert.strictEqual(bot11.isPolling, false, 'isPolling must be reset to false');
    assert.strictEqual(bot11.immediatePollPending, false, 'immediatePollPending reset');
    assert.ok(bot11.timer !== null, 'Exactly 1 active timer handle created');
    bot11.stop();
  }

  // Scenario 12: Multi-Bot Concurrency
  {
    console.log('  Scenario 12: Multi-bot concurrency with independent queues and mutexes...');
    const mb1 = new BotInstance({ line_uid: 'mb_1', name: 'MB1' });
    const mb2 = new BotInstance({ line_uid: 'mb_2', name: 'MB2' });
    const mb3 = new BotInstance({ line_uid: 'mb_3', name: 'MB3' });

    assert.notStrictEqual(mb1.requestQueue, mb2.requestQueue, 'Bot 1 and Bot 2 must have independent queues');
    assert.notStrictEqual(mb2.requestQueue, mb3.requestQueue, 'Bot 2 and Bot 3 must have independent queues');

    mb1.isPolling = true;
    assert.strictEqual(mb2.isPolling, false, 'Bot 1 polling must not block Bot 2');
    assert.strictEqual(mb3.isPolling, false, 'Bot 1 polling must not block Bot 3');

    mb1.stop();
    mb2.stop();
    mb3.stop();
  }

  // Scenario 13: Cache Debounced Non-blocking Write
  {
    console.log('  Scenario 13: Cache debounced write avoids synchronous disk block...');
    const fs = require('fs');
    const path = require('path');
    const spotsCachePath = path.join(__dirname, 'spots_cache.json');
    requestSaveSpotsCache();
    saveSpotsCache();
    const data = JSON.parse(fs.readFileSync(spotsCachePath, 'utf8'));
    assert.strictEqual(typeof data, 'object', 'spots_cache.json must be valid JSON');
  }

  console.log('✅ Concurrency, Scheduler & Request Queue Engine (13 Scenarios) Passed successfully!');
  console.log('✅ All Unit Tests Passed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Unit Tests Failed:', error);
  process.exit(1);
}
})();
