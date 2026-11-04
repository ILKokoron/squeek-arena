/* Squeek Arena: a Pokemon-style quiz battle ladder against Squeektoshi.
   Flow (designed with kokoron): pick a trainer (male or female), open the
   gacha box every player gets, then climb 5 boss levels. Correct answers make
   your hamster attack; wrong answers let the boss counter. Boss forms get
   scarier and questions harder per level. AURUM, the 1 in 1000 rare hamster,
   needs no questions: it attacks directly for the highest damage. Each wallet
   address gets exactly one free gacha pull, minted as a real NFT by the
   Squeek Arena Pets contract on Sepolia (extra pulls are paid mints).
   Beating NOUS shows the certified screen. Battle progress is local; pet
   ownership is onchain and read back from the contract. */
(function (global) {
'use strict';

/* ============================== DATA ============================== */
const BOSSES = [
  { id: 1, name: 'BRAGI',    level: 1, form: '1', hp: 55,  atk: 6,  tier: 'dasar',    seconds: 20 },
  { id: 2, name: 'THOTH',    level: 2, form: '2', hp: 85,  atk: 9,  tier: 'menengah', seconds: 18 },
  { id: 3, name: 'SARASWATI', level: 3, form: '3', hp: 125, atk: 12, tier: 'sulit',    seconds: 16 },
  { id: 4, name: 'ENKI',     level: 4, form: '4', hp: 175, atk: 16, tier: 'ahli',     seconds: 14 },
  { id: 5, name: 'NOUS',     level: 5, form: '5', hp: 240, atk: 20, tier: 'ahli',     seconds: 12 },
];
const HAMSTERS = {
  momo:  { name: 'MOMO',  kind: 'Golden hamster', atk: 12, hp: 74,  rare: false },
  shiro: { name: 'SHIRO', kind: 'Cream hamster',  atk: 11, hp: 82,  rare: false },
  goma:  { name: 'GOMA',  kind: 'Grey hamster',   atk: 13, hp: 68,  rare: false },
  aurum: { name: 'AURUM', kind: 'RARE · golden crowned hamster', atk: 30, hp: 120, rare: true },
};
const RARE_CHANCE = 0.001; // 1 in 1000 boxes, kokoron's twist
const TIER_LABEL = { dasar: 'Basic', menengah: 'Medium', sulit: 'Hard', ahli: 'Expert' };

const QUESTIONS = {
  dasar: [
    { q: 'Who powers Squeekchain by running on a wheel?', o: ['ph2cvR3alVWdxNFIkVWbh5GIyVGdz1WYoBSQ', '=0Wd1NWY2BCdvJ2byBSQ', '==Abl5WYwBichx2bzBSQ', 'uJXZ05WagQ3chZGI5JXZ2BSQ'], h: '9f8eea60' },
    { q: 'What is the name of Squeektoshi’s wheel?', o: ['==AMwATOZxURFh0V', 'wADMzACTFVESX9kQSVFV', '==AWgUUTPRkUFR1UNFES', 'PJFUgUETDl1QLVURVF1U'], h: 'cbfbfa36' },
    { q: 'Squeekchain runs as a testnet on which network?', o: ['==QYpx2bwV2Ug0WdlJXZoRXR', '==Adl5mbpFWbg0WdlJXZoRXR', '0Vmb0NXZ0Bibp92Y0lmQ', '==Adl5mdlRGIh5WYs92U'], h: '7c84f079' },
    { q: 'What is the Squeekchain token called?', o: ['LF1U', '==gTJ90QLVURVF1U', '==wUNFES', '=wURFh0V'], h: 'fe1f21e6' },
    { q: 'What kind of chain is Squeekchain?', o: ['=4Wahh2Y59GdgQWZyV2dvBHIyVGdz1WYoBSQ', '==gcldGZlxGIr5WYiBSQ', 'ulWYoNGIldWYy9GdzByb09GawBSQ', '=4Wahh2Ygcmbp1WYlJHdzByblRWa2BSQ'], h: '45b6cfff' },
    { q: 'When does Squeekchain produce new blocks?', o: ['sVWZodHIzlGag42bgU2YuFGdzlGZgMnclZ3bjBiclR3ctFGagUGa0Biblh2V', '==Adhh2dgIXZ0RXYtBybuBCLk52bjV2cgknclZXR', '0lGI0V3biFGIzR3cvBHIl52bl12bzBiblh2V', 'zlXYk52bNBibvBSes52T'], h: '9edd0847' },
    { q: 'Who is Squeektoshi?', o: ['=M3aj9GbiBSZoRHIzVmbp1GIvh2dgIXZ0NXbhhGIlhGV', '==gbpFGajtWZlVXcTBiZvByTFNEIlhGV', '==AdjFmc052bjBCdyFWbzBSQ', '==gclRnblNGIhRXYkBSYg4WagI3b0FGZpxWY2BSQ'], h: '5733ec01' },
    { q: 'Where can you watch Squeektoshi run?', o: ['=0WYlJHdzVmdpxGIzlGag42T', 'zdXZuBibvl2cpZXZsVGdg42T', '=EWbl5WajBSYg4WS', '=0WaoBCajRXY3BCdv5mbhNGI19WW'], h: '18ae789a' },
    { q: 'What badge do approved Genesis Code builders earn?', o: ['y92bv92bkxWa1JEIlhGV', '==gcl5mb1JFIlhGV', '=cmbptEIyVmbp1EIlhGV', '==gclR3ch1EIsVWZodFIlhGV'], h: '311d8d5d' },
    { q: 'In Squeek Arena, how do you damage Squeektoshi?', o: ['=kHb0NWZyJ3bjBycu9Wa0NXZ1FHIn5WayV2dz5WYgknQ', 'lxmYpN3cvBHIzFGI0NXYmBychByZulGcwFGdgknQ', '5xGdllWdxByZulGdpF2dgknQ', '==QZnFGcgUGa0ByZulGazVmcmVmcgknQ'], h: 'b9209052' },
  ],
  menengah: [
    { q: 'How much SQK is issued per completed block?', o: ['LF1UgADM5wiN', 'LF1UgkjN', '=sUUTBCMwADLwkjN', 'LF1UgEjM'], h: '79e09b83' },
    { q: 'What is the total supply cap of SQK?', o: ['=42bpxGbpJGIx4iM', '==gbvlGbslWbgEjM', '=42bpxGbpJGIwEjM', 'wF2Yg8mbgMXagUmclhGV'], h: 'e67571d5' },
    { q: 'How long is one Squeekchain round?', o: ['=MHZu92YlNHIwAjN', '==wck52bjV2cgAjN', '==wck52bjV2cgADMwwiN', '=Mnc19GagQjM'], h: '06c18528' },
    { q: 'How many block units make one full Squeek block?', o: ['==AMwADLwADMsADMwwSM', 'wADMsADMwwSM', '=ADMwwSM', '==AMwADLwADMsEjM'], h: 'a5f2f180' },
    { q: 'What is the Sepolia chain ID used by Squeekchain?', o: ['=ETMxUTNxETM', '==QM', '=UTNxETM', '==AMwATO'], h: '1a58e1d5' },
    { q: 'Which contract is the core of the chain?', o: ['==QZy92QrVWZ1F3U', 'yVGd19mUrVWZ1F3U', 'sVWZodVZy92Q', '=UmcvNkclR3ctFGS'], h: '8de68430' },
    { q: 'Which API endpoint returns the hamster’s recorded run segments?', o: ['=Mnb1J3L05WZtVmc1NXYl12LxY3L', '==wcrN2bsJ2LxY3L', 'z9WZklmdvIXZ0NXbhh2LxY3L', '=kncvR3cph2LsVWZod3LxY3L'], h: '081d4d4b' },
    { q: 'What does the public Squeekchain API cost to use?', o: ['5V2ag8mbgMHZlVmbgQmbhBSZlJnZgMXagQXS', 'sxWYjBiclBHILF1UgATM', '==gbvlGdwlmcjNnY1NHI5xGa052btBSQ', '=wGbhNGIyVGcgs2Yh52cgIXZ0NXbhhGIl52T'], h: '9c15112a' },
    { q: 'What are recorded run segments with passages used for?', o: ['==wcuVncgwWYlJHIzlGagcmbpRXYtlmbhBCZuFGIn5Wa5FGbwVmU', '==wSRNFIhJHd4VGIn5WaulWT', '==gclR3ctFGagUGa0ByZulGZlVmR', 'zRlROByZulGdulWT'], h: '569e719d' },
    { q: 'What happens to Genesis verification records after approval?', o: ['5xWahRGIkV2ajVGajVmcgUmchBSelhGV', '==gbpF2ZhBCZlt2Ylh2YgIXZ2VmbgUmchBSelhGV', '=IXdvhGIl52bgIXZ0ZWYgUmcpBHelBSelhGV', 'lNmbvBCdhBCZlRXZsVGZgUmchBSelhGV'], h: '618707ae' },
  ],
  sulit: [
    { q: 'What does passages[].offsetNs record in a run segment?', o: ['ldWYzNXYwBCblVGa3BCajFWZgY2bgUWbpRHI0NWY4VGIlhGV', '=UGdhJHI0JXYlhGIzlJgiLXZ0NXbhhGIlhGV', '==AZyF2dlJHIrN2bsJGIlhGV', 'lJXd0FmclBXblRHIsVWZodHIlhGV'], h: '5c4d0689' },
    { q: 'If the API returns status "unavailable" with HTTP 200, what does it mean?', o: ['==wbyVmegMXYgQXagc3boNHIyVmdl5GIs42dv52auVHIzlGIlVHbhZHIlhGV', '=8mclpHIzlGIlVHbhZHIlhGV', '==gclZXZy9mZg4WZr9mciBycpBSSQFEIlhGV', '==AZlBXYjNXZgIXZ0NXbhhGIlhGV'], h: '9d54168d' },
    { q: 'How should big numbers from the API be parsed?', o: ['==wcn5WayR3cgwWYtl2YlRGIt9mcmBCL05WSnlmQgMXQ', '==wcyVmYtVnbgQnbp9GcgcmbpRXYvxmZgMXQ', '==Ad4VGdgQncvh2cgMXQ', '0NncpZGIud3bkBCZlRmb19mU'], h: '5cc1300d' },
    { q: 'Which contract handles mining rewards and settlements?', o: ['n5WaulWTrVWZ1F3U', '=QHb1FmVrVWZ1F3U', '==QZy92Qn5WaulWT', '=wWZlh2VkJXY3VmU'], h: 'cf251ff3' },
    { q: 'What is the NFT contract of Squeekchain called?', o: ['UZkTrVWZ1F3U', '0JXQrVWZ1F3U', '==AVG5kclR3ctFGS', 'wADM5wWZlh2VUZkT'], h: '88a1ff6d' },
    { q: 'What happens if you remove your DNS record, page tag or repository line after approval?', o: ['==Adz9GbgUmYg4WYjBSZnRWYiBSZoRHIk5WYgMHbpFmZgQ3Ylp2byBHIlhGV', '=wGbhBCdhByZulGa09mT', '=IXY0NHIn5WauJXY3BSYg4mchVGI19WW', '05WZuFWbyVGcgMXZt92YlJGIldGZhJGIlhGV'], h: 'bc5bb152' },
    { q: 'Run segment data is best described as what?', o: ['=smcvdHIkVWamlGdyV2YgUmcvN0alVWdxNFI09mbgwSZj5WZklmdlBCZl52ZpNHIlNWa2VGR', '=smcvdHIrN2bsJGIkVWamlGdyV2YgkHbsVnR', '==AdjFmc052bjBCbhdWZsBSQ', '=UGbpZGIhRXYkFGdl1GIUZkTg4WQ'], h: '3775e76a' },
    { q: 'When does the Genesis badge start counting?', o: ['==gbvl2czlWbiV3cg02byZGI09mbgwCbhZ3byBHchBSbvJnR', 'u9WazNXatJWdzBSbvJnR', '0lWbt92YgQ3cylmZgUGa0BSbvJnR', 'u9Wa0FWZyNGI05WdvN2YhBSbvJnR'], h: '93267ec1' },
    { q: 'What should an app check in every API response?', o: ['=42bpNnclZVYtVGajNHIlhGV', '==QZtVGajNHIy9GbvNGIlhGV', '=UmepNHIlNnbvB3clJHIlhGV', 'l1WYuBiclZnclNHIlhGV'], h: '7e3d5b71' },
    { q: 'Which endpoint gives the live wheel state, speed and distance?', o: ['==wc1RXY0N3LxY3L', 'zRXY0N3LxY3L', '=Umdpx2LxY3L', '==QbhN2LsVWZod3LxY3L'], h: 'b380fd56' },
  ],
  ahli: [
    { q: 'How many confirmations does the chain target before data is treated as safe?', o: ['=ITM', '==QM', '==wM', 'wATM'], h: '1deb2d6a' },
    { q: 'What does the builder anchor in /v1/status describe?', o: ['vRHIkVmcvh2YuFGIzlGIulWYoNGIlhGdgM3clJ3ZvJHcgQmbhBCdodWalhGIrN2bsJGIlhGV', '=42bpRXaz9GcgU2ZhNGIzlJgiLXZ0NXbhhGIlhGV', '=QlROBicvh2YuFGIwlGazBSQ', '=UGbn5WYgEmcl1WYjBSbhVmc0NHIlhGV'], h: '4e25542b' },
    { q: 'What does blockProgress measure?', o: ['zRXauVHIrN2bsJGIulGIss2YvxmYgQnblJnc1NGIlhGdgcmbpRXZsBXbvNGIkJXY39GdgM3clJ3ZvJHU', '=wWZ2VGbgknclRHdhJGIzlJgiLXZ0NXbhhGIlhGV', '==gchJGIkF2bsBXdg4WQ', '=IXZmZWdiBSbhVmc0NHIlhGV'], h: '56395c19' },
    { q: 'If the API freshness is not "online", how should live data be treated?', o: ['lZXasBCdv5GIsUGbhR3cgMXQ', '=kXY3lnbhBSZ2lGbgMXQ', '==wbyVmegMXQ', '09GcrNWYqBSYgMXQ'], h: 'f49ac7bd' },
    { q: 'What deployment target network name appears in the API data?', o: ['==QYpx2bwV2c', '==Adl5mbpFWb', '==QerNXZs9Ga', 'pxmcl92Z'], h: '5ac7b822' },
    { q: 'Fan game race results are not certified. What does that mean?', o: ['==gbpFGaj52bgQWZkJ3bjVmcgQ3buBCLuVnZgwWYj9GbgUmchBSelhGV', '==AZyF2dlJHIrN2bsJGIlhGdgU2ZuFGajBSelhGV', '==wSRNFI05WatBSelhGV', 'uVGZklmYy9mZgUmchBSelhGV'], h: '450dcfea' },
    { q: 'Which of these is on the official "skip this" list for Genesis projects?', o: ['zJXZwBXYydHIJBVQg4WaoRHIk5WYgMHZyF2bih2chRGI5xmbvBCZhVmU', '=MXZtF2R', '=MHdvJGI5RXauVXbt92Q', 'zBHchBibvlGdjlGZlJHU'], h: 'b69b3f26' },
    { q: 'What kind of submission can get an account banned?', o: ['tJXYGBSYyVXQgUGa0BSZtF2Zg8GdgUGZh1GIw9GbzBCdy9mZmVGI39GT', '0JXYgwWZ4lGcggGdpdHIl1WYnBSQ', '=4WZr9Gdg8mbggGdpdHI0NWZq9mcwBSQ', '==QRNRUQFJFIn52bsBSYggGdpdHI0NWZq9mcwBSQ'], h: 'a18c631f' },
    { q: 'How is SQK issuance bounded over time?', o: ['==AchNGIu9WasxWaiBSMuIDIlhGdgwWa05Wdgwyaj9GbiBCZlRXZsBXbvNGIyVGcgADM5wiN', 'n5Wa05WayBHIkVGdp1Was5WV', '=sWZldHI5JXZ2VGIn5Wa2xWYoBSQ', '=MncldXZpZHItFWZyR3clZXasBSeiBCZlRWajVGR'], h: 'add5b0ce' },
    { q: 'In the API, amounts like distance and rewards are returned as what?', o: ['ldmbhJHI0F2bsZGIlZWYzBCZlV2Y4VGIuF2YgQXYoRHIzdmbpJHdzBCbh1WajVGR', '==wcy9GbvNGI4VGS', 'zlmav1WR', '=MXZnFWbpBCZlN3clJHct92Q'], h: '6c6558c7' },
  ],
};

/* ============================== LOGIC ============================== */
function levelFromXp(xp) { return Math.min(99, 5 + Math.floor(Math.max(0, xp) / 60)); }
function statsFor(hamsterId, xp) {
  const base = HAMSTERS[hamsterId];
  const level = levelFromXp(xp);
  const gain = level - 5;
  return {
    level,
    maxHp: base.hp + gain * 7,
    atk: base.atk + Math.round(gain * 1.5),
    baseAtk: base.atk,
  };
}
function playerDamage(hamsterId, xp, opts) {
  opts = opts || {};
  const rng = opts.rng || Math.random;
  const st = statsFor(hamsterId, xp);
  let dmg = st.atk;
  if (HAMSTERS[hamsterId].rare) {
    dmg = Math.round(dmg * (1 + rng() * 0.2));
  } else {
    const streak = Math.max(1, opts.streak || 1);
    dmg = dmg * (1 + Math.min(0.5, (streak - 1) * 0.1));
    let crit = false;
    if (opts.fast && rng() < 0.35) { dmg *= 1.8; crit = true; } // critical hit for a fast correct answer
    if (opts.out) opts.out.crit = crit;
    dmg = Math.round(dmg);
  }
  return Math.max(1, dmg);
}
function normalizeAddress(addr) { return String(addr || '').trim().toLowerCase(); }
function pullFor(pulls, addr) {
  if (!pulls) return null;
  return pulls[normalizeAddress(addr)] || null;
}
function recordPull(pulls, addr, hamsterId, at) {
  const key = normalizeAddress(addr);
  if (!key || !pulls || pulls[key]) return false;
  pulls[key] = { partner: hamsterId, at: at || 0 };
  return true;
}
/* Pet NFT contract (Squeek Arena Pets, Sepolia, deployed 2026-11-04).
   The first pull is a free mint (gas only), extra pulls are paid mints at
   priceEth. The contract rolls the species at mint time, so the hamster
   revealed in the gacha is always the exact pet that was minted. */
const PET_CONTRACT = { address: '0x3ac243475b0D782a05B40Eb9546E25bb986BB6DD', chainId: 11155111, priceEth: '0.002' };
const MINT_MAX = 10;
function mintTotalEth(qty) { return (qty * Number(PET_CONTRACT.priceEth)).toFixed(3); }
function mintChargeEth(qty, firstFree) { return mintTotalEth(Math.max(0, qty - (firstFree ? 1 : 0))); }
const PET_SPECIES = ['momo', 'shiro', 'goma', 'aurum'];
const PET_SEL = { freeMint: '0x5b70ea9f', mintBatch: '0x20e409b4', petOf: '0xa8379ea2',
                  freeMintUsed: '0x456cc814', tokensOf: '0x5a3f2672', speciesOf: '0xd27b3930' };
function encAddress(a) { return normalizeAddress(a).slice(2).padStart(64, '0'); }
function encUint(n) { return BigInt(n).toString(16).padStart(64, '0'); }
function wordAt(hex, i) { const h = String(hex || '').replace(/^0x/, ''); return h.slice(i * 64, i * 64 + 64) || '0'; }
function decodePetOf(hex) {
  if (!hex || String(hex).length < 194) return { tokenId: 0, species: 0, has: false };
  return { tokenId: Number(BigInt('0x' + wordAt(hex, 0))),
           species: Number(BigInt('0x' + wordAt(hex, 1))),
           has: BigInt('0x' + wordAt(hex, 2)) !== 0n };
}
function decodeBool(hex) {
  if (!hex || hex === '0x') return false;
  try { return BigInt(hex) !== 0n; } catch (e) { return false; }
}
function decodeUintArray(hex) {
  if (!hex || String(hex).length < 130) return [];
  const len = Number(BigInt('0x' + wordAt(hex, 1)));
  const out = [];
  for (let i = 0; i < len && i < 200; i++) out.push(Number(BigInt('0x' + wordAt(hex, 2 + i))));
  return out;
}
function ethToWei(str) {
  const parts = String(str).split('.');
  const whole = parts[0] || '0';
  const frac = ((parts[1] || '') + '000000000000000000').slice(0, 18);
  return BigInt(whole) * (10n ** 18n) + BigInt(frac || '0');
}
function ethToWeiHex(str) { return '0x' + ethToWei(str).toString(16); }
function bossDamage(boss, liveBuff, rng) {
  rng = rng || Math.random;
  return Math.max(1, Math.round((boss.atk + (liveBuff || 0)) * (0.85 + rng() * 0.3)));
}
function gachaRoll(rng) {
  rng = rng || Math.random;
  const r = rng();
  if (r < RARE_CHANCE) return 'aurum';
  if (r < 0.381) return 'momo';
  if (r < 0.711) return 'shiro';
  return 'goma';
}
function shuffle(arr, rng) {
  rng = rng || Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function fnv(str) { let h = 0x811c9dc5; const s = String(str); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
function hashAnswer(text) { return fnv(text); }
function encOpt(s) { const b = btoa(unescape(encodeURIComponent(String(s)))); return b.split('').reverse().join(''); }
function decOpt(s) { const b = String(s).split('').reverse().join(''); return decodeURIComponent(escape(atob(b))); }
function encodeQuestion(q, a, w) { return { q, o: [a].concat(w).map(encOpt), h: hashAnswer(a) }; }
function correctTextOf(question) { for (const o of question.o) { const t = decOpt(o); if (hashAnswer(t) === question.h) return t; } return ''; }
function makeOptions(question, rng) {
  return shuffle(question.o.map(decOpt), rng);
}
function buildLiveQuestions(st) {
  if (!st) return [];
  const out = [];
  if (st.blockHeight != null && st.blockHeight !== '') {
    const h = Number(st.blockHeight);
    if (isFinite(h)) {
      out.push(encodeQuestion('LIVE: what is the Squeekchain block height right now?', String(h),
        [String(h + 3), String(Math.max(0, h - 2)), String(h + 10)]));
    }
  }
  out.push(encodeQuestion('LIVE: is Squeektoshi running on the wheel right now?',
    st.state === 'running' ? 'Yes, he is running' : 'No, he is resting',
    [st.state === 'running' ? 'No, he is resting' : 'Yes, he is running', 'He is sleeping all day', 'He only runs on Sundays']));
  if (st.blockProgressPct != null) {
    const p = Math.round(st.blockProgressPct);
    out.push(encodeQuestion('LIVE: how far is the current block toward completion?', p + '%',
      [Math.min(99, p + 15) + '%', Math.max(0, p - 12) + '%', Math.min(99, p + 40) + '%']));
  }
  return out;
}

const Logic = { BOSSES, HAMSTERS, QUESTIONS, RARE_CHANCE,
                levelFromXp, statsFor, playerDamage, bossDamage, gachaRoll,
                shuffle, makeOptions, buildLiveQuestions,
                normalizeAddress, pullFor, recordPull, PET_CONTRACT, mintTotalEth, mintChargeEth, MINT_MAX,
                PET_SPECIES, PET_SEL, encAddress, encUint, decodePetOf, decodeBool,
                decodeUintArray, ethToWei, ethToWeiHex,
                fnv, hashAnswer, encOpt, decOpt, encodeQuestion, correctTextOf };
if (typeof module !== 'undefined' && module.exports) module.exports = { Logic };
if (typeof document === 'undefined') return;

/* ============================== UI ============================== */
/* Screen-based navigation: exactly one screen is visible at a time.
   home -> howto | trainer -> aura -> gacha -> ladder -> battle -> certified */
const SPR = global.SQUEEK_SPRITES;
if (!SPR) return;
const $ = id => document.getElementById(id);
const els = {
  btnPlay: $('btnPlay'), btnHowto: $('btnHowto'), btnResetHome: $('btnResetHome'),
  btnCollection: $('btnCollection'), btnSound: $('btnSound'), btnShop: $('btnShop'),
  shopBoxCanvas: $('shopBoxCanvas'), shopBuy: $('shopBuy'),
  mintMinus: $('mintMinus'), mintPlus: $('mintPlus'), mintQty: $('mintQty'), mintTotal: $('mintTotal'),
  shopMsg: $('shopMsg'), shopBack: $('shopBack'), gachaShop: $('gachaShop'), certNote: $('certNote'),
  shopConnect: $('shopConnect'),
  chooseList: $('chooseList'), chooseBack: $('chooseBack'), chooseBoss: $('chooseBoss'),
  collectionNote: $('collectionNote'), collectionBack: $('collectionBack'),
  colCanvas_Momo: $('colCanvasMomo'), colName_Momo: $('colNameMomo'), colNote_Momo: $('colNoteMomo'),
  colCanvas_Shiro: $('colCanvasShiro'), colName_Shiro: $('colNameShiro'), colNote_Shiro: $('colNoteShiro'),
  colCanvas_Goma: $('colCanvasGoma'), colName_Goma: $('colNameGoma'), colNote_Goma: $('colNoteGoma'),
  colCanvas_Aurum: $('colCanvasAurum'), colName_Aurum: $('colNameAurum'), colNote_Aurum: $('colNoteAurum'),
  howtoBack: $('howtoBack'),
  trainerMale: $('arenaTrainerMale'), trainerFemale: $('arenaTrainerFemale'),
  maleCanvas: $('arenaMaleCanvas'), femaleCanvas: $('arenaFemaleCanvas'),
  trainerHint: $('trainerHint'), trainerBack: $('trainerBack'), trainerNext: $('trainerNext'),
  boxCanvas: $('arenaBoxCanvas'),
  stage: $('gachaStage'), prompt: $('gachaPrompt'), rays: $('gachaRays'), flash: $('gachaFlash'), dim: $('gachaDim'),
  nav: $('gachaNav'),
  partnerBox: $('arenaPartner'), partnerCanvas: $('arenaPartnerCanvas'),
  partnerName: $('arenaPartnerName'), partnerStats: $('arenaPartnerStats'),
  gachaBack: $('gachaBack'), gachaNext: $('gachaNext'),
  summary: $('arenaSummary'), bossList: $('arenaBossList'),
  ladderHome: $('ladderHome'), ladderEdit: $('ladderEdit'), gotoCertified: $('arenaGotoCertified'),
  bossCanvas: $('arenaBossCanvas'), playerCanvas: $('arenaPlayerCanvas'), trainerCanvas: $('arenaTrainerCanvas'),
  bossName: $('pkBossName'), bossLv: $('pkBossLv'), bossHpFill: $('pkBossHpFill'), bossHpText: $('pkBossHpText'),
  playerName: $('pkPlayerName'), playerLv: $('pkPlayerLv'), playerHpFill: $('pkPlayerHpFill'),
  playerHpText: $('pkPlayerHpText'), msg: $('arenaMsg'), q: $('arenaQ'),
  answers: $('arenaAnswers'), timerFill: $('arenaTimerFill'),
  snack: $('arenaSnack'), run: $('arenaRun'), attack: $('arenaAttack'),
  shareBtn: $('arenaShareBtn'), shareCanvas: $('arenaShareCanvas'),
  certLadder: $('certLadder'), certHome: $('certHome'),
  hudWallet: $('hudWallet'), hudBoss: $('hudBoss'), hudLive: $('hudLive'),
  connectPanel: $('walletPanel'), connectBtn: $('walletConnect'), walletMsg: $('walletMsg'),
  walletChip: $('walletChip'), walletAddr: $('walletAddr'), disconnectBtn: $('walletDisconnect'),
  usedNote: $('gachaUsedNote'),
  menuCursor: $('menuCursor'), hillCanvas: $('hillCanvas'), bushCanvas: $('bushCanvas'),
};
const SCREENS = ['screenHome', 'screenHowto', 'screenTrainer',
                 'screenGacha', 'screenLadder', 'screenBattle', 'screenCertified', 'screenCollection', 'screenShop', 'screenChoose'];
function showScreen(id) {
  for (const s of SCREENS) { const el = $(s); if (el) el.hidden = s !== id; }
  if (id === 'screenGacha') syncGacha();
  window.scrollTo(0, 0);
}

function paint(canvas, grid, pal, px) {
  if (!canvas || !grid) return;
  canvas.width = grid[0].length * px;
  canvas.height = grid.length * px;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const col = pal[grid[y][x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * px, y * px, px, px);
    }
  }
}

/* ---------- persistent state ---------- */
const SAVE_KEY = 'squeekArenaV1';
const REG_KEY = 'squeekArenaPullsV1';
function defaultState() {
  return { trainer: null, partner: null, opened: false, xp: 0, defeated: [], certified: false, collection: {}, boxes: 0, wallet: null, pulls: {}, pendingPulls: 0, activeTokenId: null };
}
function storeSigned(key, obj) {
  try { localStorage.setItem(key, JSON.stringify({ d: obj, s: fnv(JSON.stringify(obj) + '|sqk-arena-v1') })); } catch (e) {}
}
function loadSigned(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.d && typeof parsed.s === 'string') {
      return fnv(JSON.stringify(parsed.d) + '|sqk-arena-v1') === parsed.s ? parsed.d : 'TAMPERED';
    }
    return parsed; // legacy unsigned data, accepted once and re-saved signed
  } catch (e) { return null; }
}
function loadRegistry() {
  const reg = loadSigned(REG_KEY);
  return reg && reg !== 'TAMPERED' && typeof reg === 'object' ? reg : null;
}
// One-time clean slate for the onchain launch (2026-11-04): pets are real
// NFTs now, so legacy browser-only progress (local gacha partners and the
// local pull registry) is wiped once, on first load of this build.
try {
  if (!localStorage.getItem('squeekArenaChainResetV1')) {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(REG_KEY);
    localStorage.setItem('squeekArenaChainResetV1', '1');
  }
} catch (e) {}
let S = defaultState();
{
  const data = loadSigned(SAVE_KEY);
  if (data && data !== 'TAMPERED') S = Object.assign(defaultState(), data);
  const reg = loadRegistry();
  if (reg) S.pulls = reg;
  else if (S.pulls && Object.keys(S.pulls).length) storeSigned(REG_KEY, S.pulls);
  if ('pendingPullFor' in S) { if (S.pendingPullFor) S.pendingPulls = Math.max(S.pendingPulls || 0, 1); delete S.pendingPullFor; }
  if (!S.pendingPulls) S.pendingPulls = 0;
}
if (S.partner) { if (!S.collection) S.collection = {}; S.collection[S.partner] = true; }
function save() { storeSigned(SAVE_KEY, S); storeSigned(REG_KEY, S.pulls || {}); }
window.addEventListener('storage', (e) => {
  if (!e || !e.key) return;
  if (e.key === REG_KEY) { const reg = loadRegistry(); if (reg) { S.pulls = reg; renderAll(); } return; }
  if (e.key !== SAVE_KEY || battle) return;
  const data = loadSigned(SAVE_KEY);
  if (data && data !== 'TAMPERED') { S = Object.assign(defaultState(), data); renderAll(); }
});

let liveBuff = 0;
let liveQuestions = [];
let battle = null;
let timerId = null;

function playerStats() { return S.partner ? statsFor(S.partner, S.xp) : null; }

function renderAll() {
  paint(els.maleCanvas, SPR.trainers.male, SPR.trainerPal, 4);
  paint(els.femaleCanvas, SPR.trainers.female, SPR.trainerPal, 4);
  paint(els.boxCanvas, SPR.box, SPR.boxPal, 7);
  els.trainerMale.classList.toggle('selected', S.trainer === 'male');
  els.trainerFemale.classList.toggle('selected', S.trainer === 'female');
  els.trainerHint.textContent = S.trainer ? 'Trainer picked. Hit Next.' : 'Choose one to continue.';
  if (S.partner) {
    const st = playerStats();
    paint(els.partnerCanvas, SPR.hamsters[S.partner], SPR.hamsterPals[S.partner], 6);
    els.partnerName.textContent = HAMSTERS[S.partner].name + (HAMSTERS[S.partner].rare ? ' · RARE 1/1000' : '');
    els.partnerStats.textContent = HAMSTERS[S.partner].kind + ' · Lv ' + st.level +
      ' · HP ' + st.maxHp + ' · ATK ' + st.atk;
  }
  syncGacha();
  renderCollection();
  renderMint();
  if (!S.wallet) els.btnPlay.textContent = 'CONNECT WALLET';
  else if (S.certified || S.partner) els.btnPlay.textContent = 'CONTINUE';
  else els.btnPlay.textContent = 'PLAY';
  els.hudWallet.textContent = 'WALLET ' + (S.wallet ? shortAddr(S.wallet).toUpperCase() : 'NONE');
  els.hudBoss.textContent = 'BOSS ' + S.defeated.length + '/' + BOSSES.length;
  renderLadder();
}

function unlocked(boss) { return boss.id === 1 || S.defeated.includes(boss.id - 1); }
function renderLadder() {
  const ready = S.trainer && S.partner && S.wallet;
  els.summary.textContent = '';
  els.bossList.innerHTML = '';
  for (const boss of BOSSES) {
    const card = document.createElement('div');
    card.className = 'arena-boss-card';
    const cv = document.createElement('canvas');
    cv.className = 'pixel-sprite';
    paint(cv, SPR.bossForms[boss.form], SPR.bossPals[boss.form], 2);
    card.appendChild(cv);
    const info = document.createElement('div');
    const done = S.defeated.includes(boss.id);
    info.innerHTML = '<strong>' + boss.name + '</strong> · Lv ' + boss.level + '<br>' +
      '<span class="hint">Questions: ' + TIER_LABEL[boss.tier] + ' · HP ' + boss.hp + ' · ATK ' + (boss.atk + liveBuff) + '</span>';
    card.appendChild(info);
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = done ? 'Beaten · replay' : (unlocked(boss) && ready ? 'Challenge' : 'Locked');
    btn.disabled = !ready || !unlocked(boss);
    btn.addEventListener('click', () => challengeBoss(boss));
    card.appendChild(btn);
    els.bossList.appendChild(card);
  }
  els.gotoCertified.hidden = !S.certified;
}

/* ---------- navigation ---------- */
els.btnPlay.addEventListener('click', async () => {
  if (!S.wallet) {
    await connectWallet();
    if (!S.wallet) {
      els.btnPlay.textContent = 'NO WALLET FOUND';
      setTimeout(() => renderAll(), 2600);
    }
    return;
  }
  if (!S.trainer) showScreen('screenTrainer');
  else if (!S.partner) showScreen('screenGacha');
  else showScreen('screenLadder');
});
els.btnHowto.addEventListener('click', () => showScreen('screenHowto'));
els.btnCollection.addEventListener('click', () => showScreen('screenCollection'));
els.btnShop.addEventListener('click', () => showScreen('screenShop'));
els.collectionBack.addEventListener('click', () => showScreen('screenHome'));
els.btnSound.addEventListener('click', () => {
  soundOn = !soundOn;
  try { localStorage.setItem('squeekArenaSound', soundOn ? 'on' : 'off'); } catch (e) {}
  syncSoundLabel();
  if (soundOn) sfx('jingle');
});
els.howtoBack.addEventListener('click', () => showScreen('screenHome'));
function twoStep(btn, label, action) {
  if (btn.dataset.armed === '1') {
    btn.dataset.armed = '';
    btn.textContent = label;
    action();
    return;
  }
  btn.dataset.armed = '1';
  btn.textContent = 'Click again to confirm';
  setTimeout(() => { btn.dataset.armed = ''; btn.textContent = label; }, 3000);
}
els.btnResetHome.addEventListener('click', () => {
  twoStep(els.btnResetHome, 'Reset progress', () => {
    const keepPulls = S.pulls || {};
    const keepPending = S.pendingPulls || 0;
    S = defaultState();
    S.pulls = keepPulls; // one pull per wallet survives a progress reset
    S.pendingPulls = keepPending;
    save(); renderAll();
  });
});
els.trainerMale.addEventListener('click', () => { S.trainer = 'male'; save(); renderAll(); });
els.trainerFemale.addEventListener('click', () => { S.trainer = 'female'; save(); renderAll(); });
els.trainerBack.addEventListener('click', () => showScreen('screenHome'));
els.trainerNext.addEventListener('click', () => {
  if (!S.trainer) { els.trainerHint.textContent = 'Pick a trainer first.'; return; }
  showScreen('screenGacha');
});
els.gachaBack.addEventListener('click', () => showScreen('screenTrainer'));
els.gachaNext.addEventListener('click', () => showScreen('screenLadder'));
els.ladderHome.addEventListener('click', () => showScreen('screenHome'));
els.ladderEdit.addEventListener('click', () => showScreen('screenTrainer'));
els.gotoCertified.addEventListener('click', () => showCertified());
els.certHome.addEventListener('click', () => showScreen('screenHome'));
els.certLadder.addEventListener('click', () => showScreen('screenLadder'));

/* ---------- retro sound engine (WebAudio, no files) ---------- */
const WIN = typeof window !== 'undefined' ? window : globalThis;
let actx = null;
let soundOn = true;
try { soundOn = localStorage.getItem('squeekArenaSound') !== 'off'; } catch (e) {}
function ac() {
  try {
    const AC = WIN.AudioContext || WIN.webkitAudioContext;
    if (!AC) return null;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null; }
}
function tone(freq, delay, dur, type, vol, slide) {
  if (!soundOn) return;
  const c = ac(); if (!c) return;
  const t = c.currentTime + (delay || 0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(vol || 0.045, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
function sfx(name) {
  if (!soundOn) return;
  if (name === 'click') tone(700, 0, 0.06, 'square', 0.035);
  else if (name === 'tick') tone(190, 0, 0.03, 'square', 0.022);
  else if (name === 'pop') tone(240, 0, 0.14, 'square', 0.06, 920);
  else if (name === 'jingle') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.12, 'square', 0.05));
  else if (name === 'fanfare') { [392, 523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.09, 0.16, 'square', 0.055)); tone(262, 0, 0.5, 'triangle', 0.03); }
  else if (name === 'hit') tone(170, 0, 0.09, 'sawtooth', 0.06, 70);
  else if (name === 'crit') { tone(880, 0, 0.16, 'sawtooth', 0.06, 140); tone(170, 0.02, 0.1, 'sawtooth', 0.05, 70); }
  else if (name === 'hurt') tone(300, 0, 0.16, 'square', 0.05, 110);
  else if (name === 'heal') [440, 554, 659].forEach((f, i) => tone(f, i * 0.06, 0.1, 'triangle', 0.05));
  else if (name === 'win') [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.15, 'square', 0.05));
  else if (name === 'lose') [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.13, 0.18, 'square', 0.05));
}
document.addEventListener('click', (e) => {
  if (e.target && e.target.closest && e.target.closest('button')) sfx('click');
});
function syncSoundLabel() { els.btnSound.textContent = soundOn ? 'SOUND ON' : 'SOUND OFF'; }

