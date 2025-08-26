/**
 * 設定ファイル：くり上がりのあるたし算（2）
 * 例： 38 + 4 = 42
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: '2nen-kurikagari-2',
  mainTitle: '二けた ＋ 一けたのくり上がり⑵',
  title: '二けた ＋ 一けたのくり上がり⑵',

  // 2. 問題を生成する専門の関数
  problemGenerator: () => {
    const problems = [];
    const usedQuestions = new Set(); // 同じ問題が複数回出ないように管理

    // 問題を10問生成するまでループ
    while (problems.length < 10) {
      // 11から98までのランダムな2桁の数を生成
      // (一の位が0や9だと、繰り上がり問題を作りにくいため避ける)
      let number1;
      do {
        number1 = Math.floor(Math.random() * 88) + 11; // 11〜98
      } while (number1 % 10 === 0 || number1 % 10 === 9);

      // 繰り上がりが起きるように、足す1桁の数を決める
      // (number1の一の位を10以上にするために必要な最小の数から、8までの間でランダムに選ぶ)
      const minNumber2 = 10 - (number1 % 10);
      const maxNumber2 = 9;
      
      // minNumber2がmaxNumber2より大きい場合は問題が作れないのでやり直す
      if (minNumber2 > maxNumber2) {
        continue;
      }
      
      const number2 = Math.floor(Math.random() * (maxNumber2 - minNumber2 + 1)) + minNumber2;

      // 答えが100を超えていたらやり直す
      if (number1 + number2 > 100) {
        continue;
      }

      const questionKey = `${number1}+${number2}`;
      if (usedQuestions.has(questionKey)) {
        continue; // 同じ問題が既にあればスキップ
      }
      
      usedQuestions.add(questionKey);

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
  timeLimitPerQuestion: 10, // 少し難しいため、制限時間を少し長く

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
  },
  
  // 5. このアプリで使うテーマカラー
  themeColors: theme_sakura // 桜のテーマ 🌸
};

// ===================================================================
// ===== アプリケーションの実行 =====
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});