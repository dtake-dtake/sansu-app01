/**
 * 設定ファイル：二十いくつからのくり下がり
 * 例： 23 - 4 = 19
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: '2nen-kurisagari-20s',
  mainTitle: '８０　くり下がりのあるひき算(3)',
  title: '２０いくつのひき算のくり下がり',

  // 2. 問題を生成する専門の関数
  problemGenerator: () => {
    const problems = [];
    const usedQuestions = new Set(); // 同じ問題が複数回出ないように管理

    // 問題を10問生成するまでループ
    while (problems.length < 10) {
      // 21から28までのランダムな数を生成
      // (29だと、くり下がりの問題が作れないため)
      const number1 = Math.floor(Math.random() * 8) + 21;

      // 必ずくり下がりが起きるように、引く数を決める
      const onesDigit = number1 % 10; // number1の一の位を取得
      
      // 引く数は、「一の位の数」より大きく、9以下でなければならない
      const minNumber2 = onesDigit + 1;
      const maxNumber2 = 9;
      
      const number2 = Math.floor(Math.random() * (maxNumber2 - minNumber2 + 1)) + minNumber2;

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
  timeLimitPerQuestion: 6,

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
  },
  
  // 5. このアプリで使うテーマカラー
  themeColors: theme_soda // ソーダのテーマ 🧊
};

// ===================================================================
// ===== アプリケーションの実行 =====
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});