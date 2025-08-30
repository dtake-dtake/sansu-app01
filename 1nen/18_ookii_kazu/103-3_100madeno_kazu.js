// １００までのかず（各意図1問ずつ＝全5問）
// ① (10a+9) より 1 大きいかずは □
// ② 10b より 1 小さいかずは □
// ③ 100 より 1 小さいかずは □
// ④ c(2けた) より d(1けた) 大きいかずは □（100をこえない）
// ⑤ e(2けた) より f(1けた) 小さいかずは □
// すべて 1ブランク（answer＋__INPUT__）。○×は非表示で色判定のみ。

const config = {
  appId: "103-3_100madeno_kazu",
  title: "１００までのかず",
  themeColors: theme_ocean,
  showJudgeIcon: false,

  _n(v){ return `<span class="place-num">${v}</span>`; },
  _t(s){ return `<span>${s}</span>`; },

  problemGenerator(){
    const probs = [];

    // ① (10a+9) より 1 大きい（9,19,...,99 → +1）
    {
      const a = Math.floor(Math.random()*10); // 0..9
      const x = 10 * a + 9;                   // 9,19,...,99
      const ans = x + 1;                      // 10..100
      probs.push({
        displayText: `${this._n(x)} ${this._t('より')} ${this._n(1)} ${this._t('大きい かずは')} __INPUT__`,
        answer: ans
      });
    }

    // ② 10b より 1 小さい（10..100 → -1）
    {
      const b = Math.floor(Math.random()*10) + 1; // 1..10
      const y = 10 * b;                           // 10..100
      const ans = y - 1;                          // 9..99
      probs.push({
        displayText: `${this._n(y)} ${this._t('より')} ${this._n(1)} ${this._t('小さい かずは')} __INPUT__`,
        answer: ans
      });
    }

    // ③ 100 より 1 小さい（=99）
    probs.push({
      displayText: `${this._n(100)} ${this._t('より')} ${this._n(1)} ${this._t('小さい かずは')} __INPUT__`,
      answer: 99
    });

    // ④ c(2けた) より d(1けた) 大きい（c+d ≤ 100）
    {
      let c, d, ans;
      do {
        c = Math.floor(Math.random()*90) + 10; // 10..99
        d = Math.floor(Math.random()*9)  + 1;  // 1..9
        ans = c + d;
      } while (ans > 100);
      probs.push({
        displayText: `${this._n(c)} ${this._t('より')} ${this._n(d)} ${this._t('大きい かずは')} __INPUT__`,
        answer: ans
      });
    }

    // ⑤ e(2けた) より f(1けた) 小さい（e-f ≥ 1）
    {
      let e, f, ans;
      do {
        e = Math.floor(Math.random()*90) + 10; // 10..99
        f = Math.floor(Math.random()*9)  + 1;  // 1..9
        ans = e - f;
      } while (ans < 1);
      probs.push({
        displayText: `${this._n(e)} ${this._t('より')} ${this._n(f)} ${this._t('小さい かずは')} __INPUT__`,
        answer: ans
      });
    }

    // 合計 5問
    return probs;
  },

  // 各問20点（5問×20=100）。時間ボーナスは共通ロジックのまま。
  pointsPerQuestion: 20,
  timeLimitPerQuestion: 7,
  starThresholds: {
    // 基本満点100点を基準。ボーナス加点も見込みつつ少し高めの段階を設定
    star_circle: 100,
    star1: 110,
    star2: 120,
    star3: 130,
    star4: 140,
    star5: 150
  }
};

document.addEventListener('DOMContentLoaded', () => initializeDrillApp(config));
