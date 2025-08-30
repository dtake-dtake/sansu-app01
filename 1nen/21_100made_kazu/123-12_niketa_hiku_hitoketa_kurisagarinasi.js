// ２１　１００までのかずの けいさん
// 二けた − 一けた（くりさがりなし）… 10問
// appId(name): 123-12_niketa_hiku_hitoketa_kurisagarinasi

(function () {
  // テーマは毎回ランダム（themes.js から存在するものだけ拾う）
  const themeNames = [
    "theme_matcha","theme_marine","theme_sky","theme_ocean","theme_mint",
    "theme_peach","theme_lemon","theme_forest","theme_sakura","theme_ruby","theme_sunset"
  ];
  const themePool = themeNames.map(n => globalThis[n]).filter(Boolean);
  const randomTheme = themePool.length ? themePool[Math.floor(Math.random()*themePool.length)] : undefined;

  const config = {
    appId: "123-12_niketa_hiku_hitoketa_kurisagarinasi",
    mainTitle: "２１　１００までのかずの　けいさん",
    title: "二けた−一けた（くりさがりなし）",
    themeColors: randomTheme,
    showJudgeIcon: false,      // ○×は出さず、入力欄の色でフィードバック
    pointsPerQuestion: 10,     // 10問×10点=100点
    timeLimitPerQuestion: 6,
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    // 1問の表示テンプレ（共通エンジンが __INPUT__ を採点）
    _expr(a, b) {
      return `<span>${a}</span><span>−</span><span>${b}</span>=__INPUT__`;
    },

    problemGenerator() {
      const probs = [];
      const used = new Set();

      // 二けた a（10..99、ただし一の位は1..9）− 一けた b（1..9）
      // くりさがりなし： (a % 10) - b >= 0  ⇒  b ≤ (a % 10)
      while (probs.length < 10) {
        const tens = Math.floor(Math.random()*9)+1;   // 1..9
        const ones = Math.floor(Math.random()*9)+1;   // 1..9 （0は使わない：bを少なくとも1にするため）
        const a = tens*10 + ones;                     // 11..99
        const b = Math.floor(Math.random()*ones) + 1; // 1..ones  ⇒ くりさがりなし確定
        const diff = a - b;                           // 10..98

        const key = `${a}-${b}`;
        if (used.has(key)) continue;
        used.add(key);

        probs.push({
          displayText: config._expr(a, b),
          answer: diff
        });
      }

      return probs;
    }
  };

  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();
