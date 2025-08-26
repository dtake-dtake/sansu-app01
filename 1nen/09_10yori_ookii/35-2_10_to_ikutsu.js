// １０といくつ（10問）
// h1: ９　１０より大きい数 / title: １０といくつ
const config = {
  // ストレージ識別子（重複しないIDに）
  appId: "1nen-10toikutsu",

  // 見出し＆タブ
  mainTitle: "９　１０より大きい数", // ← h1
  title: "１０といくつ",           // ← h2 / document.title

  // 問題生成：10 + 1..10 をシャッフルして10問
  problemGenerator: () => {
    // 1..10 をシャッフル
    const nums = Array.from({ length: 10 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    // 共通エンジン用フォーマット {a,b,op,answer}
    return nums.map(n => ({
      a: 10,
      b: n,
      op: "+",
      answer: 10 + n
    }));
  },

  // スコア/タイムボーナス
  pointsPerQuestion: 10,   // 基本満点 100
  timeLimitPerQuestion: 4, // 1問4秒を基準にボーナス

  // 星のしきい値（基準は100点）
  starThresholds: {
    star_circle: 100, // ○
    star1: 108,       // ★
    star2: 116,       // ★★
    star3: 124,       // ★★★
    star4: 132,       // ★★★★
    star5: 140        // ★★★★★
  },

  // テーマ（お好みで変更可）
  themeColors: theme_sky
};

// 起動
document.addEventListener("DOMContentLoaded", () => {
  // 共通エンジン（common.js）
  initializeDrillApp(config);
});
