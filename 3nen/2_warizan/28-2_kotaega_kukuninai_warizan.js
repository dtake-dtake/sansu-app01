// ２　わり算
// 答えが九九にないわり算 … 10問
// appId(name): 28-2_kotaega_kukuninai_warizan

(function () {
  const config = {
    appId: "28-2_kotaega_kukuninai_warizan",
    mainTitle: "２　わり算",
    title: "答えが九九にないわり算",
    themeColors: theme_marine, // テーマを「マリン」の深海テーマに固定
    pointsPerQuestion: 10,
    timeLimitPerQuestion: 9,
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    problemGenerator() {
      const problems = [];
      const usedNumbers = new Set();

      // 前半5問: 10a ÷ a (aは2から9の自然数)
      const part1Numbers = [2, 3, 4, 5, 6, 7, 8, 9];
      // シャッフル
      for (let i = part1Numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [part1Numbers[i], part1Numbers[j]] = [part1Numbers[j], part1Numbers[i]];
      }
      
      for(let i = 0; i < 5; i++) {
        const a = part1Numbers[i];
        problems.push({
          displayText: `${10 * a} ÷ ${a} = __INPUT__`,
          answer: 10
        });
        usedNumbers.add(a); // 後半で重複しないように記録
      }

      // 後半5問: 0 ÷ a (aは前半で使っていない1から9の自然数)
      const part2Numbers = [];
      for (let i = 1; i <= 9; i++) {
        if (!usedNumbers.has(i)) {
          part2Numbers.push(i);
        }
      }
       // シャッフル
      for (let i = part2Numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [part2Numbers[i], part2Numbers[j]] = [part2Numbers[j], part2Numbers[i]];
      }

      for(let i = 0; i < 5; i++) {
        const a = part2Numbers[i];
        problems.push({
          displayText: `0 ÷ ${a} = __INPUT__`,
          answer: 0
        });
      }
      
      return problems;
    }
  };

  // ページの読み込みが完了したら、共通エンジンを初期化
  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();