// 「10までのたし算」ドリルの設定ファイル

const config = {
  // アプリのID（LocalStorageのキーなどで使用）
  appId: "tashizan-10made-ver3", // IDを更新して記録をリセット

  // メインタイトルとして表示される文字列
  mainTitle: "６　たしざん(1)",

  // サブタイトル（問題内容）として表示される文字列
  title: "１０までのたしざん",

  // 問題を自動で作る関数
  problemGenerator: () => {
    const problems = [];
    const generated = new Set();
    const NUM_QUESTIONS = 10;

    while (problems.length < NUM_QUESTIONS) {
      // ★★★【改善ロジック】★★★
      // 1. 先に「答え」を決める (2から10まで)
      const answer = Math.floor(Math.random() * 9) + 2;

      // 2. 答えから、足される数「a」を決める (1から「答え-1」まで)
      //    例：答えが5なら、aは1〜4のいずれか
      const a = Math.floor(Math.random() * (answer - 1)) + 1;

      // 3. 足す数「b」を計算で求める
      const b = answer - a;
      // ★★★★★★★★★★★★★★★

      // 「1+2」と「2+1」のような重複を防ぐ
      const key = [a, b].sort().join('+');
      if (generated.has(key)) {
        continue;
      }
      generated.add(key);

      problems.push({ a, b, op: '＋', answer });
    }
    return problems;
  },

  // 1問あたりの基本点
  pointsPerQuestion: 10,

  // 1問あたりのタイムボーナス計算に使う時間（秒）
  timeLimitPerQuestion: 5,

  // スコアに応じた「ステータス」の★の基準
  starThresholds: {
    star_circle: 100,
    star1: 105,
    star2: 115,
    star3: 125,
    star4: 135,
    star5: 145,
  },

  // デザインのテーマカラー
  themeColors: theme_sky,
};

// HTMLの読み込み完了後に、共通エンジンを呼び出してドリルを開始する
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(config);
});