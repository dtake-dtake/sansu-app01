// ６ たし算(1) ／ １０までのたしざん（10問）
const quizConfig = {
  // ストレージ識別子（変更可）
  appId: '1nen-tashizan-10made',

  // 画面・タブのタイトル
  title: '１０までのたしざん',

  // 問題の作成：答えが2〜10になる足し算を重複なしで10問
  problemGenerator: () => {
    const list = [];
    const used = new Set();
    const N = 10;

    while (list.length < N) {
      const ans = Math.floor(Math.random() * 9) + 2; // 2〜10
      const a = Math.floor(Math.random() * (ans - 1)) + 1;
      const b = ans - a;

      // a+b と b+a を同一視
      const key = a < b ? `${a}+${b}` : `${b}+${a}`;
      if (used.has(key)) continue;
      used.add(key);

      // 共通エンジン（common.js）が {a,b,op,answer} を描画・採点
      list.push({ a, b, op: '+', answer: ans });
    }
    return list;
  },

  // スコア/タイムボーナス
  pointsPerQuestion: 10,     // 1問10点 → 基本満点100点
  timeLimitPerQuestion: 5,   // 1問あたり5秒を基準にボーナス計算

  // 星のしきい値（基本満点100点を基準）
  starThresholds: {
    star_circle: 100,  // ○
    star1: 110,        // ★
    star2: 120,        // ★★
    star3: 130,        // ★★★
    star4: 140,        // ★★★★
    star5: 145         // ★★★★★（少しだけタイムボーナス必要）
  },

  // テーマ（themes.js）
  themeColors: theme_sky
};

// 起動
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(quizConfig);
});
