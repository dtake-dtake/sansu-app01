// くりさがりのあるひきざん
// 条件：2けた - 1けた、必ずくり下がりが発生し、答えは一けた（1〜9）
// 具体：被減数 a は 10〜19（十の位は1）、減数 b は 1〜9、かつ (a の一の位) < b
const config = {
  appId: "79-5_hikizan_kurisagari",
  title: "くりさがりのあるひきざん",   // ← h2 & タブ
  themeColors: theme_mint,               // お好みで変更可

  problemGenerator: () => {
    const problems = [];
    const used = new Set();
    const N = 10;

    while (problems.length < N) {
      // 一の位 u は 0..8（9だと b>9 が必要になり不可能）
      const u = Math.floor(Math.random() * 9);     // 0..8
      const a = 10 + u;                             // 10..18
      const bMin = u + 1;                           // 必ずくり下がり (u < b)
      const b = bMin + Math.floor(Math.random() * (9 - bMin + 1)); // bMin..9

      const key = `${a}-${b}`;
      if (used.has(key)) continue;
      used.add(key);

      // 答えは 10+u-b で 1..9 に必ず収まる
      const ans = a - b;

      problems.push({
        a, b, op: '−',
        answer: ans,
        displayText: `<span>${a}</span><span>−</span><span>${b}</span>=`
      });
    }
    return problems;
  },

  // スコア・タイム
  pointsPerQuestion: 10,   // 10問×10点=100
  timeLimitPerQuestion: 6, // 1問6秒を基準にボーナス
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
