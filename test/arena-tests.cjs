/* Node tests for Squeek Arena logic (arena.js Logic export). */
const { Logic } = require('../arena.js');
let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

console.log('Levels and wallet pulls');
ok(Logic.normalizeAddress(' 0XABC ') === '0xabc', 'addresses are normalized');
{
  const pulls = {};
  ok(Logic.pullFor(pulls, '0xabc') === null, 'no pull recorded yet');
  ok(Logic.recordPull(pulls, '0xABC', 'shiro', 111) === true, 'first pull for a wallet records');
  ok(Logic.recordPull(pulls, '0xabc', 'momo', 222) === false, 'second pull for the same wallet is refused');
  ok(Logic.pullFor(pulls, '0xabc').partner === 'shiro', 'the recorded pull is the first hamster');
  ok(Logic.recordPull(pulls, '0xdef', 'goma', 333) === true, 'a different wallet can pull');
  ok(Logic.recordPull(pulls, '', 'momo', 1) === false, 'empty address cannot pull');
}
ok(Logic.levelFromXp(0) === 5 && Logic.levelFromXp(59) === 5 && Logic.levelFromXp(60) === 6, 'level from xp thresholds');
const st0 = Logic.statsFor('momo', 0);
ok(st0.level === 5 && st0.maxHp === 74 && st0.atk === 12, 'momo base stats Lv5 HP74 ATK12');

console.log('Gacha');
ok(Logic.gachaRoll(() => 0.0005) === 'aurum', 'roll under 0.001 is AURUM');
ok(Logic.gachaRoll(() => 0.2) === 'momo', 'roll 0.2 is momo');
ok(Logic.gachaRoll(() => 0.5) === 'shiro', 'roll 0.5 is shiro');
ok(Logic.gachaRoll(() => 0.9) === 'goma', 'roll 0.9 is goma');
{
  const rng = lcg(42);
  const counts = { momo: 0, shiro: 0, goma: 0, aurum: 0 };
  const N = 40000;
  for (let i = 0; i < N; i++) counts[Logic.gachaRoll(rng)]++;
  ok(counts.aurum > 5 && counts.aurum < 90, 'aurum rate about 1/1000 over 40k rolls (' + counts.aurum + ')');
  ok(counts.momo / N > 0.33 && counts.goma / N > 0.24, 'common hamsters fill the rest');
}

console.log('Damage');
{
  const rng = lcg(7);
  let min = 1e9, max = 0;
  for (let i = 0; i < 500; i++) {
    const d = Logic.bossDamage(Logic.BOSSES[Logic.BOSSES.length - 1], 2, rng);
    min = Math.min(min, d); max = Math.max(max, d);
  }
  ok(min >= 18 && max <= 26, 'final boss damage within buffed range (' + min + '..' + max + ')');
  const dStreak = Logic.playerDamage('momo', 0, { streak: 6, fast: false, rng: () => 0.99 });
  ok(dStreak === Math.round(12 * 1.5), 'streak 6 gives combo x1.5');
  const dCrit = Logic.playerDamage('momo', 0, { streak: 1, fast: true, rng: () => 0.1 });
  ok(dCrit === Math.round(12 * 1.8), 'fast answer can crit x1.8');
  const dRare = Logic.playerDamage('aurum', 0, { rng: () => 0.5 });
  ok(dRare >= 30 && dRare <= 36, 'aurum direct damage is the highest base');
}

console.log('Token economy');
ok(Logic.PULL_COST === 100, 'a gacha pull costs 100 tokens');
ok(Logic.bossTokenReward(Logic.BOSSES[0]) === 100, 'a normal boss pays 100 tokens');
ok(Logic.bossTokenReward(Logic.BOSSES[Logic.BOSSES.length - 1]) === 1000, 'the final boss pays 1000 tokens');
ok(Logic.BOSSES.length === 5, 'the ladder has 5 bosses');
ok(Logic.BOSSES.map(b => b.level).join(',') === '1,2,3,4,5', 'boss levels run 1 to 5');
ok(Logic.BOSSES.map(b => b.name).join(',') === 'BRAGI,THOTH,SARASWATI,ATHENA,NOUS', 'bosses are knowledge gods, weakest to wisest');

console.log('Questions');
for (const tier of ['dasar', 'menengah', 'sulit', 'ahli']) {
  const qs = Logic.QUESTIONS[tier];
  ok(qs.length >= 10, tier + ' has at least 10 questions');
  ok(qs.every(q => q.o.length === 4 && new Set(q.o).size === 4), tier + ' has 4 encoded options');
  ok(qs.every(q => Logic.makeOptions(q, () => 0).includes(Logic.correctTextOf(q))), tier + ' correct answer survives the codec');
}
{
  const live = Logic.buildLiveQuestions({ state: 'running', blockHeight: '8400', blockProgressPct: 30 });
  ok(live.length === 3 && Logic.correctTextOf(live[0]) === '8400' && Logic.correctTextOf(live[1]) === 'Yes, he is running', 'live questions built from status');
  ok(Logic.buildLiveQuestions(null).length === 0, 'no live questions without status');
}

console.log('Battle simulations (UI rules mirrored)');
// Returns true if the ladder is cleared. Player answers correctly with prob p.
function simulateLadder(p, seed, rare) {
  const rng = lcg(seed);
  let xp = 0;
  const ham = rare ? 'aurum' : 'momo';
  for (const boss of Logic.BOSSES) {
    let cleared = false;
    for (let attempt = 0; attempt < 40 && !cleared; attempt++) {
      const st = Logic.statsFor(ham, xp);
      let php = st.maxHp, bhp = boss.hp, streak = 0, snacks = 3;
      while (php > 0 && bhp > 0) {
        if (rare) {
          bhp -= Logic.playerDamage(ham, xp, { rng });
          xp += 25;
          if (bhp <= 0) break;
          php -= Logic.bossDamage(boss, 0, rng);
        } else if (rng() < p) {
          streak++;
          bhp -= Logic.playerDamage(ham, xp, { streak, fast: rng() < 0.3, rng });
          xp += 12;
        } else {
          streak = 0;
          if (snacks > 0 && php < st.maxHp * 0.35) { snacks--; php = Math.min(st.maxHp, php + 25); }
          php -= Logic.bossDamage(boss, 0, rng);
        }
      }
      if (bhp <= 0) { cleared = true; xp += rare ? 80 : 60; }
      else xp += 10;
    }
    if (!cleared) return false;
  }
  return true;
}
{
  let clears = 0;
  for (let s = 1; s <= 100; s++) if (simulateLadder(1.0, s, false)) clears++;
  ok(clears === 100, 'perfect quiz player always clears the ladder (' + clears + '/100)');
  clears = 0;
  for (let s = 1; s <= 100; s++) if (simulateLadder(0.7, s + 5000, false)) clears++;
  ok(clears >= 90, '70 percent accurate player clears within retries (' + clears + '/100)');
  clears = 0;
  for (let s = 1; s <= 100; s++) if (simulateLadder(0, s + 9000, true)) clears++;
  ok(clears >= 90, 'AURUM clears the ladder on direct attacks (' + clears + '/100)');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
