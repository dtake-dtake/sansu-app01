// ２けた＋２けた、答えが100をこえない（<=100）問題を作る
// 入力は各式1つだけ（合計）にして、採点は data-correct で共通側が実施。

export function buildProblemSet() {
  // 10問つくる（重複は可にしてもOKだが、なるべくバラける）
  const N = 10;
  const probs = [];
  const seen = new Set();

  while (probs.length < N) {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    const s = a + b;

    if (s <= 100) {
      const key = `${a}+${b}`;
      if (!seen.has(key)) {
        seen.add(key);
        probs.push({ a, b, s });
      }
    }
  }
  return probs;

  function randInt(min, max) { // inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export function renderProblems(container, problems) {
  container.innerHTML = '';
  problems.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'problem';
    row.innerHTML = `
      <div class="problem-number">${i + 1}.</div>
      <div class="problem-equation">
        <span>${p.a}</span><span>＋</span><span>${p.b}</span><span>=</span>
        <input type="number"
               class="needs-answer"
               data-correct="${p.s}"
               aria-label="${p.a}+${p.b} の答え">
      </div>
    `;
    container.appendChild(row);
  });
}
