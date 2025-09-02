// １　九九の表とかけ算
// □のかけざん … 10問
// appId(name): 15-2_sikakuno_kakezan

(function () {
  const config = {
    appId: "15-2_sikakuno_kakezan",
    mainTitle: "１　九九の表とかけ算",
    title: "□のかけざん",
    themeColors: theme_forest, // テーマを「森と若葉」の緑テーマに固定
    pointsPerQuestion: 10,
    timeLimitPerQuestion: 10, // 少し難易度が上がるため時間を延長
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    problemGenerator() {
      const allKuku = [];
      // 1x1から9x9までのすべての組み合わせを作成
      for (let i = 1; i <= 9; i++) {
        for (let j = 1; j <= 9; j++) {
          allKuku.push({ a: i, b: j });
        }
      }

      // 九九のリストをシャッフル
      for (let i = allKuku.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allKuku[i], allKuku[j]] = [allKuku[j], allKuku[i]];
      }

      const problems = [];
      const selectedKuku = allKuku.slice(0, 10); // シャッフル後、最初の10個を使用

      // 前半5問: a x □ = c (答えはb)
      for (let i = 0; i < 5; i++) {
        const p = selectedKuku[i];
        problems.push({
          displayText: `${p.a} × __INPUT__ = ${p.a * p.b}`,
          answer: p.b
        });
      }

      // 後半5問: □ x b = c (答えはa)
      for (let i = 5; i < 10; i++) {
        const p = selectedKuku[i];
        problems.push({
          displayText: `__INPUT__ × ${p.b} = ${p.a * p.b}`,
          answer: p.a
        });
      }
      
      return problems;
    }
  };

  // ページの読み込みが完了したら、共通エンジンを初期化
  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();