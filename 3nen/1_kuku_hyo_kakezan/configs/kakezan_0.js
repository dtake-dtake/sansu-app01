/**
 * 設定ファイル：0のかけ算
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kakezan-0-v1', 
  title: '0のかけ算',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      let problems = [];
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      // Fisher-Yates shuffle
      const shuffleArray = (array) => {
          for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
          }
      }

      // 1. かけられる数が0の問題を5問 (例: 0 x 7)
      shuffleArray(numbers);
      for(let i=0; i<5; i++) {
          problems.push({a: 0, b: numbers[i], op:'×', answer: 0 * numbers[i]});
      }
      
      // 2. かける数が0の問題を5問 (例: 3 x 0)
      shuffleArray(numbers); // もう一度シャッフル
      for(let i=0; i<5; i++) {
          problems.push({a: numbers[i], b: 0, op:'×', answer: numbers[i] * 0});
      }

      // 3. 全体をシャッフル
      shuffleArray(problems);
      
      return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 3,

  // 4. 星の獲得基準 (10問×10点=100点が基本満点)
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145
  },
  
  // 5. テーマカラー
  themeColors: theme_lemon
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
