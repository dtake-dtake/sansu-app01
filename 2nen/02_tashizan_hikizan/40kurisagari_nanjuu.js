/**
 * 設定ファイル：何十からのくり下がり
 * 例： 60 - 6 = 54
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: '2nen-kurisagari-nanjuu',
  mainTitle: '何十 ひく 一けた',
  title: '何十 ひく 一けた',

  // 2. 問題を生成する専門の関数
  problemGenerator: () => {
    const problems = [];
    const usedQuestions = new Set(); // 同じ問題が複数回出ないように管理

    // 問題を10問生成するまでループ
    while (problems.length < 10) {
      // 20, 30, ..., 90 の中からランダムに選ぶ
      const number1 = (Math.floor(Math.random() * 8) + 2) * 10;

      // 1から9までの中からランダムに選ぶ
      const number2 = Math.floor(Math.random() * 9) + 1;

      const questionKey = `${number1}-${number2}`;
      if (usedQuestions.has(questionKey)) {
        continue; // 同じ問題が既にあればスキップ
      }
      
      usedQuestions.add(questionKey);

      // 問題オブジェクトを作成して配列に追加
      problems.push({
        a: number1,
        b: number2,
        op: '－',
        answer: number1 - number2
      });
    }
    return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 6, // 少しだけ時間を設定

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
  },
  
  // 5. このアプリで使うテーマカラー
  themeColors: theme_sunset // 夕焼けのテーマ ☀️
};

// ===================================================================
// ===== アプリケーションの実行 =====
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});