/* ---------- battle juice: floating damage numbers ---------- */
function floatDmg(text, cls, targetCanvas) {
  const host = $('screenBattle');
  if (!host) return;
  const d = document.createElement('div');
  d.className = 'dmg-float ' + cls;
  d.textContent = text;
  if (targetCanvas && targetCanvas.getBoundingClientRect) {
    const r = targetCanvas.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    d.style.left = Math.max(4, r.left - h.left + r.width * 0.5) + 'px';
    d.style.top = Math.max(4, r.top - h.top + 2) + 'px';
  }
  host.appendChild(d);
  setTimeout(() => d.remove(), 1250);
}
function shakeBattle() {
  const host = $('screenBattle');
  if (!host) return;
  host.classList.add('shake-it');
  setTimeout(() => host.classList.remove('shake-it'), 320);
}

/* ---------- collection ---------- */
function silhouettePal(grid) {
  const pal = {};
  for (const row of grid) for (const ch of row) if (ch !== '.') pal[ch] = '#3d3d3d';
  return pal;
}
function renderCollection() {
  let got = 0;
  for (const id of Object.keys(HAMSTERS)) {
    const cap = id.charAt(0).toUpperCase() + id.slice(1);
    const cv = els['colCanvas_' + cap], nm = els['colName_' + cap], nt = els['colNote_' + cap];
    if (!cv) continue;
    const owned = !!(S.collection && S.collection[id]);
    if (owned) {
      got++;
      paint(cv, SPR.hamsters[id], SPR.hamsterPals[id], 4);
      nm.textContent = HAMSTERS[id].name;
      nt.textContent = HAMSTERS[id].kind;
    } else {
      paint(cv, SPR.hamsters[id], silhouettePal(SPR.hamsters[id]), 4);
      nm.textContent = '???';
      nt.textContent = HAMSTERS[id].rare ? 'RARE · 1 in 1000 boxes' : 'Not pulled yet';
    }
  }
  els.collectionNote.textContent = 'Collected ' + got + ' of 4 · Boxes opened: ' + (S.boxes || 0);
}

