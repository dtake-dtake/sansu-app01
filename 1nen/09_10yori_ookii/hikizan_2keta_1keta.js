// 「2けた-1けた（繰り下がりなし）」ドリルの設定ファイル

const config = {
  appId: "hikizan-2keta-1keta",
  mainTitle: "９　10より おおきい かず",
  title: "２けたと１けたの ひきざん",

  problemGenerator: () => {
    const problems = [];
    const NUM_QUESTIONS = 10;
    const used = new Set(); // 問題の重複を防ぐ

    while (problems.length < NUM_QUESTIONS) {
      // 1. 1けたの数を2つ作る (例: 5と2)
      const onesA = Math.floor(Math.random() * 8) + 2; // 2〜9
      const onesB = Math.floor(Math.random() * (onesA - 1)) + 1; // onesAより小さい数

      // 2. 2けたの数「a」と1けたの数「b」に割り振る
      const a = 10 + onesA;
      const b = onesB;

      const key = `${a}-${b}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        answer: a - b,
        displayText: `<span>${a}</span><span>−</span><span>${b}</span>=`
      });
    }
    return problems;
  },

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 6,
  starThresholds: {
    star_circle: 100, star1: 105, star2: 115, star3: 125, star4: 135, star5: 145,
  },
  themeColors: theme_ruby, // ルビーの赤色テーマ
};

// ドリルを開始
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(config);
});
