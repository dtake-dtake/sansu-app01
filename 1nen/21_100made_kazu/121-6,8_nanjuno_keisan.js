// 単元21：１００までのかずの けいさん
// 前半5問：□６の意図「何十 + 一桁の数」… (10a) + b（b=1..9、解≤100）
// 後半5問：□８の意図「ひくと何十」… n - (一の位) = 10のかたまり（解≥0）
// name(appId) = 121-6,8_nanjuno_keisan

(function () {
  // テーマは毎回ランダム
  const themeNames = [
    "theme_matcha","theme_marine","theme_sky","theme_ocean","theme_mint",
    "theme_peach","theme_lemon","theme_forest","theme_sakura","theme_ruby","theme_sunset"
  ];
  const themePool = themeNames.map(n => globalThis[n]).filter(Boolean);
  const randomTheme = themePool.length ? themePool[Math.floor(Math.random()*themePool.length)] : undefined;

  const config = {
    appId: "121-6,8_nanjuno_keisan",
    mainTitle: "１００までのかずの　けいさん",
    title: "なんじゅうのけいさん",
    themeColors: randomTheme,
    showJudgeIcon: false,   // ○×は出さず、入力欄の色で判定
    pointsPerQuestion: 10,  // 10問×10点=100点
    timeLimitPerQuestion: 6,
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    // 1問の表示を __INPUT__ で作成（共通エンジンが採点）
    _expr(a, op, b) {
      return `<span>${a}</span><span>${op}</span><span>${b}</span>=__INPUT__`;
    },

    problemGenerator() {
      const probs = [];
      const used = new Set();

      // ── 前半5問：何十 + 一桁（解 ≤ 100）
      while (probs.length < 5) {
        const tens = (Math.floor(Math.random()*9)+1) * 10;   // 10..90
        const ones = Math.floor(Math.random()*9) + 1;        // 1..9
        const s = tens + ones;                               // 最大 99
        if (s > 100) continue;
        const key = `A:${tens}+${ones}`;
        if (used.has(key)) continue;
        used.add(key);
        probs.push({
          displayText: config._expr(tens, "＋", ones),
          answer: s
        });
      }

      // ── 後半5問：ひくと何十（n - 一の位 = 10のかたまり）
      // 例：37-7=30, 82-2=80 など
      while (probs.length < 10) {
        const t = Math.floor(Math.random()*9) + 1;   // 十の位 1..9
        const u = Math.floor(Math.random()*9) + 1;   // 一の位 1..9（0は使わない）
        const n = t*10 + u;                          // 11..99
        const sub = u;                                // 引く数（一の位）
        const d = n - sub;                            // 10t（≥10, ≤90）
        const key = `B:${n}-${sub}`;
        if (used.has(key)) continue;
        used.add(key);
        probs.push({
          displayText: config._expr(n, "−", sub),
          answer: d
        });
      }

      return probs;
    }
  };

  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();
