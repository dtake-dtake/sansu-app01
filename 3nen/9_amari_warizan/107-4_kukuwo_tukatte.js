// name: 107-4_kukuwo_tukatte
// h1: ９　あまりのあるわり算 / h2: 九九を使って
(() => {
  const APP_ID = '107-4_kukuwo_tukatte';

  // 乱数
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // 1桁 ÷ 1桁（必ず あまりあり）
  function genOneDigitDiv() {
    while (true) {
      const b = rnd(2, 9);      // 割る数
      const a = rnd(2, 9);      // 割られる数
      if (a > b && a % b !== 0) {
        const q = Math.floor(a / b);
        const r = a % b;
        return {
          displayText: `<span>${a}</span><span>÷</span><span>${b}</span><span>=</span> __INPUT__ <span>あまり</span> __INPUT1__`,
          answer: q,              // 商（主解答）
          multiAnswers: [r],      // あまり（補助1）
        };
      }
    }
  }

  // 2桁 ÷ 1桁（商 < 10、必ず あまりあり）
  function genTwoDigitDiv_QuotUnder10() {
    while (true) {
      const b = rnd(2, 9);
      const q = rnd(1, 9);          // 商は 1..9（<10）
      const r = rnd(1, b - 1);      // あまり 1..(b-1)
      const a = b * q + r;          // 被除数
      if (a >= 10 && a <= 99) {
        return {
          displayText: `<span>${a}</span><span>÷</span><span>${b}</span><span>=</span> __INPUT__ <span>あまり</span> __INPUT1__`,
          answer: q,
          multiAnswers: [r],
        };
      }
    }
  }

  // 10問：先頭3問=1桁/1桁、残り7問=2桁/1桁(商<10)
  function problemGenerator() {
    const arr = [];
    for (let i = 0; i < 3; i++) arr.push(genOneDigitDiv());
    for (let i = 0; i < 7; i++) arr.push(genTwoDigitDiv_QuotUnder10());
    return arr;
  }

  // アプリ起動（テーマは No.10：theme_latte）
  initializeDrillApp({
    appId: APP_ID,
    mainTitle: '９　あまりのあるわり算',
    title: '九九を使って',
    themeColors: theme_latte,       // ← テーマ10
    problemGenerator,
    // 任意のスコア設定
    timeLimitPerQuestion: 6,
    pointsPerQuestion: 10,
    starThresholds: { star_circle: 0, star1: 60, star2: 80, star3: 100, star4: 120, star5: 140 },
  });

  // ===== フォーカス制御：商 → あまり → 次の商 =====
  // common.js の Enter 挙動より先に拾うため capture: true
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    const id = t.id || '';
    if (!/^ans-\d+(-\d+)?$/.test(id)) return;

    const mMain = id.match(/^ans-(\d+)$/);      // 主解答（商）
    const mSub  = id.match(/^ans-(\d+)-(\d+)$/);// 補助（あまりなど）

    // 次にフォーカスする helper
    const moveTo = sel => {
      const el = document.querySelector(sel);
      if (el && !el.disabled) el.focus();
    };

    if (mMain) {
      e.preventDefault(); e.stopPropagation();   // ← ここが重要
      const i = Number(mMain[1]);
      // 商 → 先頭サブ（あまり）
      if (document.querySelector(`#ans-${i}-1`)) {
        moveTo(`#ans-${i}-1`);
      } else {
        moveTo(`#ans-${i + 1}`); // サブが無ければ次の問題へ
      }
      return;
    }

    if (mSub) {
      e.preventDefault(); e.stopPropagation();
      const i = Number(mSub[1]);
      const k = Number(mSub[2]);
      // 次のサブがあれば → そちら、無ければ次の問題の商
      if (document.querySelector(`#ans-${i}-${k + 1}`)) {
        moveTo(`#ans-${i}-${k + 1}`);
      } else {
        moveTo(`#ans-${i + 1}`);
      }
    }
  }, true);
})();
