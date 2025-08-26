// ９　１０より おおきい かず ／ ２けたと１けたの たしざん
const config = {
  appId: "39-6_2keta_tasu_1keta",
  mainTitle: "９　１０より おおきい かず",   // ← h1
  title: "２けたと１けたの たしざん",        // ← h2 & タブ

  problemGenerator: () => {
    const problems = [];
    const NUM_QUESTIONS = 10;
    const used = new Set();

    while (problems.length < NUM_QUESTIONS) {
      // 1. 1けたの数を2つ作る
      const onesA = Math.floor(Math.random() * 9) + 1; // 1〜9
      const onesB = Math.floor(Math.random() * (9 - onesA)) + 1; // 繰り上がらないように

      // 2. 2けたの数と1けたの数にする
      const a = 10 + onesA;
      const b = onesB;

      const key = `${a}+${b}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        answer: a + b,
        displayText: `<span>${a}</span><span>＋</span><span>${b}</span>=`
      });
    }
    return problems;
  },

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 6,
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145
  },
  themeColors: theme_peach
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
