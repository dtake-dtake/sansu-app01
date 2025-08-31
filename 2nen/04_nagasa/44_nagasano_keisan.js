// 2年 単元4：長さ「長さの計算」一けたcm/mm・0を問題文に出さない版
// □1 ア: 4問（足し算：繰り上がりなし → mm1+mm2 < 10、cm答え 1..9）
// □1 イ: 4問（引き算：繰り下がりなし → a_mm >= b_mm、cm答え 1..9 ＊cm答えが0ならcm欄非表示）
// △2(1): mmだけ足して cmだけの答え（mm繰り上がりで mm=0）…1問（cm答え 1..9）
// △2(2): mmだけ引いて cmだけの答え（mmをちょうど引いて mm=0）…1問（cm答え 1..9）
// ＝の前で改行し、答え欄は右寄せ表示。0の単位は入力欄を出さない。

(function () {
  // ランダムテーマ
  const themeNames = [
    "theme_sky","theme_forest","theme_sunset","theme_sakura","theme_grape",
    "theme_soda","theme_mint","theme_lemon","theme_lavender","theme_latte",
    "theme_indigo","theme_ruby","theme_peach","theme_matcha","theme_steel",
    "theme_marine","theme_lime","theme_rose","theme_chocolate","theme_ocean",
    "theme_honey","theme_cosmos","theme_earth","theme_melon","theme_coral",
    "theme_aqua","theme_wine","theme_sand","theme_sky_light","theme_mono"
  ];
  const themePool = themeNames.map(n => globalThis[n]).filter(Boolean);
  const randomTheme = themePool.length ? themePool[Math.floor(Math.random()*themePool.length)] : undefined;

  const config = {
    appId: "44_nagasano_keisan",
    mainTitle: "４　長さ",
    title: "長さの　計算",
    themeColors: randomTheme,
    showJudgeIcon: false,
    pointsPerQuestion: 10,
    timeLimitPerQuestion: 7,
    starThresholds: { star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150 },

    // ========= 表示テンプレ（＝ 前で改行、以降を右寄せ） =========
    _wrap(lhsHtml, rhsHtml){
      return `<div class="len-eq"><div class="lhs">${lhsHtml}</div><div class="rhs">${rhsHtml}</div></div>`;
    },
    _addLHS(a_cm, a_mm, b_cm, b_mm){
      return `<span>${a_cm}</span><span>cm</span> <span>${a_mm}</span><span>mm</span>
              <span>＋</span>
              <span>${b_cm}</span><span>cm</span> <span>${b_mm}</span><span>mm</span>`;
    },
    _subLHS(a_cm, a_mm, b_cm, b_mm){
      return `<span>${a_cm}</span><span>cm</span> <span>${a_mm}</span><span>mm</span>
              <span>−</span>
              <span>${b_cm}</span><span>cm</span> <span>${b_mm}</span><span>mm</span>`;
    },
    _addMmOnlyLHS(a_cm,a_mm, add_mm){
      return `<span>${a_cm}</span><span>cm</span> <span>${a_mm}</span><span>mm</span>
              <span>＋</span>
              <span>${add_mm}</span><span>mm</span>`;
    },
    _subMmOnlyLHS(a_cm,a_mm, sub_mm){
      return `<span>${a_cm}</span><span>cm</span> <span>${a_mm}</span><span>mm</span>
              <span>−</span>
              <span>${sub_mm}</span><span>mm</span>`;
    },

    // 答え欄バリエーション
    _rhsCmMm(){   return `＝ __INPUT1__ <span>cm</span> __INPUT2__ <span>mm</span>`; },
    _rhsCmOnly(){ return `＝ __INPUT1__ <span>cm</span>`; },
    _rhsMmOnly(){ return `＝ __INPUT1__ <span>mm</span>`; },

    // ユーティリティ
    _shuf(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; },

    // 0の単位欄は出さず、cm答えは必ず1..9に収める
    _pushWithAutoLayout(list, usedKey, lhs, ans_cm, ans_mm){
      // 布置：cm答えが 1..9、mm答えが 0、cm=0 などで分岐
      if (ans_mm === 0 && ans_cm >= 1 && ans_cm <= 9){
        list.push({ displayText: this._wrap(lhs, this._rhsCmOnly()), multiAnswers: [ans_cm] });
        return true;
      }
      if (ans_cm === 0 && ans_mm > 0){
        list.push({ displayText: this._wrap(lhs, this._rhsMmOnly()), multiAnswers: [ans_mm] });
        return true;
      }
      if (ans_cm >= 1 && ans_cm <= 9 && ans_mm > 0){
        list.push({ displayText: this._wrap(lhs, this._rhsCmMm()), multiAnswers: [ans_cm, ans_mm] });
        return true;
      }
      // それ以外（cmが10以上/負など）は採用しない
      usedKey && usedKey.delete && usedKey.delete(); // 呼び出し側で不要なら ignore
      return false;
    },

    problemGenerator() {
      const probs = [];
      const used = new Set();

      // ===== □1 ア：4問（足し算：繰り上がりなし & cm答え1..9） =====
      let cntA = 0;
      while (cntA < 4) {
        // 表示するcm,mmは 1..9
        const a_cm = Math.floor(Math.random()*9) + 1;
        const a_mm = Math.floor(Math.random()*9) + 1;
        // mm繰上がり禁止 → b_mm ≤ 9 - a_mm、かつ b_mm ≥1
        const maxBmm = 9 - a_mm;
        if (maxBmm < 1) continue;
        // cm答え 1..9 を保証 → b_cm ≤ 9 - a_cm
        const maxBcm = 9 - a_cm;
        if (maxBcm < 1) continue;

        const b_cm = Math.floor(Math.random()*maxBcm) + 1;      // 1..maxBcm
        const b_mm = Math.floor(Math.random()*maxBmm) + 1;      // 1..maxBmm

        const ans_cm = a_cm + b_cm;                // 1..9
        const ans_mm = a_mm + b_mm;                // < 10
        const key = `A:${a_cm},${a_mm}+${b_cm},${b_mm}`;
        if (used.has(key)) continue;
        used.add(key);

        const lhs = this._addLHS(a_cm,a_mm,b_cm,b_mm);
        if (this._pushWithAutoLayout(probs, null, lhs, ans_cm, ans_mm)) cntA++;
      }

      // ===== □1 イ：4問（引き算：繰り下がりなし & cm答え1..9（or 0ならcm欄非表示）） =====
      let cntB = 0;
      while (cntB < 4) {
        const a_cm = Math.floor(Math.random()*9) + 1;
        const a_mm = Math.floor(Math.random()*9) + 1;
        // 借りない → b_mm ≤ a_mm（1..a_mm）
        const b_mm = Math.floor(Math.random()*a_mm) + 1;
        // cm答え 1..9 に寄せたい → b_cm を 0..a_cm に調整。ただし表示0cmはNGなので 1..a_cm とし、
        // cm答えが0になる場合は mm-only 表示に切替（OK）。
        const b_cm = Math.floor(Math.random()*a_cm) + 1; // 1..a_cm

        const a_total = a_cm*10 + a_mm;
        const b_total = b_cm*10 + b_mm;
        if (a_total < b_total) continue;

        const diff_total = a_total - b_total;      // >=0
        const ans_cm = Math.floor(diff_total/10);  // 0..9
        const ans_mm = diff_total%10;

        // cm=0 のときは mm-only 表示、cm>0 は 1..9（要件満たす）
        const key = `B:${a_cm},${a_mm}-${b_cm},${b_mm}`;
        if (used.has(key)) continue;
        used.add(key);

        const lhs = this._subLHS(a_cm,a_mm,b_cm,b_mm);
        if (this._pushWithAutoLayout(probs, null, lhs, ans_cm, ans_mm)) cntB++;
      }

      // ===== △2(1)：mmだけ足して cmだけの答え（繰り上がりで0mm） =====
      (()=>{
        // cm答え 1..9 → a_cm ≤ 8
        const a_cm = Math.floor(Math.random()*8) + 1;  // 1..8
        const a_mm = Math.floor(Math.random()*9) + 1;  // 1..9
        const add_mm = 10 - a_mm;                      // 1..9
        const ans_cm = a_cm + 1;                       // 2..9
        const ans_mm = 0;
        const lhs = this._addMmOnlyLHS(a_cm,a_mm, add_mm);
        probs.push({ displayText: this._wrap(lhs, this._rhsCmOnly()), multiAnswers: [ans_cm] });
      })();

      // ===== △2(2)：mmだけ引いて cmだけの答え（mmをちょうど引いて0mm） =====
      (()=>{
        // cm答え 1..9 → 任意 1..9、mmは 1..9、引くmm=sub_mm= a_mm
        const a_cm = Math.floor(Math.random()*9) + 1;  // 1..9
        const a_mm = Math.floor(Math.random()*9) + 1;  // 1..9
        const sub_mm = a_mm;                            // mmだけ引く
        const ans_cm = a_cm;                            // 1..9
        const ans_mm = 0;
        const lhs = this._subMmOnlyLHS(a_cm,a_mm, sub_mm);
        probs.push({ displayText: this._wrap(lhs, this._rhsCmOnly()), multiAnswers: [ans_cm] });
      })();

      // 4 + 4 + 2 = 10問
      return this._shuf(probs);
    }
  };

  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();
