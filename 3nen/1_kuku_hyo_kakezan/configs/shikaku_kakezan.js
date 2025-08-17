/**
 * 設定ファイル：□のかけ算
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: 'shikaku-kakezan-v1', 
  title: '□にはいる数は？',

  // 2. 問題を生成する関数
  problemGenerator: () => {
      const allKukuFacts = [];
      for (let a=1; a<=9; a++) {
        for (let b=1; b<=9; b++) {
          allKukuFacts.push({a, b, answer: a * b});
        }
      }

      // Fisher-Yates shuffle
      const shuffleArray = (array) => {
          for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
          }
      }
      shuffleArray(allKukuFacts);

      const problems = [];
      const usedFacts = new Set();

      for(const fact of allKukuFacts) {
        if(problems.length >= 10) break;

        const factKey1 = `${fact.a}-${fact.b}`;
        const factKey2 = `${fact.b}-${fact.a}`;
        if(usedFacts.has(factKey1) || usedFacts.has(factKey2)) continue;
        
        if (Math.random() < 0.5) {
          problems.push({ type: 'a_missing', a: fact.a, b: fact.b, answer: fact.answer, correctInput: fact.a });
        } else {
          problems.push({ type: 'b_missing', a: fact.a, b: fact.b, answer: fact.answer, correctInput: fact.b });
        }
        usedFacts.add(factKey1);
      }
      return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 4,

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
  themeColors: theme_mint
};

// ===================================================================
// アプリケーションの実行
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});
