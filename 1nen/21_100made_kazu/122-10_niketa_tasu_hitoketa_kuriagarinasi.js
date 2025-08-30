// ２１　１００までのかずの けいさん
// 二けた＋一けた（くり上がりなし）… 10問
// appId(name): 122-10_niketa_tasu_hitoketa_kuriagarinasi

(function () {
  // テーマは毎回ランダム（themes.js の定義から）
  const themeNames = [
    "theme_matcha","theme_marine","theme_sky","theme_ocean","theme_mint",
    "theme_peach","theme_lemon","theme_forest","theme_sakura","theme_ruby","theme_sunset"
  ];
  const themePool = themeNames.map(n => globalThis[n]).filter(Boolean);
  const randomTheme = themePool.length ? themePool[Math.floor(Math.random()*themePool.length)] : undefined;

  const config = {
    appId: "122-10_niketa_tasu_hitoketa_kuriagarinasi",
    mainTitle: "２１　１００までのかずの　けいさん",
    title: "二けた＋一けた（くりあがりなし）",
    themeColors: randomTheme,
    showJudgeIcon: false,      // ○×は出さず色でフィードバック
    pointsPerQuestion: 10,     // 10問×10点=100点
    timeLimitPerQuestion: 6,
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    // 1問の表示テンプレ（共通エンジンが __INPUT__ を採点）
    _expr(a, b) {
      return `<span>${a}</span><span>＋</span><span>${b}</span>=__INPUT__`;
    },

    problemGenerator() {
      const probs = [];
      const used = new Set();

      // 二けた a（10..99）＋ 一けた b（1..9）で「くり上がりなし」→ (a%10)+b < 10
      // 例：32+6（×…2+6=8 OK）72+2、43+4、26+3 など
      while (probs.length < 10) {
        // 二けた：十の位 1..9、一の位 0..9
        const tens = Math.floor(Math.random()*9)+1;   // 1..9
        const ones = Math.floor(Math.random()*10);    // 0..9
        const a = tens*10 + ones;

        const b = Math.floor(Math.random()*9)+1;      // 1..9
        if (ones + b >= 10) continue;                 // くり上がり禁止

        const s = a + b;                               // 最大でも 99
        const key = `${a}+${b}`;
        if (used.has(key)) continue;
        used.add(key);

        probs.push({
          displayText: config._expr(a, b),
          answer: s
        });
      }

      return probs;
    }
  };

  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();