/* ---------- gacha ---------- */
let gachaOpening = false;
function shortAddr(a) { return a ? a.slice(0, 6) + '..' + a.slice(-4) : ''; }
function currentPull() { return S.wallet ? pullFor(S.pulls, S.wallet) : null; }
function syncGacha() {
  const pull = currentPull();
  const hasWallet = !!S.wallet;
  const opened = !!pull;
  els.connectPanel.hidden = hasWallet;
  els.walletChip.hidden = !hasWallet;
  if (hasWallet) els.walletAddr.textContent = shortAddr(S.wallet);
  els.boxCanvas.hidden = !(hasWallet && !pull);
  els.prompt.hidden = !(hasWallet && !pull);
  if (hasWallet && !pull && !gachaOpening) els.prompt.textContent = 'CLICK BOX TO OPEN';
  els.partnerBox.hidden = !opened;
  els.rays.hidden = !opened;
  els.nav.hidden = false;
  els.gachaNext.hidden = !(opened || S.partner);
  els.usedNote.hidden = !opened;
  if (opened) {
    els.usedNote.textContent = 'Wallet ' + shortAddr(S.wallet) + ' used its one pull: ' +
      HAMSTERS[pull.partner].name + '. Recorded on Sepolia.';
  }
  if (opened && HAMSTERS[pull.partner].rare) els.stage.classList.add('jackpot');
  else els.stage.classList.remove('jackpot');
}
function setWallet(addr) {
  S.wallet = addr ? normalizeAddress(addr) : null;
  freeMintUsedKnown = null;
  const pull = currentPull();
  if (pull) { S.partner = pull.partner; S.opened = true; }
  save();
  renderAll();
  syncChainState();
}

