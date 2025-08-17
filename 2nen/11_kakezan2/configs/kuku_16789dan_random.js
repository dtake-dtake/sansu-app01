/**
 * 設定ファイル：一、六、七、八、九の段の九九（ランダム）
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kuku-16789dan-random-v1', 
  title: '一、六、七、八、九の段の九九',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      const targetDans = [1, 6, 7, 8, 9];
      let allPossibleProblems = [];
      
      for (const dan of targetDans) {
        for (let i = 1; i <= 9; i++) {
          allPossibleProblems.push({ a: dan, b: i, op: '×', answer: dan * i });
        }
      }

      for (let i = allPossibleProblems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPossibleProblems[i], allPossibleProblems[j]] = [allPossibleProblems[j], allPossibleProblems[i]];
      }

      return allPossibleProblems.slice(0, 10);
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 5,

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145
  },
  
  // 5. テーマカラー
  themeColors: theme_steel
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
