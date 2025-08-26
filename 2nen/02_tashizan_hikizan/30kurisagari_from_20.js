/**
 * 設定ファイル：20からのくり下がり
 * 例： 20 - 5 = 15
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: '2nen-kurisagari-from-20',
  mainTitle: '',
  title: '２０ ひく 一けた',

  // 2. 問題を生成する専門の関数
  problemGenerator: () => {
    const problems = [];
    
    // 1から9までの数字の配列を用意
    let numbersToSubtract = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // 配列をシャッフルして、問題の順番をランダムにする
    // (フィッシャー–イェーツのシャッフル)
    for (let i = numbersToSubtract.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbersToSubtract[i], numbersToSubtract[j]] = [numbersToSubtract[j], numbersToSubtract[i]];
    }

    // 10問にするため、シャッフルした9問に、もう1問ランダムに追加
    const extraNumber = Math.floor(Math.random() * 9) + 1;
    numbersToSubtract.push(extraNumber);

    // 問題オブジェクトの配列を作成
    for (const num of numbersToSubtract) {
      problems.push({
        a: 20,
        b: num,
        op: '－',
        answer: 20 - num
      });
    }
    
    return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 5,

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
  },
  
  // 5. このアプリで使うテーマカラー
  themeColors: theme_grape // ぶどうのテーマ 🍇
};

// ===================================================================
// ===== アプリケーションの実行 =====
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});