/* ---------- onchain pets: raw JSON-RPC through the connected wallet ---------- */
function petLive() { return !!(PET_CONTRACT.address && WIN.ethereum && typeof WIN.ethereum.request === 'function'); }
async function ethCall(data) {
  return WIN.ethereum.request({ method: 'eth_call', params: [{ to: PET_CONTRACT.address, data }, 'latest'] });
}
async function ethSend(data, valueHex) {
  return WIN.ethereum.request({ method: 'eth_sendTransaction', params: [{ from: S.wallet, to: PET_CONTRACT.address, data, value: valueHex || '0x0' }] });
}
async function ensureSepolia() {
  const target = '0x' + PET_CONTRACT.chainId.toString(16);
  const id = await WIN.ethereum.request({ method: 'eth_chainId' });
  if (parseInt(id, 16) === PET_CONTRACT.chainId) return true;
  try {
    await WIN.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: target }] });
  } catch (e) {
    if (e && e.code === 4902) {
      try {
        await WIN.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: target, chainName: 'Sepolia', nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'], blockExplorerUrls: ['https://sepolia.etherscan.io'] }] });
      } catch (e2) { return false; }
    } else return false;
  }
  const id2 = await WIN.ethereum.request({ method: 'eth_chainId' });
  return parseInt(id2, 16) === PET_CONTRACT.chainId;
}
async function waitReceipt(hash) {
  for (let i = 0; i < 90; i++) {
    const r = await WIN.ethereum.request({ method: 'eth_getTransactionReceipt', params: [hash] }).catch(() => null);
    if (r) return r.status === '0x1';
    await new Promise(res => setTimeout(res, 2000));
  }
  return false;
}
async function chainPetOf(addr) { return decodePetOf(await ethCall(PET_SEL.petOf + encAddress(addr))); }
async function chainFreeUsed(addr) { return decodeBool(await ethCall(PET_SEL.freeMintUsed + encAddress(addr))); }
let chainSyncing = false;
let ownedPets = [];
let freeMintUsedKnown = null;
async function syncChainState() {
  if (!petLive() || !S.wallet || chainSyncing) return;
  chainSyncing = true;
  try {
    if (!(await ensureSepolia())) return;
    const pet = await chainPetOf(S.wallet);
    try { freeMintUsedKnown = await chainFreeUsed(S.wallet); } catch (e) { /* keep last known */ }
    if (pet.has && PET_SPECIES[pet.species]) {
      const id = PET_SPECIES[pet.species];
      recordPull(S.pulls, S.wallet, id, Date.now());
      if (S.pulls[S.wallet]) S.pulls[S.wallet].partner = id;
      S.partner = id;
      S.opened = true;
      if (!S.collection) S.collection = {};
      S.collection[id] = true;
      try {
        const ids = decodeUintArray(await ethCall(PET_SEL.tokensOf + encAddress(S.wallet)));
        const list = [];
        for (const tid of ids.slice(0, 50)) {
          const sp = Number(BigInt(await ethCall(PET_SEL.speciesOf + encUint(tid))));
          if (PET_SPECIES[sp]) {
            S.collection[PET_SPECIES[sp]] = true;
            list.push({ tokenId: tid, species: PET_SPECIES[sp] });
          }
        }
        if (list.length) ownedPets = list;
        if (S.activeTokenId == null || !ownedPets.some(p => p.tokenId === S.activeTokenId)) {
          S.activeTokenId = pet.tokenId;
        }
      } catch (e) { /* collection sync is best effort */ }
      save();
    } else {
      // The chain is the source of truth: this wallet owns no pet, so any
      // local partner or pull record under it is a leftover from the
      // browser-only era and must not unlock battles.
      if (S.pulls && S.pulls[S.wallet]) delete S.pulls[S.wallet];
      S.partner = null;
      S.opened = false;
      S.activeTokenId = null;
      ownedPets = [];
      save();
    }
  } catch (e) { /* chain sync is best effort; local state stands */ }
  chainSyncing = false;
  renderAll();
}
async function connectWallet() {
  const eth = WIN.ethereum;
  if (!eth || typeof eth.request !== 'function') {
    els.walletMsg.textContent = 'No wallet found. Install MetaMask or open in a wallet browser.';
    return;
  }
  els.walletMsg.textContent = 'Waiting for your wallet...';
  try {
    const accounts = await eth.request({ method: 'eth_requestAccounts' });
    if (!accounts || !accounts[0]) {
      els.walletMsg.textContent = 'The wallet returned no account.';
      return;
    }
    if (!(await ensureSepolia())) {
      els.walletMsg.textContent = 'Switch your wallet network to Sepolia to play.';
      return;
    }
    try {
      await eth.request({ method: 'personal_sign', params: ['Sign in to Squeek Arena. This proves the wallet is yours. No transaction, no cost.', accounts[0]] });
    } catch (e) {
      els.walletMsg.textContent = 'Signature rejected in the wallet.';
      return;
    }
    setWallet(accounts[0]);
    els.walletMsg.textContent = '';
  } catch (e) {
    els.walletMsg.textContent = 'Connection rejected in the wallet.';
  }
}
els.connectBtn.addEventListener('click', connectWallet);
els.disconnectBtn.addEventListener('click', () => setWallet(null));
try {
  if (WIN.ethereum && typeof WIN.ethereum.on === 'function') {
    WIN.ethereum.on('accountsChanged', (accounts) => {
      setWallet(accounts && accounts[0] ? accounts[0] : null);
    });
  }
} catch (e) { /* wallet events optional */ }
function paintOpenedBox() {
  const grid = SPR.box, pal = SPR.boxPal, px = 7;
  const c = els.boxCanvas, ctx = c.getContext('2d');
  const W = grid[0].length, H = grid.length, lift = 6, split = 9;
  c.width = W * px;
  c.height = (H + lift) * px;
  ctx.clearRect(0, 0, c.width, c.height);
  const cell = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x * px, y * px, px, px); };
  for (let x = 1; x < W - 1; x++) for (let y = 0; y < 3; y++) cell(x, split + lift - 3 + y, '#191919');
  cell(4, split + lift - 2, '#ffffff'); cell(9, split + lift - 3, '#ffffff'); cell(13, split + lift - 2, '#ffffff');
  for (let y = split; y < H; y++) for (let x = 0; x < W; x++) { const col = pal[grid[y][x]]; if (col) cell(x, y + lift, col); }
  for (let y = 0; y < split; y++) {
    const dx = y < 3 ? -1 : 0;
    for (let x = 0; x < W; x++) { const col = pal[grid[y][x]]; if (col) cell(x + dx, y, col); }
  }
}
function burstSparkles(n, big) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'spark' + (big && i % 3 === 0 ? ' big' : '');
    const ang = (i / n) * Math.PI * 2 + 0.6;
    const dist = (big ? 125 : 88) + (i % 4) * 14;
    s.style.setProperty('--tx', Math.round(Math.cos(ang) * dist) + 'px');
    s.style.setProperty('--ty', Math.round(Math.sin(ang) * dist * 0.8 - 30) + 'px');
    els.stage.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}
