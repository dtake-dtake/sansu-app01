// 2年 単元4：長さ「ミリメートル」／△6の意図で10問（重複なし）
// ① 5問：X cm は 何 mm ですか？ → __INPUT__（単一ブランク）
// ② 5問：Y mm は 何 cm 何 mm ですか？ → __INPUT1__（cm）, __INPUT2__（mm）の2ブランク
// name(appId) = 40-6_mirime-toru

(function () {
  // テーマは毎回ランダム（themes.js から存在するものだけ拾う）
  const themeNames = [
    "theme_sky","theme_forest","theme_sunset","theme_sakura","theme_grape","theme_soda","theme_mint",
    "theme_lemon","theme_lavender","theme_latte","theme_indigo","theme_ruby","theme_peach","theme_matcha",
    "theme_steel","theme_marine","theme_lime","theme_rose","theme_chocolate","theme_ocean","theme_honey",
    "theme_cosmos","theme_earth","theme_melon","theme_coral","theme_aqua","theme_wine","theme_sand",
    "theme_sky_light","theme_mono"
  ];
  const themePool = themeNames.map(n => globalThis[n]).filter(Boolean);
  const randomTheme = themePool.length ? themePool[Math.floor(Math.random()*themePool.length)] : undefined;

  const config = {
    appId: "40-6_mirime-toru",
    mainTitle: "４　長さ",
    title: "ミリメートル",
    themeColors: randomTheme,
    showJudgeIcon: false,    // ○×は非表示、色だけでフィードバック
    pointsPerQuestion: 10,   // 10問×10点=100点
    timeLimitPerQuestion: 6,
    starThresholds: {
      star_circle: 100, star1: 110, star2: 120, star3: 130, star4: 140, star5: 150
    },

    // 表示テンプレ
    _cmToMmDisp(cm){
      return `<span>${cm}</span><span>cm は</span> __INPUT__ <span>mm</span>`;
    },
    _mmToCmMmDisp(mm){
      return `<span>${mm}</span><span>mm は</span> __INPUT1__ <span>cm</span> __INPUT2__ <span>mm</span>`;
    },

    // フィッシャー–イェーツ
    _shuffle(arr){
      for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
      }
      return arr;
    },

    problemGenerator() {
      const probs = [];
      const used = new Set();

      // ① 5問：cm → mm（1cm=10mm）
      //   cm は 1..9 から重複なしで選ぶ（大きすぎない範囲）
      const cmPool = Array.from({length:9},(_,i)=>i+1); // 1..9
      this._shuffle(cmPool);
      let i = 0;
      while (probs.length < 5 && i < cmPool.length) {
        const cm = cmPool[i++];
        const mm = cm * 10;
        const key = `A:${cm}`;
        if (used.has(key)) continue;
        used.add(key);
        probs.push({
          displayText: this._cmToMmDisp(cm),
          answer: mm
        });
      }

      // ② 5問：mm → cm,mm（1cm=10mm）
      //   mm は 11..99 から重複なし（0や1桁は避ける／10の倍数も可）
      const mmPool = Array.from({length:89},(_,k)=>k+11); // 11..99
      this._shuffle(mmPool);
      let j = 0;
      while (probs.length < 10 && j < mmPool.length) {
        const mm = mmPool[j++];
        const cm = Math.floor(mm / 10);
        const r  = mm % 10;
        const key = `B:${mm}`;
        if (used.has(key)) continue;
        used.add(key);
        probs.push({
          displayText: this._mmToCmMmDisp(mm),
          multiAnswers: [cm, r]   // __INPUT1__=cm, __INPUT2__=mm
        });
      }

      // 最後にランダム順（①②が混ざる）
      return this._shuffle(probs);
    }
  };

  document.addEventListener("DOMContentLoaded", () => initializeDrillApp(config));
})();
