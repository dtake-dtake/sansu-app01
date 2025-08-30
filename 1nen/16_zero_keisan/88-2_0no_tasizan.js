// ０のたしざん（前半：a+0、後半：0+b）全10問
// h1は未設定（common.jsの既定）、h2 & タブは title
const config = {
  appId: "88-2_0no_tasizan",
  title: "０のたしざん",
  themeColors: theme_sky, // お好みで変更OK

  problemGenerator: () => {
    const probs = [];
    const usedA = new Set(); // a+0 の a の重複防止
    const usedB = new Set(); // 0+b の b の重複防止

    // 前半5問：a + 0（aは1..10に限定：0+0は出さない）
    while (probs.length < 5) {
      const a = Math.floor(Math.random() * 10) + 1; // 1..10
      if (usedA.has(a)) continue;
      usedA.add(a);
      probs.push({ a, b: 0, op: '＋', answer: a });
    }

    // 後半5問：0 + b（bは1..10）
    while (probs.length < 10) {
      const b = Math.floor(Math.random() * 10) + 1; // 1..10
      if (usedB.has(b)) continue;
      usedB.add(b);
      probs.push({ a: 0, b, op: '＋', answer: b });
    }

    return probs; // 出題順は「前半=足す数0」「後半=足される数0」のまま
  },

  pointsPerQuestion: 10,    // 10問×10点=100
  timeLimitPerQuestion: 4,  // 1問4秒を基準にボーナス
  starThresholds: {
    star_circle: 100, // ○
    star1: 108,
    star2: 116,
    star3: 124,
    star4: 132,
    star5: 140
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
