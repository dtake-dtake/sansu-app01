/**
 * 設定ファイル：九の段の九九（ばらばら）
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kuku-9dan-barabara',
  title: '九の段の九九（ばらばら）',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      let problems = [];
      for (let i = 1; i <= 9; i++) {
          problems.push({ a: 9, b: i, op: '×', answer: 9 * i });
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
  timeLimitPerQuestion: 4,

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 90,
    star1: 94,
    star2: 102,
    star3: 110,
    star4: 120,
    star5: 130
  },
  
  // 5. テーマカラー
  themeColors: theme_ruby
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
