// １　九九の表とかけ算
// １０のかけざん … 10問
// appId(name): 13-2,3_10no_kakezan

(function () {
  // テーマは毎回ランダム（themes.js から存在するものだけ拾う）
  const themeNames = [
    "theme_matcha","theme_marine","theme_sky","theme_ocean","theme_mint",
    "theme_peach","theme_lemon","theme_forest","theme_sakura","theme_ruby","theme_sunset"
  ];
  const themePool = themeNames.map(n => globalThis[n]).filter(Boolean);
  const randomTheme = themePool.length ? themePool[Math.floor(Math.random()*themePool.length)] : undefined;

  const config = {
    appId: "13-2,3_10no_kakezan",
    mainTitle: "１　九九の表とかけ算",
    title: "１０のかけざん",
    themeColors: randomTheme,
    pointsPerQuestion: 10,     // 10問×10点=100点
    timeLimitPerQuestion: 8,   // 1問あたりの制限時間（秒）
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    // 1問の表示テンプレート
    // __INPUT__ の部分が自動的に解答欄に置き換えられます
    _expr(a, b) {
      return `${a} × ${b} = __INPUT__`;
    },

    problemGenerator() {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      // 数字の配列をシャッフル（Fisher-Yates法）
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      const part1Probs = []; // 前半5問
      const part2Probs = []; // 後半5問

      // 10x10 を前半に入れるか後半に入れるかランダムに決定
      const tenByTenInPart1 = Math.random() < 0.5;

      if (tenByTenInPart1) {
        // --- 10x10 を前半に入れるパターン ---
        part1Probs.push({ a: 10, b: 10 });
        // 前半の残り4問 (自然数 x 10)
        for (let i = 0; i < 4; i++) {
          part1Probs.push({ a: numbers[i], b: 10 });
        }
        // 後半の5問 (10 x 自然数)
        for (let i = 4; i < 9; i++) {
          part2Probs.push({ a: 10, b: numbers[i] });
        }
      } else {
        // --- 10x10 を後半に入れるパターン ---
        part2Probs.push({ a: 10, b: 10 });
        // 後半の残り4問 (10 x 自然数)
        for (let i = 0; i < 4; i++) {
          part2Probs.push({ a: 10, b: numbers[i] });
        }
        // 前半の5問 (自然数 x 10)
        for (let i = 4; i < 9; i++) {
          part1Probs.push({ a: numbers[i], b: 10 });
        }
      }

      // 各パート内で問題の順番をさらにシャッフル
      for (let i = part1Probs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [part1Probs[i], part1Probs[j]] = [part1Probs[j], part1Probs[i]];
      }
      for (let i = part2Probs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [part2Probs[i], part2Probs[j]] = [part2Probs[j], part2Probs[i]];
      }
      
      const finalProblems = [...part1Probs, ...part2Probs];

      // common.js が要求する形式に変換して返す
      return finalProblems.map(p => ({
        displayText: config._expr(p.a, p.b),
        answer: p.a * p.b
      }));
    }
  };

  // ページの読み込みが完了したら、共通エンジンを初期化
  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();