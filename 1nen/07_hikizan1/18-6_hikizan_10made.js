// ７ ひきざん(1) ／ １０までのひきざん（10問）
const quizConfig = {
  // ストレージ識別子
  appId: '1nen-hikizan-10made',

  // タイトル（必要なら subtitle も渡せます）
  title: '７　ひきざん⑴（１０までのひきざん）',
  subtitle: '１０までのひきざん',

  // ひき算10問：aは2〜10、bは1〜a-1（重複なし）
  problemGenerator: () => {
    const problems = [];
    const used = new Set();
    const N = 10;

    while (problems.length < N) {
      const a = Math.floor(Math.random() * 9) + 2;     // 2〜10
      const b = Math.floor(Math.random() * (a - 1)) + 1; // 1〜a-1
      const key = `${a}-${b}`;
      if (used.has(key)) continue;
      used.add(key);
      problems.push({ a, b, op: '−', answer: a - b }); // 共通エンジン形式
    }
    return problems;
  },

  // スコア/タイムボーナス
  pointsPerQuestion: 10,   // 10問×10点 = 基本満点100
  timeLimitPerQuestion: 5, // 1問5秒基準

  // 星のしきい値（基本満点100点を基準）
  starThresholds: {
    star_circle: 100, // ○
    star1: 110,       // ★
    star2: 120,       // ★★
    star3: 130,       // ★★★
    star4: 140,       // ★★★★
    star5: 150        // ★★★★★
  },

  // テーマ（themes.js の任意テーマ）
  themeColors: theme_sky
};

// 起動
document.addEventListener('DOMContentLoaded', () => {
  initializeDrillApp(quizConfig);
});
