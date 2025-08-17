/**
 * 設定ファイル：九九（１０問）
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kuku-10mondai-v1', 
  title: '九九（１０問）',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      const allPossibleProblems = [];
      // 1の段から9の段まで全ての組み合わせを生成
      for(let a=1; a<=9; a++){
        for(let b=1; b<=9; b++){
          allPossibleProblems.push({a, b, op:'×', answer: a * b});
        }
      }

      // 全体の中から10問をランダムに重複なく選択
      const problems = [];
      for(let i=0; i<10; i++){
        const randomIndex = Math.floor(Math.random() * allPossibleProblems.length);
        problems.push(allPossibleProblems[randomIndex]);
        allPossibleProblems.splice(randomIndex, 1);
      }
      
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
  themeColors: theme_sky
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