/* Opening the box IS the mint: the wallet confirmation pops first, the
   contract rolls the species onchain, and the hamster that bursts out is
   read back from the contract, so the reveal always matches the NFT. */
async function startOpening() {
  if (gachaOpening || !S.wallet) return;
  if (currentPull()) return;
  if (!petLive()) return;
  gachaOpening = true;
  els.prompt.textContent = 'CONFIRM THE MINT IN YOUR WALLET...';
  els.boxCanvas.classList.add('gacha-wiggle-hard');
  const tickInt = setInterval(() => sfx('tick'), 110);
  const stopWiggle = () => {
    clearInterval(tickInt);
    els.boxCanvas.classList.remove('gacha-wiggle-hard');
  };
  try {
    if (!(await ensureSepolia())) throw new Error('wrong chain');
    const usedFree = await chainFreeUsed(S.wallet);
    let hash;
    if (!usedFree) hash = await ethSend(PET_SEL.freeMint, '0x0');
    else hash = await ethSend(PET_SEL.mintBatch + encUint(1), ethToWeiHex(mintTotalEth(1)));
    els.prompt.textContent = 'MINTING ON SEPOLIA...';
    if (!(await waitReceipt(hash))) throw new Error('mint failed');
    const pet = await chainPetOf(S.wallet);
    if (!pet.has || !PET_SPECIES[pet.species]) throw new Error('no pet after mint');
    stopWiggle();
    revealPet(PET_SPECIES[pet.species]);
  } catch (e) {
    stopWiggle();
    els.prompt.textContent = 'MINT CANCELLED · CLICK BOX TO OPEN';
    gachaOpening = false;
  }
}
function revealPet(id) {
  const rare = HAMSTERS[id].rare;
  if (rare) els.dim.classList.add('on');
  els.prompt.hidden = true;
  els.boxCanvas.classList.add('gacha-still');
  sfx('pop');
  els.flash.classList.remove('on');
  void els.flash.offsetWidth;
  els.flash.classList.add('on');
  paintOpenedBox();
  setTimeout(() => {
    recordPull(S.pulls, S.wallet, id, Date.now());
    if (S.pulls[S.wallet]) S.pulls[S.wallet].partner = id;
    S.partner = id;
    S.opened = true;
    S.boxes = (S.boxes || 0) + 1;
    if (!S.collection) S.collection = {};
    S.collection[id] = true;
    save();
    els.boxCanvas.classList.remove('gacha-still');
    els.dim.classList.remove('on');
    renderAll();
    burstSparkles(rare ? 18 : 10, rare);
    sfx(rare ? 'fanfare' : 'jingle');
    if (rare) {
      els.partnerStats.textContent += ' · JACKPOT! No quizzes, biggest damage.';
    }
    gachaOpening = false;
  }, rare ? 550 : 380);
}
els.boxCanvas.addEventListener('click', startOpening);
els.prompt.addEventListener('click', startOpening);

