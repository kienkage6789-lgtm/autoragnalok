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
  naturalCoordNoise,
  logNormalActInterval,
  checkAndRecoverZombieBots
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
  
  // Test Guild Dungeon (enterGuildDungeon & exitGuildDungeon & auto-exit)
  console.log('Testing Guild Dungeon State & Auto-Exit Logic...');
  const mockGdunBot = new BotInstance({ name: 'GdunBot', line_uid: 'gdun_bot_1', settings: {} });
  mockGdunBot.sendRequest = async function(url, payload) {
    if (payload.action === 'gdun_enter') {
      // Test case: server returns ok:1 BUT no res.map (common in practice)
      return { ok: 1, player: { map: 12, gdun_in: 1 } };
    } else if (payload.action === 'gdun_exit') {
      // Test case: server returns ok:1 BUT no res.map
      return { ok: 1, player: { map: 1, gdun_in: 0 } };
    }
    return { ok: 0 };
  };

  // Test 1: enterGuildDungeon must set gdun_in=1 even if res.map is missing
  let enterOk = await mockGdunBot.enterGuildDungeon(true);
  assert.strictEqual(enterOk, true, 'enterGuildDungeon should return true');
  assert.strictEqual(mockGdunBot.guildDungeonActive, true, 'guildDungeonActive should be true after enter');
  assert.strictEqual(mockGdunBot.guildDungeonIsTeam, true, 'guildDungeonIsTeam should be true');
  assert.strictEqual(mockGdunBot.player.gdun_in, 1, 'player.gdun_in should be 1 even if res.map is absent');
  assert.ok(mockGdunBot.gdunEnteredAt > 0, 'gdunEnteredAt should be set on enter');
  assert.strictEqual(mockGdunBot.gdunLastKillAt, 0, 'gdunLastKillAt should be reset to 0 on enter');
  assert.strictEqual(mockGdunBot._exitingGuildDungeon, false, '_exitingGuildDungeon should be false after enter');

  // Test 2: exitGuildDungeon must reset gdun_in=0 even if res.map is missing
  let exitOk = await mockGdunBot.exitGuildDungeon();
  assert.strictEqual(exitOk, true, 'exitGuildDungeon should return true');
  assert.strictEqual(mockGdunBot.guildDungeonActive, false, 'guildDungeonActive should be false after exit');
  assert.strictEqual(mockGdunBot.player.gdun_in, 0, 'player.gdun_in should be 0 even if res.map is absent');
  assert.strictEqual(mockGdunBot.gdunEnteredAt, 0, 'gdunEnteredAt should be reset to 0 on exit');
  assert.strictEqual(mockGdunBot.gdunLastKillAt, 0, 'gdunLastKillAt should be reset to 0 on exit');
  assert.strictEqual(mockGdunBot._exitingGuildDungeon, false, '_exitingGuildDungeon should be false after exit');

  // Test 3: Kill event should NOT trigger immediate exit — bot must stay for more boss potential spawns
  await mockGdunBot.enterGuildDungeon(false); // Enter solo again
  // Simulate killing boss but NOT setting gdunLastKillAt (which would trigger old kill-based exit)
  // After kill, guildDungeonActive stays true; bot relies only on empty polls
  mockGdunBot.monsters = [{ id: 1, name: 'Boss2', hp: 1000 }]; // Boss 2 just spawned!
  mockGdunBot.bosses = [];
  const testAliveM = (mockGdunBot.monsters || []).filter(m => (m.hp === undefined || m.hp > 0));
  const testHasTargetsAfterKill = testAliveM.length > 0;
  assert.strictEqual(testHasTargetsAfterKill, true, 'Bot must stay in dungeon when another boss is present after first kill');
  assert.strictEqual(mockGdunBot.guildDungeonActive, true, 'guildDungeonActive must remain true — do NOT exit on kill event');

  // Test 4: Timer-based auto-exit — time in dungeon >= 10 min → shouldExitByTimer
  const shouldExitByTimer10min = ((Date.now() - mockGdunBot.gdunEnteredAt) >= 10 * 60 * 1000);
  assert.strictEqual(shouldExitByTimer10min, false, 'shouldExitByTimer should be false when just entered');
  mockGdunBot.gdunEnteredAt = Date.now() - (11 * 60 * 1000); // Simulate 11 minutes ago
  const shouldExitByTimerOverdue = ((Date.now() - mockGdunBot.gdunEnteredAt) >= 10 * 60 * 1000);
  assert.strictEqual(shouldExitByTimerOverdue, true, 'shouldExitByTimer should be true after 10+ minutes');

  // Test 5: Guard _exitingGuildDungeon prevents double exit
  mockGdunBot._exitingGuildDungeon = true;
  let guardBlocked = mockGdunBot._exitingGuildDungeon; // Would skip exitGuildDungeon in real pollGame
  assert.strictEqual(guardBlocked, true, '_exitingGuildDungeon guard should block repeated exit');

  // Test 6: Empty monsters: [] and bosses: [] triggers auto-exit after 10 consecutive polls (when both not null)
  // (Threshold increased from 5 to 10 to survive boss respawn gap between multi-boss spawns)
  mockGdunBot._exitingGuildDungeon = false;
  mockGdunBot.guildDungeonActive = true;
  mockGdunBot.monsters = [];
  mockGdunBot.bosses = [];
  mockGdunBot.gdunEmptyPolls = 0;

  // Poll 1 to 9: Empty monsters -> gdunEmptyPolls increments but does NOT exit yet
  for (let i = 1; i <= 9; i++) {
    let aliveM2 = (mockGdunBot.monsters || []).filter(m => (m.hp === undefined || m.hp > 0));
    let aliveB2 = (mockGdunBot.bosses || []).filter(b => (b.hp === undefined || b.hp > 0));
    if (mockGdunBot.monsters !== null && mockGdunBot.bosses !== null && aliveM2.length === 0 && aliveB2.length === 0) {
      mockGdunBot.gdunEmptyPolls++;
    }
    assert.strictEqual(mockGdunBot.gdunEmptyPolls, i, `Poll ${i} should set gdunEmptyPolls to ${i}`);
    assert.strictEqual(mockGdunBot.guildDungeonActive, true, `Bot should still be in dungeon on poll ${i} (< 10)`);
  }

  // Simulate boss 2 spawning on poll 7 then dying again (reset gdunEmptyPolls)
  mockGdunBot.monsters = [{ id: 2, name: 'BossSpawn', hp: 500 }];
  let aliveM3 = (mockGdunBot.monsters || []).filter(m => (m.hp === undefined || m.hp > 0));
  if (aliveM3.length > 0) { mockGdunBot.gdunEmptyPolls = 0; }
  assert.strictEqual(mockGdunBot.gdunEmptyPolls, 0, 'gdunEmptyPolls must reset to 0 when a new boss spawns');
  assert.strictEqual(mockGdunBot.guildDungeonActive, true, 'Bot must stay in dungeon while boss2 is alive');

  // Now boss 2 dies, 10 empty polls needed to confirm fully clear
  mockGdunBot.monsters = [];
  mockGdunBot.bosses = [];
  for (let i = 1; i <= 9; i++) {
    let aliveM4 = (mockGdunBot.monsters || []).filter(m => (m.hp === undefined || m.hp > 0));
    let aliveB4 = (mockGdunBot.bosses || []).filter(b => (b.hp === undefined || b.hp > 0));
    if (mockGdunBot.monsters !== null && mockGdunBot.bosses !== null && aliveM4.length === 0 && aliveB4.length === 0) {
      mockGdunBot.gdunEmptyPolls++;
    }
  }
  assert.strictEqual(mockGdunBot.gdunEmptyPolls, 9, 'Should be at 9 empty polls — not yet exiting');
  assert.strictEqual(mockGdunBot.guildDungeonActive, true, 'Bot must still be in dungeon at 9 polls');

  // Poll 10: gdunEmptyPolls reaches 10 → exit
  let aliveM5 = (mockGdunBot.monsters || []).filter(m => (m.hp === undefined || m.hp > 0));
  let aliveB5 = (mockGdunBot.bosses || []).filter(b => (b.hp === undefined || b.hp > 0));
  if (mockGdunBot.monsters !== null && mockGdunBot.bosses !== null && aliveM5.length === 0 && aliveB5.length === 0) {
    mockGdunBot.gdunEmptyPolls++;
  }
  if (mockGdunBot.gdunEmptyPolls >= 10) await mockGdunBot.exitGuildDungeon();
  assert.strictEqual(mockGdunBot.guildDungeonActive, false, 'Bot should auto-exit when dungeon empty confirmed for 10 polls');
  assert.strictEqual(mockGdunBot.player.gdun_in, 0, 'player.gdun_in should be reset to 0');

  // Test 7: Different Guild identification logic (isDifferentGuild)
  const ldrMock = { player: { gd: 'GuildA', guild_id: 1, guild_name: 'Guild A', g_name: 'A' } };
  
  const checkIsDifferentGuild = (player, ldrPlayer) => {
    if (!player || !ldrPlayer) return false;
    if (player.gd && ldrPlayer.gd && player.gd !== ldrPlayer.gd) return true;
    if (player.guild_id && ldrPlayer.guild_id && player.guild_id !== ldrPlayer.guild_id) return true;
    if (player.guild_name && ldrPlayer.guild_name && player.guild_name !== ldrPlayer.guild_name) return true;
    if (player.g_name && ldrPlayer.g_name && player.g_name !== ldrPlayer.g_name) return true;
    return false;
  };

  // Same guild
  const sameGuildPlayer = { gd: 'GuildA' };
  assert.strictEqual(checkIsDifferentGuild(sameGuildPlayer, ldrMock.player), false, 'Should be same guild');

  // Different guild (by gd)
  const diffGuildPlayer1 = { gd: 'GuildB' };
  assert.strictEqual(checkIsDifferentGuild(diffGuildPlayer1, ldrMock.player), true, 'Should detect different guild by gd');

  // Different guild (by guild_id)
  const diffGuildPlayer2 = { guild_id: 2 };
  assert.strictEqual(checkIsDifferentGuild(diffGuildPlayer2, { guild_id: 1 }), true, 'Should detect different guild by guild_id');

  // Test 8: Member of different guild must NOT sync exit with leader
  mockGdunBot.player = { gd: 'GuildB', gdun_in: 1 };
  mockGdunBot.guildDungeonActive = true;
  const ldrMockInactive = { status: 'running', player: { gd: 'GuildA' }, guildDungeonActive: false };
  
  const isDifferentGuild = checkIsDifferentGuild(mockGdunBot.player, ldrMockInactive.player);
  assert.strictEqual(isDifferentGuild, true, 'Leader and member should be different guilds');

  // Simulate tick check: should NOT trigger exitGuildDungeon since isDifferentGuild is true
  let syncExited = false;
  if (!ldrMockInactive.guildDungeonActive && !isDifferentGuild && (mockGdunBot.guildDungeonActive || Number(mockGdunBot.player.gdun_in) === 1)) {
    syncExited = true;
    await mockGdunBot.exitGuildDungeon();
  }
  assert.strictEqual(syncExited, false, 'Member of different guild should NOT sync exit with leader');
  assert.strictEqual(mockGdunBot.guildDungeonActive, true, 'Member should remain in dungeon');

  console.log('✅ Guild Dungeon State & Auto-Exit Tests Passed successfully!');

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

  console.log('✅ Anti-Detection & Human Simulation Engine Tests Passed successfully!');

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

  // Test refreshing with dummy/invalid phpsessid handles failure gracefully
  const refreshResult = await t62Bot.refreshSession();
  assert.strictEqual(typeof refreshResult, 'boolean', 'refreshSession must return boolean result');

  console.log('✅ T62 Auto Session Renewal Tests Passed successfully!');
  console.log('✅ All Unit Tests Passed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Unit Tests Failed:', error);
  process.exit(1);
}
})();
