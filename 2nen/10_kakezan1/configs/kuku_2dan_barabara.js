/**
 * 設定ファイル：二の段の九九（ばらばら）
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kuku-2dan-barabara',
  title: '二の段の九九（ばらばら）',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      let problems = [];
      for (let i = 1; i <= 9; i++) {
          problems.push({ a: 2, b: i, op: '×', answer: 2 * i });
      }
      // Fisher-Yatesアルゴリズムで配列をシャッフル
      for (let i = problems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [problems[i], problems[j]] = [problems[j], problems[i]];
      }
      return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 4, // 順番より少しだけ時間を長く設定

  // 4. 星の獲得基準（ばらばらは少し難しいので、基準を少し優しめに設定）
  starThresholds: {
    star_circle: 90,
    star1: 94,
    star2: 102,
    star3: 110,
    star4: 120,
    star5: 130
  },
  
  // 5. テーマカラー
  themeColors: theme_forest
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
