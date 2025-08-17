// 「10たすいくつ」ドリルの設定ファイル

const config = {
  // アプリのID
  appId: "tashizan-10plus",

  // メインタイトル（単元名）
  mainTitle: "９　10より おおきい かず",

  // サブタイトル
  title: "１０たす いくつ",

  // 問題を10問作る関数
  problemGenerator: () => {
    const problems = [];
    // 1から9までの数字のリストを作成
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // 配列をランダムに並び替え
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    // 10問になるように問題を1つ追加（例：10+10）
    numbers.push(10);

    // シャッフルされた数字を使って問題を作成
    for (const num of numbers) {
      problems.push({
        // ★★★【重要】★★★
        // 解答（まるつけ用）と、表示用のHTML文字列を両方渡す
        answer: 10 + num,
        displayText: `<span>10</span><span>＋</span><span>${num}</span>=`
      });
    }
    
    return problems;
  },

  // 1問あたりの基本点
  pointsPerQuestion: 10,

  // タイムボーナス計算に使う時間（1問あたり4秒）
  timeLimitPerQuestion: 4,

  // スコアに応じた星の評価基準
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145,
  },

  // デザインテーマ（マリンの深海テーマを選択）
  themeColors: theme_marine,
};

// HTMLが読み込み終わったら、共通の仕組みを呼び出してドリルを開始します
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(config);
});
