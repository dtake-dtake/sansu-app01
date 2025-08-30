// くりあがりのあるたし算
// h1 は未設定 → common.js のデフォルト表示に任せる
const config = {
  appId: "63-5_kuriagari_tasizan",
  title: "くりあがりのあるたし算",   // ← h2 & タブ

  problemGenerator: () => {
    const problems = [];
    const used = new Set();

    // 10問作成：1けた＋1けたで答えが10より大きい
    while (problems.length < 10) {
      const a = Math.floor(Math.random() * 9) + 1; // 1..9
      const b = Math.floor(Math.random() * 9) + 1; // 1..9
      const ans = a + b;
      if (ans <= 10) continue; // くりあがりなしは除外

      const key = `${a}+${b}`;
      if (used.has(key)) continue; // 重複回避
      used.add(key);

      problems.push({
        a, b,
        answer: ans,
        displayText: `<span>${a}</span>＋<span>${b}</span>=`
      });
    }

    return problems;
  },

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 5,
  starThresholds: {
    star_circle: 100,
    star1: 108,
    star2: 116,
    star3: 124,
    star4: 132,
    star5: 140
  },

  // 今回は theme_sakura（桜色テーマ）
  themeColors: theme_sakura
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
