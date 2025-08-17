// 「10までのひきざん」ドリルの設定ファイル

const config = {
  // アプリのID（記録を保存するために使います）
  appId: "hikizan-10made",

  // メインタイトル
  mainTitle: "７　ひきざん(1)",

  // サブタイトル
  title: "１０までのひきざん",

  // ひき算の問題を10問作る関数
  problemGenerator: () => {
    const problems = [];
    const generated = new Set(); // 問題の重複を防ぎます
    const NUM_QUESTIONS = 10;

    while (problems.length < NUM_QUESTIONS) {
      // 1. 引かれる数「a」を決める (2から10まで)
      const a = Math.floor(Math.random() * 9) + 2;

      // 2. 引く数「b」を決める (1から「a-1」まで)
      const b = Math.floor(Math.random() * (a - 1)) + 1;

      const key = `${a}-${b}`;
      if (generated.has(key)) {
        continue; // 同じ問題がすでにあれば作り直す
      }
      generated.add(key);

      problems.push({
        answer: a - b,
        displayText: `<span>${a}</span><span>−</span><span>${b}</span>=`
      });
    }
    return problems;
  },

  // 1問あたりの基本点
  pointsPerQuestion: 10,

  // タイムボーナス計算に使う時間（1問あたり5秒）
  timeLimitPerQuestion: 5,

  // スコアに応じた星の評価基準
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145,
  },

  // デザインテーマ（今回はぶどうの紫テーマを選択）
  themeColors: theme_grape,
};

// HTMLが読み込み終わったら、共通の仕組みを呼び出してドリルを開始します
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(config);
});
