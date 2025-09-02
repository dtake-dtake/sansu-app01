// ２　わり算
// 答えが九九にないわり算⑵ … 10問
// appId(name): 29-2_kotaega_kukuninai_warizan2

(function () {
  const config = {
    appId: "29-2_kotaega_kukuninai_warizan2",
    mainTitle: "２　わり算",
    title: "答えが九九にないわり算⑵",
    themeColors: theme_grape, // テーマを「夜空とぶどう」の紫テーマに固定
    pointsPerQuestion: 10,
    timeLimitPerQuestion: 12, // 少し考える時間が長めの問題
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    problemGenerator() {
      const problems = [];
      const usedProblems = new Set();

      // ヘルパー：問題をセットに追加し、重複がないかチェック
      const addProblem = (p) => {
        const key = `${p.displayText}`;
        if (usedProblems.has(key)) return false;
        usedProblems.add(key);
        problems.push(p);
        return true;
      };

      // --- 前半5問: (10ab)/b = 10a のパターン ---
      const part1Pool = [
        { dividend: 40, divisor: 2, answer: 20 },
        { dividend: 60, divisor: 2, answer: 30 },
        { dividend: 60, divisor: 3, answer: 20 },
        { dividend: 80, divisor: 2, answer: 40 },
        { dividend: 80, divisor: 4, answer: 20 },
        { dividend: 90, divisor: 3, answer: 30 },
      ];
      // プールをシャッフル
      for (let i = part1Pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [part1Pool[i], part1Pool[j]] = [part1Pool[j], part1Pool[i]];
      }
      for (const item of part1Pool) {
        if (problems.length < 5) {
          addProblem({
            displayText: `${item.dividend} ÷ ${item.divisor} = __INPUT__`,
            answer: item.answer
          });
        } else break;
      }

      // --- 後半5問: (ab+ac)/a = b+c のパターン ---
      const part2Pool = [
        { dividend: 39, divisor: 3, answer: 13 },
        { dividend: 48, divisor: 4, answer: 12 },
        { dividend: 55, divisor: 5, answer: 11 },
        { dividend: 66, divisor: 3, answer: 22 },
        { dividend: 69, divisor: 3, answer: 23 },
        { dividend: 77, divisor: 7, answer: 11 },
        { dividend: 84, divisor: 4, answer: 21 },
        { dividend: 96, divisor: 3, answer: 32 },
        { dividend: 26, divisor: 2, answer: 13 },
        { dividend: 46, divisor: 2, answer: 23 },
      ];
       // プールをシャッフル
      for (let i = part2Pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [part2Pool[i], part2Pool[j]] = [part2Pool[j], part2Pool[i]];
      }
      for (const item of part2Pool) {
        if (problems.length < 10) {
          addProblem({
            displayText: `${item.dividend} ÷ ${item.divisor} = __INPUT__`,
            answer: item.answer
          });
        } else break;
      }
      
      return problems;
    }
  };

  // ページの読み込みが完了したら、共通エンジンを初期化
  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();