// ３つのかずのけいさん（a−b＋c）
// h1 は未設定 → common.js のデフォルト表示に任せる
const config = {
  appId: "57-7_3ttuno_kazuno_tasihiki",
  title: "３つのかずのけいさん",   // ← h2 & タブ

problemGenerator: () => {
  const problems = [];
  const used = new Set();

  // --- 前半3問：a ≤ 10 かつ (a−b＋c) ≤ 10 ---
  while (problems.length < 3) {
    const a = Math.floor(Math.random() * 6) + 5;   // 5..10
    const b = Math.floor(Math.random() * (a - 1)) + 1;
    const afterSub = a - b;                         // 1..9
    const maxC = 10 - afterSub;
    if (maxC < 1) continue;
    const c = Math.floor(Math.random() * maxC) + 1; // 1..maxC
    const ans = afterSub + c;                       // ≤10
    const key = `A:${a}-${b}+${c}`;
    if (used.has(key)) continue;
    used.add(key);
    problems.push({ a, b, c, answer: ans,
      displayText: `<span>${a}</span>−<span>${b}</span>＋<span>${c}</span>=` });
  }

  // --- 後半：a=10 を2問（c<b）, a>10 を5問（中間結果を10未満にしない） ---
  // (1) a=10, c<b を2問（結果 ≤10）
  let aEq10 = 0;
  while (aEq10 < 2) {
    const a = 10;
    const b = Math.floor(Math.random() * 8) + 2;       // 2..9
    const c = Math.floor(Math.random() * (b - 1)) + 1; // 1..b-1
    const ans = a - b + c;                              // 1..9
    const key = `B10:${a}-${b}+${c}`;
    if (used.has(key)) continue;
    used.add(key);
    problems.push({ a, b, c, answer: ans,
      displayText: `<span>${a}</span>−<span>${b}</span>＋<span>${c}</span>=` });
    aEq10++;
  }

  // (2) a>10 を5問：必ず a-b >= 10（10をまたがない）、答え > 10
  let gt10 = 0;
  let needStrictOver10First = 3; // a-b > 10 を最低3問確保
  while (gt10 < 5) {
    const a = Math.floor(Math.random() * 9) + 11;  // 11..19
    // b は a-b >= 10 になる範囲から選ぶ → b <= a-10
    const maxB = Math.min(9, a - 10);              // 1..(a-10)
    if (maxB < 1) continue;
    const b = Math.floor(Math.random() * maxB) + 1;
    const first = a - b;                           // >=10
    const mustBeStrict = needStrictOver10First > 0;

    // a-b > 10 を規定数確保
    if (mustBeStrict && first === 10) continue;

    const c = Math.floor(Math.random() * 9) + 1;   // 1..9
    const ans = first + c;                         // >10（first>=10 なので必ず >10）

    const key = `BGT:${a}-${b}+${c}`;
    if (used.has(key)) continue;
    used.add(key);

    problems.push({ a, b, c, answer: ans,
      displayText: `<span>${a}</span>−<span>${b}</span>＋<span>${c}</span>=` });
    gt10++;
    if (first > 10 && needStrictOver10First > 0) needStrictOver10First--;
  }

  // 出題順を軽くシャッフル
  for (let i = problems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [problems[i], problems[j]] = [problems[j], problems[i]];
  }

  return problems;
}
, // ←←← ココのカンマが必要！

  pointsPerQuestion: 10,
  timeLimitPerQuestion: 7, // 思考時間やや長め
  starThresholds: {
    star_circle: 100,
    star1: 108,
    star2: 116,
    star3: 124,
    star4: 132,
    star5: 140
  },

  // 直前と被らないようテーマを変更
  themeColors: theme_forest
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDrillApp(config);
});
