// 「〜より〜おおきいかず」ドリルの設定ファイル

const config = {
  appId: "tashizan-bunshodai",
  mainTitle: "９　10より おおきい かず",
  title: "かずは いくつ？",

  problemGenerator: () => {
    const problems = [];
    const NUM_QUESTIONS = 10;
    const used = new Set(); // 問題の重複を防ぐ

    while (problems.length < NUM_QUESTIONS) {
      // 1. 基準になる2けたの数「a」を決める (11から19まで)
      const a = Math.floor(Math.random() * 9) + 11;

      // 2. 「おおきい」数を決める (1から、足しても20を超えない数まで)
      const maxB = 20 - a;
      if (maxB < 1) continue; // 足せる数がなければ作り直す
      const b = Math.floor(Math.random() * maxB) + 1;
      
      const key = `${a}+${b}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        answer: a + b,
        // 問題文の見た目をここで作る
        displayText: `<span>${a}</span> より <span>${b}</span> おおきい かず`
      });
    }
    return problems;
  },

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 8, // 文章を読む時間を考慮して少し長めに
  starThresholds: {
    star_circle: 100, star1: 105, star2: 115, star3: 125, star4: 135, star5: 145,
  },
  themeColors: theme_lemon, // レモンスカッシュの黄色テーマ
};

// ドリルを開始
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(config);
});
