// ９ １０より おおきい かず／□にはいる かずは？
const config = {
  appId: "35-2_sikaku_ni_hairukazu",

  // 表示テキスト
  title: "□にはいる かずは？", // ← h1（共通エンジン想定）
  subtitle: "□にはいる かずは？",      // ← h2（共通エンジン想定）

  // 「10 + b = c」を作り、□の位置をランダムにする（10問）
  problemGenerator: () => {
    const problems = [];
    const NUM_QUESTIONS = 10;
    const used = new Set();

    while (problems.length < NUM_QUESTIONS) {
      const a = 10;
      const b = Math.floor(Math.random() * 10) + 1; // 1..10
      const c = a + b;

      const key = `${a}+${b}`;
      if (used.has(key)) continue;
      used.add(key);

      const missingPart = Math.floor(Math.random() * 3); // 0,1,2
      let problem;

      if (missingPart === 0) { // A: 「16 は □ と 6」
        problem = {
          answer: a,
          displayText: `<span>${c}</span> は __INPUT__ と <span>${b}</span>`
        };
      } else if (missingPart === 1) { // B: 「16 は 10 と □」
        problem = {
          answer: b,
          displayText: `<span>${c}</span> は <span>${a}</span> と __INPUT__`
        };
      } else { // C: 「□ は 10 と 6」
        problem = {
          answer: c,
          displayText: `__INPUT__ は <span>${a}</span> と <span>${b}</span>`
        };
      }
      problems.push(problem);
    }
    return problems;
  },

  // スコア/星/テーマ
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 8,
  starThresholds: {
    star_circle: 100, star1: 105, star2: 115, star3: 125, star4: 135, star5: 145
  },
  themeColors: theme_sakura
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
