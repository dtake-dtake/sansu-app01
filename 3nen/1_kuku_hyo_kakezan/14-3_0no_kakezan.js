// １　九九の表とかけ算
// ０のかけ算 … 10問
// appId(name): 14-3_0no_kakezan

(function () {
  const config = {
    appId: "14-3_0no_kakezan",
    mainTitle: "１　九九の表とかけ算",
    title: "０のかけ算",
    themeColors: theme_sky, // テーマを「空と海」の青テーマに固定
    pointsPerQuestion: 10,
    timeLimitPerQuestion: 8,
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    // 1問の表示テンプレート
    _expr(a, b) {
      return `${a} × ${b} = __INPUT__`;
    },

    problemGenerator() {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 10を追加して10問に対応

      // 数字の配列をシャッフル
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      // 前半5問: (数) x 0
      const part1Probs = numbers.slice(0, 5).map(num => ({ a: num, b: 0 }));

      // 後半5問: 0 x (数)
      const part2Probs = numbers.slice(5, 10).map(num => ({ a: 0, b: num }));
      
      const finalProblems = [...part1Probs, ...part2Probs];

      // common.js が要求する形式に変換して返す
      return finalProblems.map(p => ({
        displayText: config._expr(p.a, p.b),
        answer: 0 // 答えは常に0
      }));
    }
  };

  // ページの読み込みが完了したら、共通エンジンを初期化
  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();