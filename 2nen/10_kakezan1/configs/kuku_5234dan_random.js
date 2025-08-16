/**
 * 設定ファイル：二～五の段の九九（ランダム）
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'kuku-2345dan-random', 
  title: '二～五の段の九九（ランダム）',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      const targetDans = [2, 3, 4, 5];
      let allPossibleProblems = [];
      
      // 2,3,4,5の段のすべての組み合わせを生成
      for (const dan of targetDans) {
        for (let i = 1; i <= 9; i++) {
          allPossibleProblems.push({ a: dan, b: i, op: '×', answer: dan * i });
        }
      }

      // 全体をシャッフル
      for (let i = allPossibleProblems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPossibleProblems[i], allPossibleProblems[j]] = [allPossibleProblems[j], allPossibleProblems[i]];
      }

      // 先頭から10問だけを抽出
      return allPossibleProblems.slice(0, 10);
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 5, // 複数の段が混ざるため、時間を少し長めに設定

  // 4. 星の獲得基準（10問×10点=100点が基本満点）
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145
  },
  
  // 5. テーマカラー
  themeColors: theme_indigo
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
