// 100-3_kazuno_kakikata.js の中身例（骨子）
// ○×を出さずに、色だけでフィードバックしたい場合は showJudgeIcon:false
const config = {
  appId: "100-3_kazuno_kakikata",
  title: "かずの　かきかた",
  themeColors: theme_forest,
  showJudgeIcon: false,

  // 表示ヘルパ
  _t: (s) => `<span>${s}</span>`,
  _n: (v) => `<span class="place-num">${v}</span>`,

problemGenerator() {
  const probs = [];
  const used = new Set();

  // ---------- □3（1ブランク）×2 ----------
  for (let i = 0; i < 2; i++) {
    const tens = Math.floor(Math.random() * 9) + 1; // 1..9
    const ones = Math.floor(Math.random() * 10);    // 0..9（ここはOK）
    const val = tens * 10 + ones;
    const key = `S:${val}`;
    if (used.has(key)) { i--; continue; }
    used.add(key);
    probs.push({
      displayText:
        `<span class="place-label">十のくらいが</span><span class="place-num">${tens}</span>` +
        `<span class="place-label">、一のくらいが</span><span class="place-num">${ones}</span>` +
        `<span class="place-label">の かずは</span> __INPUT__`,
      answer: val
    });
  }

  // ---------- □5（合成：10がcつと1がdつで□）×2 ----------
  // ★ d は 1..9（0 は使わない）
  for (let i = 0; i < 2; i++) {
    const c = Math.floor(Math.random() * 9) + 1; // 1..9
    const d = Math.floor(Math.random() * 9) + 1; // 1..9  ← ここがポイント
    const val = c * 10 + d;
    const key = `C:${c},${d}`;
    if (used.has(key)) { i--; continue; }
    used.add(key);
    probs.push({
      displayText:
        `10 が <span class="place-num">${c}</span> つ と ` +
        `<span class="place-num">1</span> が <span class="place-num">${d}</span> つ で __INPUT__`,
      answer: val
    });
  }

  // ---------- □5（10がeつで□）×1 ----------
  {
    const e = Math.floor(Math.random() * 9) + 1; // 1..9（0は出ない）
    probs.push({
      displayText: `10 が <span class="place-num">${e}</span> つ で __INPUT__`,
      answer: e * 10
    });
  }

  // ---------- □7（分解：fgは10が□つと1が□つ）×2（2ブランク） ----------
  // ★ u≠0 の n だけ採用（1が0つは出さない）
  let twoDecompose = 0;
  while (twoDecompose < 2) {
    const n = Math.floor(Math.random() * 90) + 10; // 10..99
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) continue; // ここで除外
    const key = `D2:${n}`;
    if (used.has(key)) continue;
    used.add(key);
    probs.push({
      displayText:
        `<span class="place-num">${n}</span> は ` +
        `10 が __INPUT1__ つ と <span class="place-num">1</span> が __INPUT2__ つ`,
      multiAnswers: [t, u]
    });
    twoDecompose++;
  }

  // ---------- □7（10hは10が□つ）×1（1ブランク） ----------
  {
    const h = Math.floor(Math.random() * 9) + 1; // 1..9
    const n = h * 10;
    probs.push({
      displayText: `<span class="place-num">${n}</span> は 10 が __INPUT1__ つ`,
      multiAnswers: [h]
    });
  }

  // 合計 8問（入力フィールド 10個）
  return probs;
}
,

  // スコア・星（8問×10点 = 80点が基本満点）
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 7,
  starThresholds: {
    star_circle: 80,  // 基本満点に合わせる
    star1: 88, star2: 96, star3: 104, star4: 112, star5: 120
  }
};

document.addEventListener('DOMContentLoaded', () => initializeDrillApp(config));
