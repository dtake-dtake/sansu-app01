// ３つのかずのひき算⑴
// h1は未設定 → common.js のデフォルト
const config = {
  appId: "56-4_3ttuno_kazuno_hikizan",
  title: "３つのかずのひき算⑴",   // ← h2 とタブに表示

  problemGenerator: () => {
    const problems = [];
    const used = new Set();

    // 前半5問：小さめの数から2回引いて答えが1以上
    while (problems.length < 5) {
      const a = Math.floor(Math.random() * 6) + 5;  // 5〜10
      const b = Math.floor(Math.random() * (a - 1)) + 1;
      const c = Math.floor(Math.random() * (a - b)) + 1;
      const ans = a - b - c;
      if (ans < 1) continue;

      const key = `A:${a}-${b}-${c}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        a, b, c,
        answer: ans,
        displayText: `<span>${a}</span>−<span>${b}</span>−<span>${c}</span>=`
      });
    }

    // 後半5問：最初の引き算で必ず10を作り、そのあとさらに引く
    const tenCases = [[14,4],[12,2],[17,7],[11,1],[13,3]];
    for (let k = 0; k < 5; k++) {
      const [a, b] = tenCases[k];
      const c = Math.floor(Math.random() * 5) + 1; // 1〜5
      const ans = a - b - c;

      const key = `B:${a}-${b}-${c}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        a, b, c,
        answer: ans,
        displayText: `<span>${a}</span>−<span>${b}</span>−<span>${c}</span>=`
      });
    }

    return problems;
  },

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 7,
  starThresholds: {
    star_circle: 100,
    star1: 108,
    star2: 116,
    star3: 124,
    star4: 132,
    star5: 140
  },

  // 今回は theme_mint を使用（緑系）
  themeColors: theme_mint
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