/* ---------- mint panel: extra gacha pulls as Sepolia pet NFTs ---------- */
let mintQty = 1;
let minting = false;
function renderMint() {
  if (!els.shopMsg) return;
  paint(els.shopBoxCanvas, SPR.box, SPR.boxPal, 4);
  const freeAvail = freeMintUsedKnown === false;
  if (els.mintQty) {
    els.mintQty.textContent = String(mintQty);
    const charged = mintChargeEth(mintQty, freeAvail);
    els.mintTotal.textContent = charged === '0.000' ? 'TOTAL FREE' : 'TOTAL ' + charged + ' ETH';
    els.mintMinus.disabled = mintQty <= 1;
    els.mintPlus.disabled = mintQty >= MINT_MAX;
  }
  els.shopConnect.hidden = !!S.wallet;
  const live = !!PET_CONTRACT.address;
  let msg = '', can = false;
  if (!S.wallet) msg = 'Connect your wallet first.';
  else if (!live) msg = 'Pet contract is not live yet. Mint opens at launch.';
  else if (minting) msg = 'Minting on Sepolia...';
  else if (freeAvail) { msg = 'Your first mint is FREE · Sepolia testnet.'; can = true; }
  else { msg = 'Ready for wallet ' + shortAddr(S.wallet) + '.'; can = true; }
  els.shopMsg.textContent = msg;
  els.shopBuy.disabled = !can;
}
els.shopBuy.addEventListener('click', async () => {
  if (!S.wallet || !PET_CONTRACT.address || minting) return;
  minting = true;
  renderMint();
  let resultMsg = 'Mint cancelled.';
  try {
    if (!(await ensureSepolia())) throw new Error('wrong chain');
    let remaining = mintQty;
    if (freeMintUsedKnown === false) {
      els.shopMsg.textContent = 'Confirm the FREE mint in your wallet...';
      const fh = await ethSend(PET_SEL.freeMint, '0x0');
      if (!(await waitReceipt(fh))) throw new Error('mint failed');
      freeMintUsedKnown = true;
      remaining = mintQty - 1;
      if (remaining > 0) els.shopMsg.textContent = 'Free pet minted. Confirm ' + remaining + ' more in your wallet...';
    }
    if (remaining > 0) {
      const hash = await ethSend(PET_SEL.mintBatch + encUint(remaining), ethToWeiHex(mintTotalEth(remaining)));
      if (!(await waitReceipt(hash))) throw new Error('mint failed');
    }
    const pet = await chainPetOf(S.wallet);
    if (pet.has && PET_SPECIES[pet.species]) {
      const id = PET_SPECIES[pet.species];
      if (S.pulls[S.wallet]) S.pulls[S.wallet].partner = id;
      S.partner = id;
      S.opened = true;
      if (!S.collection) S.collection = {};
      S.collection[id] = true;
      save();
      await syncChainState();
      resultMsg = 'Minted ' + mintQty + '! Newest partner: ' + HAMSTERS[id].name + '.';
    }
  } catch (e) { /* resultMsg already says cancelled */ }
  minting = false;
  renderAll();
  els.shopMsg.textContent = resultMsg;
});
els.mintMinus.addEventListener('click', () => { mintQty = Math.max(1, mintQty - 1); renderMint(); });
els.mintPlus.addEventListener('click', () => { mintQty = Math.min(MINT_MAX, mintQty + 1); renderMint(); });
els.shopBack.addEventListener('click', () => showScreen('screenHome'));
els.shopConnect.addEventListener('click', async () => { await connectWallet(); renderAll(); });
els.gachaShop.addEventListener('click', () => showScreen('screenShop'));

