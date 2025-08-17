// 「□にはいる数（たし算）」ドリルの設定ファイル

const config = {
  appId: "tashizan-shikaku",
  mainTitle: "９　10より おおきい かず",
  title: "□にはいる かずは？",

  problemGenerator: () => {
    const problems = [];
    const NUM_QUESTIONS = 10;
    const used = new Set(); // 問題の重複を防ぐ

    while (problems.length < NUM_QUESTIONS) {
      // 1. まず、普通の足し算の式を一つ作る (例: 10 + 6 = 16)
      const a = 10;
      const b = Math.floor(Math.random() * 10) + 1; // 1から10
      const c = a + b;

      const key = `${a}+${b}`;
      if (used.has(key)) continue;
      used.add(key);

      // 2. どの部分を□にするか、ランダムで決める
      const missingPart = Math.floor(Math.random() * 3); // 0, 1, 2のどれか
      
      let problem = {};

      if (missingPart === 0) { // パターンA: 「16は □ と 6」
        problem = {
          answer: a, // 答えるべき数は「10」
          displayText: `<span>${c}</span> は __INPUT__ と <span>${b}</span>`
        };
      } else if (missingPart === 1) { // パターンB: 「16は 10 と □」
        problem = {
          answer: b, // 答えるべき数は「6」
          displayText: `<span>${c}</span> は <span>${a}</span> と __INPUT__`
        };
      } else { // パターンC: 「□ は 10 と 6」
         problem = {
          answer: c, // 答えるべき数は「16」
          displayText: `__INPUT__ は <span>${a}</span> と <span>${b}</span>`
        };
      }
      problems.push(problem);
    }
    return problems;
  },

  // スコアやデザインに関する設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 8, // 少し考える時間が必要なので長めに
  starThresholds: {
    star_circle: 100, star1: 105, star2: 115, star3: 125, star4: 135, star5: 145,
  },
  themeColors: theme_sakura, // いちごと桜のピンクテーマ
};

// ドリルを開始
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(config);
});
