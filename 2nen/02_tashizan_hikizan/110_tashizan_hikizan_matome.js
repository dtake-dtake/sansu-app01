/**
 * 設定ファイル：2桁のたし算とひき算（まとめ）
 * 例： 14 + 9, 27 - 9 など
 */

const quizConfig = {
  // 1. アプリの基本情報
  appId: '2nen-tashizan-hikizan-matome',
  mainTitle: '１１０　たし算とひき算のまとめ',
  title: 'たし算と ひき算の れんしゅう',

  // 2. 問題を生成する専門の関数
  problemGenerator: () => {
    let problems = [];
    const usedQuestions = new Set(); // 同じ問題が複数回出ないように管理

    // --- ステップ1: くり上がりのある足し算を5問作成 ---
    while (problems.filter(p => p.op === '＋').length < 5) {
      let num1 = Math.floor(Math.random() * 88) + 11; // 11〜98
      if (num1 % 10 === 0) continue; // 一の位が0は避ける

      const onesDigit = num1 % 10;
      const minNum2 = 10 - onesDigit; // くり上がり必須
      if (minNum2 > 9) continue;
      
      const num2 = Math.floor(Math.random() * (9 - minNum2 + 1)) + minNum2;
      const key = `${num1}+${num2}`;
      if (usedQuestions.has(key)) continue;

      usedQuestions.add(key);
      problems.push({ a: num1, b: num2, op: '＋', answer: num1 + num2 });
    }

    // --- ステップ2: くり下がりのある引き算を5問作成 ---
    while (problems.filter(p => p.op === '－').length < 5) {
      let num1 = Math.floor(Math.random() * 88) + 11; // 11〜98
      if (num1 % 10 === 0) continue;

      const onesDigit = num1 % 10;
      const minNum2 = onesDigit + 1; // くり下がり必須
      if (minNum2 > 9) continue;

      const num2 = Math.floor(Math.random() * (9 - minNum2 + 1)) + minNum2;
      const key = `${num1}-${num2}`;
      if (usedQuestions.has(key)) continue;

      usedQuestions.add(key);
      problems.push({ a: num1, b: num2, op: '－', answer: num1 - num2 });
    }

    // --- ステップ3: 問題をシャッフルして順番をバラバラにする ---
    for (let i = problems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [problems[i], problems[j]] = [problems[j], problems[i]];
    }
    
    return problems;
  },

  // 3. スコアリング設定
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 8, // 少し複雑なため、制限時間を長めに

  // 4. 星の獲得基準
  starThresholds: {
    star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
  },
  
  // 5. このアプリで使うテーマカラー
  themeColors: theme_marine // マリンのテーマ 🐠
};

// ===================================================================
// ===== アプリケーションの実行 =====
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});