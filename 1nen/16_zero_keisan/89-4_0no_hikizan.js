// ０のひきざん（前半：a−a=0、後半：a−0=a）
const config = {
  appId: "89-4_0no_hikizan",
  title: "０のひきざん",
  themeColors: theme_ocean,   // お好みで変更OK

  problemGenerator: () => {
    const problems = [];
    const usedSame = new Set(); // a−a の a 重複防止
    const usedZero = new Set(); // a−0 の a 重複防止

    // 前半5問：引くと0になる（a − a = 0）
    while (problems.length < 5) {
      const a = Math.floor(Math.random() * 10) + 1; // 1..10
      if (usedSame.has(a)) continue;
      usedSame.add(a);
      problems.push({
        a, b: a, op: '−',
        answer: 0,
        displayText: `<span>${a}</span><span>−</span><span>${a}</span>=`
      });
    }

    // 後半5問：0を引く（a − 0 = a）
    while (problems.length < 10) {
      const a = Math.floor(Math.random() * 10) + 1; // 1..10
      if (usedZero.has(a)) continue;
      usedZero.add(a);
      problems.push({
        a, b: 0, op: '−',
        answer: a,
        displayText: `<span>${a}</span><span>−</span><span>0</span>=`
      });
    }

    return problems; // 出題順：前半5問→後半5問のまま
  },

  pointsPerQuestion: 10,   // 10問×10点=100
  timeLimitPerQuestion: 4, // 1問4秒を基準
  starThresholds: {
    star_circle: 100,
    star1: 108,
    star2: 116,
    star3: 124,
    star4: 132,
    star5: 140
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