/* ---------- pre-battle hamster picker ---------- */
let pendingBoss = null;
function localOwnedPets() {
  if (!S.partner) return [];
  return [{ tokenId: S.activeTokenId != null ? S.activeTokenId : null, species: S.partner }];
}
async function challengeBoss(boss) {
  let list = ownedPets;
  if (petLive() && S.wallet) {
    try {
      if (await ensureSepolia()) {
        const ids = decodeUintArray(await ethCall(PET_SEL.tokensOf + encAddress(S.wallet)));
        const fresh = [];
        for (const tid of ids.slice(0, 50)) {
          const sp = Number(BigInt(await ethCall(PET_SEL.speciesOf + encUint(tid))));
          if (PET_SPECIES[sp]) fresh.push({ tokenId: tid, species: PET_SPECIES[sp] });
        }
        if (fresh.length) { list = fresh; ownedPets = fresh; }
      }
    } catch (e) { /* fall back to the last known list */ }
  }
  if (!list.length) list = localOwnedPets();
  if (list.length <= 1) { startBattle(boss); return; }
  pendingBoss = boss;
  renderChoose(list);
  showScreen('screenChoose');
}
function renderChoose(list) {
  els.chooseBoss.textContent = 'VS ' + pendingBoss.name + ' · Lv ' + pendingBoss.level + ' · pick who fights';
  els.chooseList.innerHTML = '';
  for (const p of list) {
    const card = document.createElement('div');
    card.className = 'arena-boss-card';
    const cv = document.createElement('canvas');
    cv.className = 'pixel-sprite';
    paint(cv, SPR.hamsters[p.species], SPR.hamsterPals[p.species], 3);
    card.appendChild(cv);
    const info = document.createElement('div');
    const st = statsFor(p.species, S.xp);
    info.innerHTML = '<strong>' + HAMSTERS[p.species].name + (p.tokenId != null ? ' #' + p.tokenId : '') + '</strong>' +
      (HAMSTERS[p.species].rare ? ' · RARE' : '') +
      '<br><span class="hint">' + HAMSTERS[p.species].kind + ' · Lv ' + st.level + ' · HP ' + st.maxHp + ' · ATK ' + st.atk + '</span>';
    card.appendChild(info);
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Fight';
    btn.addEventListener('click', () => {
      S.partner = p.species;
      S.activeTokenId = p.tokenId;
      save();
      renderAll();
      const b = pendingBoss;
      pendingBoss = null;
      if (b) startBattle(b);
    });
    card.appendChild(btn);
    els.chooseList.appendChild(card);
  }
}
els.chooseBack.addEventListener('click', () => { pendingBoss = null; showScreen('screenLadder'); });

/* ---------- battle ---------- */
function hpColor(pct) { return pct > 50 ? '#111111' : pct > 25 ? '#5a5a5a' : '#a8a8a8'; }
function renderBattleHp() {
  if (!battle) return;
  const bp = Math.max(0, battle.bossHp / battle.boss.hp * 100);
  els.bossHpFill.style.width = bp + '%';
  els.bossHpFill.style.background = hpColor(bp);
  els.bossHpText.textContent = Math.max(0, Math.ceil(battle.bossHp)) + ' / ' + battle.boss.hp;
  const st = playerStats();
  const pp = Math.max(0, battle.playerHp / st.maxHp * 100);
  els.playerHpFill.style.width = pp + '%';
  els.playerHpFill.style.background = hpColor(pp);
  els.playerHpText.textContent = Math.max(0, Math.ceil(battle.playerHp)) + ' / ' + st.maxHp;
  els.playerLv.textContent = 'Lv ' + st.level;
}
function setMsg(t) { els.msg.textContent = t; }
function shake(canvas) {
  canvas.classList.remove('pk-shake');
  void canvas.offsetWidth;
  canvas.classList.add('pk-shake');
}
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

let battleStarting = false;
function startBattle(boss) {
  if (battleStarting || battle) return;
  battleStarting = true;
  refreshLive().then(() => { battleStarting = false; beginBattle(boss); });
}
function beginBattle(boss) {
  const st = playerStats();
  battle = { boss, bossHp: boss.hp, playerHp: st.maxHp, streak: 0, snacks: 3, buff: liveBuff, lastQ: null, correctText: '',
             pool: shuffle(QUESTIONS[boss.tier].concat(shuffle(liveQuestions).slice(0, 2))), qi: 0, phase: 'intro', q: null };
  showScreen('screenBattle');
  paint(els.bossCanvas, SPR.bossForms[boss.form], SPR.bossPals[boss.form], 6);
  paint(els.playerCanvas, SPR.hamsterBacks[S.partner], SPR.hamsterPals[S.partner], 6);
  paint(els.trainerCanvas, SPR.trainerBacks[S.trainer], SPR.trainerPal, 5);
  els.bossName.textContent = boss.name;
  els.bossLv.textContent = 'Lv ' + boss.level;
  els.playerName.textContent = HAMSTERS[S.partner].name;
  els.snack.textContent = 'Snack (' + battle.snacks + ') · heal 25';
  els.snack.disabled = false;
  els.trainerCanvas.style.display = '';
  els.playerCanvas.style.display = 'none';
  els.bossCanvas.classList.add('anim-bob');
  els.playerCanvas.classList.add('anim-bob');
  renderBattleHp();
  setMsg('A wild ' + boss.name + ' appeared! Go, ' + HAMSTERS[S.partner].name + '!');
  els.q.textContent = '';
  els.answers.innerHTML = '';
  els.attack.hidden = true;
  setTimeout(() => {
    if (!battle) return;
    els.trainerCanvas.style.display = 'none';
    els.playerCanvas.style.display = '';
    nextTurn();
  }, 1200);
}

function nextTurn() {
  if (!battle) return;
  battle.phase = 'question';
  if (HAMSTERS[S.partner].rare) {
    els.q.textContent = 'AURUM needs no questions. Attack directly!';
    els.answers.innerHTML = '';
    els.attack.hidden = false;
    els.timerFill.style.width = '100%';
    return;
  }
  els.attack.hidden = true;
  if (battle.qi >= battle.pool.length) {
    battle.pool = shuffle(battle.pool);
    if (battle.pool.length > 1 && battle.pool[0] === battle.lastQ) { const t = battle.pool[0]; battle.pool[0] = battle.pool[1]; battle.pool[1] = t; }
    battle.qi = 0;
  }
  const q = battle.pool[battle.qi++];
  battle.q = q;
  battle.lastQ = q;
  battle.correctText = correctTextOf(q);
  battle.qStart = Date.now();
  els.q.textContent = q.q;
  els.answers.innerHTML = '';
  for (const opt of makeOptions(q)) {
    const b = document.createElement('button');
    b.className = 'btn pk-answer';
    b.textContent = opt;
    b.addEventListener('click', () => answer(opt));
    els.answers.appendChild(b);
  }
  const total = battle.boss.seconds;
  els.timerFill.style.width = '100%';
  stopTimer();
  timerId = setInterval(() => {
    const remain = total - (Date.now() - battle.qStart) / 1000; // wall clock, background tabs cannot stretch it
    els.timerFill.style.width = Math.max(0, remain / total * 100) + '%';
    if (remain <= 0) { stopTimer(); answer(null); }
  }, 100);
}

function lockAnswers() {
  stopTimer();
  for (const b of els.answers.children) b.disabled = true;
  els.snack.disabled = true;
}
function afterAction(fn) { setTimeout(() => { if (battle) fn(); }, 1000); }

