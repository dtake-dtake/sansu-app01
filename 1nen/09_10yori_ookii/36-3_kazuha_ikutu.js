// ９ １０より おおきい かず ／ かずは いくつ？
const config = {
  appId: "36-3_kazuha_ikutu",
  mainTitle: "９　１０より おおきい かず", // ← h1
  title: "かずは いくつ？",                 // ← h2 とタブ

  problemGenerator: () => {
    const problems = [];
    const NUM_QUESTIONS = 10;
    const used = new Set();

    while (problems.length < NUM_QUESTIONS) {
      // 11〜19の基準値
      const a = Math.floor(Math.random() * 9) + 11;
      // 足しても20を超えない範囲で b を選ぶ
      const maxB = 20 - a;
      if (maxB < 1) continue;
      const b = Math.floor(Math.random() * maxB) + 1;

      const key = `${a}+${b}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        answer: a + b,
        displayText: `<span>${a}</span> より <span>${b}</span> おおきい かず`
      });
    }
    return problems;
  },

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 8, // 文章題なので少し長め
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145
  },
  themeColors: theme_lemon
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
