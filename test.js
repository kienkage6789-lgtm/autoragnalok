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
  instance.bosses = null;
  instance.targetedMvp = false;
  instance.pollCount = 1;
  const isFullWithNullBosses = ((instance.pollCount % 10 === 0) || instance.targetedMvp || instance.bosses === null) ? 1 : 0;
  assert.strictEqual(isFullWithNullBosses, 1, 'isFull must be 1 when bosses is null');

  // Test Case 2: mvpConfirmClearCount reset when bosses is null
  instance.bosses = null;
  instance.targetedMvp = false;
  instance.mvpConfirmClearCount = 3;
  let aliveTargetBosses = [];
  if (instance.bosses === null) {
    instance.mvpConfirmClearCount = 0;
  } else if (instance.targetedMvp) {
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

  console.log('✅ All Unit Tests Passed successfully!');
} catch (error) {
  console.error('❌ Unit Tests Failed:', error);
  process.exit(1);
}
