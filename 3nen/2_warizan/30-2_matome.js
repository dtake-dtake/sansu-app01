// ２　わり算
// まとめ … 10問
// appId(name): 30-2_matome

(function () {
  const config = {
    appId: "30-2_matome",
    mainTitle: "２　わり算",
    title: "まとめ",
    themeColors: theme_soda, // テーマを「ソーダフロート」の水色テーマに固定
    pointsPerQuestion: 10,
    timeLimitPerQuestion: 10, // 様々な問題が出るため少し長めに設定
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    problemGenerator() {
      const allProblems = [];
      const usedProblems = new Set();

      // ヘルパー：問題を重複チェックしながら追加
      const addUniqueProblem = (p) => {
        const key = p.displayText;
        if (!usedProblems.has(key)) {
          usedProblems.add(key);
          allProblems.push(p);
        }
      };

      // --- Logic 1: 九九のぎゃく算 (26-1) ---
      const kuku = [];
      for (let i = 1; i <= 9; i++) {
        for (let j = 1; j <= 9; j++) {
          kuku.push({ a: i, b: j, product: i * j });
        }
      }
      kuku.sort(() => 0.5 - Math.random());
      kuku.slice(0, 5).forEach(p => { // 5問ほど候補を追加
        if (Math.random() < 0.5) {
          addUniqueProblem({ displayText: `${p.product} ÷ ${p.b} = __INPUT__`, answer: p.a });
        } else {
          addUniqueProblem({ displayText: `${p.product} ÷ ${p.a} = __INPUT__`, answer: p.b });
        }
      });
      
      // --- Logic 2: 答えが九九にないわり算 (28-2) ---
      // Part A: 10a / a
      const part2a = [2,3,4,5,6,7,8,9].sort(() => 0.5 - Math.random());
      part2a.slice(0, 3).forEach(a => { // 3問ほど候補を追加
        addUniqueProblem({ displayText: `${10 * a} ÷ ${a} = __INPUT__`, answer: 10 });
      });
      // Part B: 0 / a
      const part2b = [1,2,3,4,5,6,7,8,9].sort(() => 0.5 - Math.random());
      part2b.slice(0, 3).forEach(a => { // 3問ほど候補を追加
        addUniqueProblem({ displayText: `0 ÷ ${a} = __INPUT__`, answer: 0 });
      });

      // --- Logic 3: 答えが九九にないわり算⑵ (29-2) ---
      // Part A
      const part3a = [
        { dividend: 40, divisor: 2, answer: 20 }, { dividend: 60, divisor: 3, answer: 20 },
        { dividend: 80, divisor: 4, answer: 20 }, { dividend: 90, divisor: 3, answer: 30 },
      ];
      part3a.sort(() => 0.5 - Math.random());
      part3a.slice(0, 2).forEach(p => { // 2問ほど候補を追加
        addUniqueProblem({ displayText: `${p.dividend} ÷ ${p.divisor} = __INPUT__`, answer: p.answer });
      });
      // Part B
      const part3b = [
        { dividend: 39, divisor: 3, answer: 13 }, { dividend: 48, divisor: 4, answer: 12 },
        { dividend: 66, divisor: 3, answer: 22 }, { dividend: 69, divisor: 3, answer: 23 },
        { dividend: 84, divisor: 4, answer: 21 }, { dividend: 26, divisor: 2, answer: 13 },
      ];
      part3b.sort(() => 0.5 - Math.random());
      part3b.slice(0, 3).forEach(p => { // 3問ほど候補を追加
        addUniqueProblem({ displayText: `${p.dividend} ÷ ${p.divisor} = __INPUT__`, answer: p.answer });
      });

      // --- 最終調整 ---
      // 全候補リストをシャッフルし、最終的に10問選ぶ
      for (let i = allProblems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allProblems[i], allProblems[j]] = [allProblems[j], allProblems[i]];
      }

      return allProblems.slice(0, 10);
    }
  };

  // ページの読み込みが完了したら、共通エンジンを初期化
  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();