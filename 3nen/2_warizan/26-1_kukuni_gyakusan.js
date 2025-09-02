// ２　わり算
// 九九のぎゃく算 … 10問
// appId(name): 26-1_kukuni_gyakusan

(function () {
  const config = {
    appId: "26-1_kukuni_gyakusan",
    mainTitle: "２　わり算",
    title: "九九のぎゃく算",
    themeColors: theme_sakura, // テーマを「いちごと桜」のピンクテーマに固定
    pointsPerQuestion: 10,
    timeLimitPerQuestion: 8,
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    problemGenerator() {
      const allKuku = [];
      // 1x1から9x9までのすべての組み合わせを作成
      for (let i = 1; i <= 9; i++) {
        for (let j = 1; j <= 9; j++) {
          allKuku.push({ a: i, b: j, product: i * j });
        }
      }

      // 九九のリストをシャッフル
      for (let i = allKuku.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allKuku[i], allKuku[j]] = [allKuku[j], allKuku[i]];
      }

      const problems = [];
      const selectedKuku = allKuku.slice(0, 10); // シャッフル後、最初の10個を使用

      selectedKuku.forEach(p => {
        // 50%の確率で「積 ÷ b = a」か「積 ÷ a = b」のどちらを出すか決める
        if (Math.random() < 0.5) {
          // パターン1: product ÷ b = a
          problems.push({
            displayText: `${p.product} ÷ ${p.b} = __INPUT__`,
            answer: p.a
          });
        } else {
          // パターン2: product ÷ a = b
          problems.push({
            displayText: `${p.product} ÷ ${p.a} = __INPUT__`,
            answer: p.b
          });
        }
      });
      
      return problems;
    }
  };

  // ページの読み込みが完了したら、共通エンジンを初期化
  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();