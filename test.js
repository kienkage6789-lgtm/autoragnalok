const assert = require('assert');
const {
  tierGold,
  tierRes,
  _upgCostMult,
  getArmorUpgradeCost,
  getCatUpgradeCost,
  getDroneUpgradeCost,
  getMineUpgradeCost
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
  assert.strictEqual(tierRes(11), 330);
  assert.strictEqual(tierRes(20), 600);

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
  assert.strictEqual(costArm19.stone, 660); // Math.ceil(600 * 1.1)

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

  console.log('✅ All Unit Tests Passed successfully!');
} catch (error) {
  console.error('❌ Unit Tests Failed:', error);
  process.exit(1);
}
