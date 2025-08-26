// 「答えが10になるひきざん」ドリルの設定ファイル

const config = {
  appId: "hikizan-to-10",
  mainTitle: "９　10より おおきい かず",
  title: "こたえが１０になる ひきざん",

  problemGenerator: () => {
    const problems = [];
    // 問題のパターンを作成 (11-1, 12-2, ..., 19-9)
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // 配列をランダムに並び替え
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // シャッフルされた数字を使って問題を作成
    for (const num of numbers) {
      const a = 10 + num; // 引かれる数 (11〜19)
      const b = num;      // 引く数 (1〜9)
      problems.push({
        answer: 10, // 答えは常に10
        displayText: `<span>${a}</span><span>−</span><span>${b}</span>=`
      });
    }
    
    // 10問にするため、1問追加
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
    star_circle: 100, star1: 105, star2: 115, star3: 125, star4: 135, star5: 145,
  },
  themeColors: theme_ocean, // オーシャンの青緑テーマ
};

// ドリルを開始
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(config);
});