function bossCounter(prefix) {
  const dmg = bossDamage(battle.boss, battle.buff || 0);
  battle.playerHp -= dmg;
  floatDmg('-' + dmg, 'player', els.playerCanvas);
  sfx('hurt');
  els.bossCanvas.classList.add('pk-lunge-l');
  els.playerCanvas.classList.add('pk-flash');
  setTimeout(() => { els.bossCanvas.classList.remove('pk-lunge-l'); els.playerCanvas.classList.remove('pk-flash'); }, 500);
  renderBattleHp();
  if (battle.playerHp <= 0) { afterAction(loseBattle); return; }
  setMsg(prefix + ' The boss counters for ' + dmg + ' damage!');
  afterAction(nextTurn);
}
function answer(choice) {
  if (!battle || battle.phase !== 'question') return;
  battle.phase = 'anim';
  lockAnswers();
  const expired = (Date.now() - battle.qStart) / 1000 > battle.boss.seconds;
  if (expired) choice = null;
  const correct = choice != null && hashAnswer(choice) === battle.q.h;
  if (correct) {
    battle.streak++;
    const fast = (Date.now() - battle.qStart) / 1000 < battle.boss.seconds * 0.4;
    const out = {};
    const dmg = playerDamage(S.partner, S.xp, { streak: battle.streak, fast, out });
    battle.bossHp -= dmg;
    floatDmg('-' + dmg, 'boss' + (out.crit ? ' crit' : ''), els.bossCanvas);
    if (out.crit) { sfx('crit'); shakeBattle(); } else { sfx('hit'); }
    S.xp += 12;
    save();
    els.playerCanvas.classList.add('pk-lunge-r');
    els.bossCanvas.classList.add('pk-flash');
    setTimeout(() => { els.playerCanvas.classList.remove('pk-lunge-r'); els.bossCanvas.classList.remove('pk-flash'); }, 500);
    renderBattleHp();
    setMsg('Correct! ' + HAMSTERS[S.partner].name + ' attacks for ' + dmg + ' damage' +
           (battle.streak >= 2 ? ' · combo x' + (1 + Math.min(0.5, (battle.streak - 1) * 0.1)).toFixed(1) : '') + '!');
    if (battle.bossHp <= 0) { afterAction(winBattle); return; }
    afterAction(nextTurn);
  } else {
    battle.streak = 0;
    bossCounter(choice == null ? 'Time is up!' : 'Wrong! The correct answer was: ' + battle.correctText + '.');
  }
  els.snack.disabled = false;
}
els.attack.addEventListener('click', () => {
  if (!battle || battle.phase !== 'question') return;
  battle.phase = 'anim';
  els.attack.hidden = true;
  const dmg = playerDamage(S.partner, S.xp, {});
  battle.bossHp -= dmg;
  floatDmg('-' + dmg, 'boss', els.bossCanvas);
  sfx('hit');
  S.xp += 25;
  save();
  els.playerCanvas.classList.add('pk-lunge-r');
  els.bossCanvas.classList.add('pk-flash');
  setTimeout(() => { els.playerCanvas.classList.remove('pk-lunge-r'); els.bossCanvas.classList.remove('pk-flash'); }, 500);
  renderBattleHp();
  setMsg('AURUM attacks directly for ' + dmg + ' damage! No quiz, exactly as the rare hamster rules say.');
  if (battle.bossHp <= 0) { afterAction(winBattle); return; }
  afterAction(() => { battle.phase = 'question'; bossCounter('AURUM takes a hit back.'); });
});
els.snack.addEventListener('click', () => {
  if (!battle || battle.phase !== 'question' || battle.snacks <= 0) return;
  battle.phase = 'anim';
  lockAnswers();
  battle.snacks--;
  els.snack.textContent = 'Snack (' + battle.snacks + ') · heal 25';
  const st = playerStats();
  battle.playerHp = Math.min(st.maxHp, battle.playerHp + 25);
  floatDmg('+25', 'player heal', els.playerCanvas);
  sfx('heal');
  renderBattleHp();
  setMsg(HAMSTERS[S.partner].name + ' eats a snack and recovers 25 HP. But the boss gets a free turn!');
  afterAction(() => { battle.phase = 'question'; bossCounter('After the snack,'); });
  els.snack.disabled = false;
});
els.run.addEventListener('click', () => {
  if (!battle) return;
  stopTimer();
  battle = null;
  renderAll();
  showScreen('screenLadder');
});
function winBattle() {
  if (!battle) return;
  sfx('win');
  const boss = battle.boss;
  const firstClear = !S.defeated.includes(boss.id);
  if (firstClear) S.defeated.push(boss.id);
  S.xp += firstClear ? (HAMSTERS[S.partner].rare ? 80 : 60) : 15;
  const finalBoss = boss.id === BOSSES.length;
  if (finalBoss) S.certified = true;
  save();
  battle = null;
  renderAll();
  if (finalBoss) { showCertified(); return; }
  showScreen('screenLadder');
  els.summary.textContent = boss.name + ' goes down! ' + HAMSTERS[S.partner].name +
    ' climbs to Lv ' + playerStats().level + '.' +
    (firstClear ? '' : ' Replay clear.') +
    ' On to the next boss.';
}
function loseBattle() {
  if (!battle) return;
  sfx('lose');
  S.xp += 10;
  save();
  const name = battle.boss.name;
  battle = null;
  renderAll();
  showScreen('screenLadder');
  els.summary.textContent = HAMSTERS[S.partner].name + ' fainted against ' + name + '. HP is restored, try again.';
}

/* ---------- certified ---------- */
function showCertified() {
  paint($('arenaCertPartner'), SPR.hamsters[S.partner], SPR.hamsterPals[S.partner], 5);
  paint($('arenaCertTrainer'), SPR.trainers[S.trainer], SPR.trainerPal, 4);
  showScreen('screenCertified');
}
els.shareBtn.addEventListener('click', () => {
  const cv = els.shareCanvas, ctx = cv.getContext('2d');
  ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#d9d9d9'; ctx.fillRect(0, 500, 1200, 130);
  ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, 1200, 110);
  ctx.fillStyle = '#ffffff'; ctx.font = '700 54px "Courier New", monospace';
  ctx.fillText('SQUEEK ARENA', 48, 74);
  ctx.fillStyle = '#111111'; ctx.font = '700 64px "Courier New", monospace';
  ctx.fillText('CERTIFIED', 48, 216);
  ctx.font = '700 44px "Courier New", monospace';
  ctx.fillText('SQUEEKCHAIN FAMS', 48, 276);
  ctx.font = '26px Verdana, sans-serif';
  ctx.fillText('All four Squeektoshi forms defeated in the quiz battle ladder.', 48, 336);
  ctx.font = '23px "Courier New", monospace'; ctx.fillStyle = '#4a4a4a';
  const st = playerStats();
  ctx.fillText('Partner: ' + HAMSTERS[S.partner].name + ' · Lv ' + st.level, 48, 396);
  ctx.fillText('Trainer: ' + (S.trainer === 'male' ? 'Male' : 'Female') + (S.wallet ? ' · Wallet: ' + shortAddr(S.wallet) : ''), 48, 430);
  ctx.fillText('Arena results are local fun, not recorded onchain.', 48, 586);
  const draw = (grid, pal, x, y, px) => {
    for (let r = 0; r < grid.length; r++)
      for (let c = 0; c < grid[r].length; c++) {
        const col = pal[grid[r][c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + c * px, y + r * px, px, px);
      }
  };
  ctx.fillStyle = '#111111'; ctx.fillRect(724, 484, 436, 10);
  draw(SPR.bossForms['5'], SPR.bossPals['5'], 740, 290, 6);
  draw(SPR.hamsters[S.partner], SPR.hamsterPals[S.partner], 968, 290, 6);
  cv.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'squeek-arena-certified.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
});


/* ---------- retro decor: hill, bush, menu cursor ---------- */
const HILL_GRID = [
  '.......##.......',
  '......####......',
  '.....######.....',
  '....########....',
  '...##########...',
  '..############..',
  '.##############.',
  '################',
];
const BUSH_GRID = [
  '...##....##...',
  '.############.',
  '##############',
  '##############',
  '.############.',
  '..##########..',
];
const GREEN_PAL = { '#': '#111111' };
paint(els.hillCanvas, HILL_GRID, GREEN_PAL, 6);
paint(els.bushCanvas, BUSH_GRID, GREEN_PAL, 6);
paint(els.menuCursor, SPR.hamsters.momo, SPR.hamsterPals.momo, 1);
const menuItems = [els.btnPlay, els.btnHowto, els.btnCollection, els.btnShop, els.btnSound, els.btnResetHome];
let menuIdx = 0;
function setCursor(i) {
  menuIdx = (i + menuItems.length) % menuItems.length;
  menuItems.forEach((b, j) => b.classList.toggle('focused', j === menuIdx));
  els.menuCursor.style.top = menuItems[menuIdx].offsetTop + 'px';
}
menuItems.forEach((b, i) => b.addEventListener('mouseenter', () => setCursor(i)));
document.addEventListener('keydown', e => {
  if ($('screenHome').hidden) return;
  if (e.key === 'ArrowDown') { setCursor(menuIdx + 1); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { setCursor(menuIdx - 1); e.preventDefault(); }
  else if (e.key === 'Enter') { menuItems[menuIdx].click(); }
});
setCursor(0);

/* ---------- live data: boss buff + live questions ---------- */
let liveRefreshP = null;
function refreshLive() {
  if (liveRefreshP) return liveRefreshP;
  const done = () => { liveRefreshP = null; };
  liveRefreshP = fetch('https://api.squeekchain.com/v1/status').then(r => r.json()).then(json => {
    const m = (json && json.measurement) || {};
    const anchor = (json && json.builder && json.builder.anchor) || null;
    const st = {
      state: (m.freshness === 'online' && m.coreStatus === 'ACTIVE') ? 'running' : 'idle',
      blockHeight: anchor && anchor.blockHeight != null ? String(anchor.blockHeight) : null,
      blockProgressPct: null,
    };
    if (anchor && anchor.blockProgress != null) {
      const p = Number(anchor.blockProgress) / 1e7; // block units (1e9 per block) to percent
      if (isFinite(p) && p >= 0 && p <= 100) st.blockProgressPct = p;
    }
    liveBuff = st.state === 'running' ? 2 : 0;
    els.hudLive.textContent = st.state === 'running' ? 'WHEEL LIVE' : 'WHEEL REST';
    liveQuestions = buildLiveQuestions(st);
    renderLadder();
  }).catch(() => { els.hudLive.textContent = 'WHEEL ???'; }).then(done, done);
  return liveRefreshP;
}
refreshLive();

syncSoundLabel();
renderAll();
showScreen('screenHome');
})(typeof window !== 'undefined' ? window : globalThis);