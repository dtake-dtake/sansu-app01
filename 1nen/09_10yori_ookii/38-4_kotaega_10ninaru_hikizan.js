// ９　１０より おおきい かず ／ こたえが１０になる ひきざん
const config = {
  appId: "38-4_kotaega_10ninaru_hikizan",
  mainTitle: "９　１０より おおきい かず",    // ← h1
  title: "こたえが１０になる ひきざん",        // ← h2 & タブ

  problemGenerator: () => {
    const problems = [];
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // 配列をシャッフル
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // 9問生成（11-1, 12-2, ... 19-9）
    for (const num of numbers) {
      const a = 10 + num;
      const b = num;
      problems.push({
        answer: 10,
        displayText: `<span>${a}</span><span>−</span><span>${b}</span>=`
      });
    }

    // 10問目を追加（ランダム）
    const lastNum = Math.floor(Math.random() * 9) + 1;
    problems.push({
      answer: 10,
      displayText: `<span>${10 + lastNum}</span><span>−</span><span>${lastNum}</span>=`
    });

    return problems;
  },

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 5,
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145
  },
  themeColors: theme_ocean
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
