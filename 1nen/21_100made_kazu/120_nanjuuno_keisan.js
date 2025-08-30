// 単元21：１００までのかずの けいさん（前半：何十＋何十 ≤100 / 後半：（何十or百）−何十 ≥0）
// name = appId: 120_nanjuuno_keisan
// h1=mainTitle, h2=title は common.js で表示されます

const config = {
  appId: "120_nanjuuno_keisan",
  mainTitle: "１００までのかずの　けいさん",
  title: "なんじゅうの　たしざん・ひきざん",
  themeColors: theme_matcha,  // お好みで変更可（themes.js 参照）
  showJudgeIcon: false,       // ○×は出さず、色だけでフィードバック

  // 1問を <span> で組んで __INPUT__ を置く（共通エンジンが採点）
  _addDisp(a, op, b){
    return `<span>${a}</span><span>${op}</span><span>${b}</span>=__INPUT__`;
  },

  problemGenerator(){
    const probs = [];
    const used = new Set();

    // --- 前半5問：何十＋何十（解 ≤ 100） ---
    while (probs.length < 5) {
      const a = (Math.floor(Math.random()*9)+1) * 10;  // 10..90
      const b = (Math.floor(Math.random()*9)+1) * 10;  // 10..90
      const s = a + b;
      if (s > 100) continue;
      const key = `A:${a}+${b}`;
      if (used.has(key)) continue;
      used.add(key);
      probs.push({
        displayText: config._addDisp(a, '＋', b),
        answer: s
      });
    }

    // --- 後半5問：（何十 or 100）− 何十（解 ≥ 0） ---
    let hundredUsed = false;
    while (probs.length < 10) {
      // 100 を1問は必ず混ぜたい（最後の1枠まで来て未使用なら強制）
      const mustUse100 = (!hundredUsed && (10 - probs.length === 1));
      const use100 = mustUse100 || (!hundredUsed && Math.random() < 0.4);
      const minuend = use100 ? 100 : (Math.floor(Math.random()*10)+1) * 10; // 10..110 だが 100maxに補正
      const A = Math.min(minuend, 100);  // 念のため 100 に抑える

      // 減数は 10..A（10きざみ）
      if (A < 10) continue;
      const steps = A/10;
      const B = (Math.floor(Math.random()*steps)+1) * 10; // 10..A
      const d = A - B;                                    // ≥0

      const key = `B:${A}-${B}`;
      if (used.has(key)) continue;
      used.add(key);
      probs.push({
        displayText: config._addDisp(A, '−', B),
        answer: d
      });
      if (A === 100) hundredUsed = true;
    }

    return probs;
  },

  // 10問×10点=100点（共通の時間ボーナスそのまま）
  pointsPerQuestion: 10,
  timeLimitPerQuestion: 6,
  starThresholds: {
    star_circle: 100,
    star1: 110,
    star2: 120,
    star3: 130,
    star4: 140,
    star5: 150
  }
};

document.addEventListener('DOMContentLoaded', () => initializeDrillApp(config));
