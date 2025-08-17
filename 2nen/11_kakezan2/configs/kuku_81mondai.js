/**
 * 設定ファイル：九九（８１問）
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kuku-81mondai-v1', 
  title: '九九（８１問）',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      const allPossibleProblems = [];
      // 1の段から9の段まで全ての組み合わせを生成
      for(let a=1; a<=9; a++){
        for(let b=1; b<=9; b++){
          allPossibleProblems.push({a, b, op:'×', answer: a * b});
        }
      }

      // 全体をシャッフル
      for(let i=allPossibleProblems.length-1; i>0; i--){
        const j = Math.floor(Math.random() * (i+1));
        [allPossibleProblems[i], allPossibleProblems[j]] = [allPossibleProblems[j], allPossibleProblems[i]];
      }
      return allPossibleProblems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10, // 81問 x 10点 = 810点が基本満点
  timeLimitPerQuestion: 3,

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 810,
    star1: 830,
    star2: 860,
    star3: 900,
    star4: 950,
    star5: 1000
  },
  
  // 5. テーマカラー
  themeColors: theme_mono
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
