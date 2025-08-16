/**
 * 設定ファイル：三の段の九九（じゅんばん）
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kuku-3dan-junban', 
  title: '三の段の九九（じゅんばん）',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      const problems = [];
      for (let i = 1; i <= 9; i++) {
          problems.push({ a: 3, b: i, op: '×', answer: 3 * i });
      }
      return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 3,

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 90,
    star1: 95,
    star2: 105,
    star3: 115,
    star4: 125,
    star5: 135
  },
  
  // 5. テーマカラー
  themeColors: theme_sunset 
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
