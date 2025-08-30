// ３つのかずのけいさん⑴（前半: 合計≤10 / 後半: 最初の2つで10を作ってから+3つ目）
const config = {
  appId: "55-2_3ttuno_kazu_tasizan",
  mainTitle: "９　１０より おおきい かず",   // ← h1
  title: "３つのかずのけいさん⑴",           // ← h2 & タブ

  problemGenerator: () => {
    const problems = [];
    const used = new Set();

    // --- 前半5問：a+b+c ≤ 10（できるだけ a+b を10に近づける） ---
    while (problems.length < 5) {
      const target = Math.floor(Math.random() * 5) + 5; // 5..9（10に近い和）
      const a = Math.floor(Math.random() * (target - 1)) + 1; // 1..target-1
      const b = target - a;
      if (a < 1 || a > 9 || b < 1 || b > 9) continue;

      const room = 10 - (a + b);
      if (room < 1) continue; // 余裕がないと c を置けない
      const c = Math.floor(Math.random() * room) + 1; // 1..room

      const key = `A:${a},${b},${c}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        a, b, c,
        answer: a + b + c,
        displayText: `<span>${a}</span>＋<span>${b}</span>＋<span>${c}</span>=`
      });
    }

    // --- 後半5問：最初の2つが必ず10（a+b=10）→ そこに3つ目を足す ---
    // 10を作るペアを5つランダム順で使用（重複なし）
    const tenPairs = [[1,9],[2,8],[3,7],[4,6],[5,5]];
    for (let i = tenPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tenPairs[i], tenPairs[j]] = [tenPairs[j], tenPairs[i]];
    }

    for (let k = 0; k < 5; k++) {
      const [a, b] = tenPairs[k];
      const c = Math.floor(Math.random() * 9) + 1; // 1..9（合計は10を超えてOK）

      const key = `B:${a},${b},${c}`;
      if (used.has(key)) { k--; continue; } // 念のため重複回避
      used.add(key);

      problems.push({
        a, b, c,
        answer: a + b + c, // = 10 + c
        displayText: `<span>${a}</span>＋<span>${b}</span>＋<span>${c}</span>=`
      });
    }

    return problems;
  },

  pointsPerQuestion: 10,       // 10問×10点 = 100点
  timeLimitPerQuestion: 7,     // 思考時間少し長め
  starThresholds: {
    star_circle: 100,
    star1: 108,
    star2: 116,
    star3: 124,
    star4: 132,
    star5: 140
  },
  themeColors: theme_lemon
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
