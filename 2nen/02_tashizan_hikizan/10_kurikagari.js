/**
 * 設定ファイル：くり上がりのあるたし算（1）
 * 例： 18 + 2 = 20
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: '2nen-kurikagari', 
  mainTitle: '',
  title: 'きりのいい数になるたし算',

  // 2. 問題を生成する専門の関数
  problemGenerator: () => {
      const problems = [];
      const usedNumbers = new Set(); // 同じ問題が複数回出ないように管理

      // 問題を10問生成するまでループ
      while (problems.length < 10) {
          // 11から99までのランダムな2桁の数を生成
          // (一の位が0にならないようにする)
          let number1;
          do {
              number1 = Math.floor(Math.random() * 89) + 11; // 11〜99
          } while (number1 % 10 === 0);

          // number1の一の位を10にするために必要な数を計算
          const number2 = 10 - (number1 % 10);
          
          const questionKey = `${number1}+${number2}`;
          if (usedNumbers.has(questionKey)) {
              continue; // 同じ問題が既にあればスキップ
          }
          
          usedNumbers.add(questionKey);

          // 問題オブジェクトを作成して配列に追加
          problems.push({ 
              a: number1, 
              b: number2, 
              op: '＋', 
              answer: number1 + number2 
          });
      }
      return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 5, // 少しだけ長めに設定

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 100,
    star1: 110,
    star2: 120,
    star3: 130,
    star4: 140,
    star5: 150
  },
  
  // 5. このアプリで使うテーマカラー
  // themes.js内の好きなテーマを選べます
  themeColors: theme_forest 
};

// ===================================================================
// ===== アプリケーションの実行 =====
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});