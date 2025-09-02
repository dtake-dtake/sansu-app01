/*
 * common_tanjun_hukusubrank.js
 * 汎用共通エンジン（単純計算＋複数ブランク対応）
 *
 * 目的:
 *  - １ファイルのドリルJS（meta + generateProblems）を template.html から読み込み、
 *    この共通エンジンで描画・採点・記録をまかなう。
 *  - ひっ算のような特殊UIは対象外（別エンジン）。
 *  - 単純計算（a op b = __INPUT__）と、文章題風／多段入力（__INPUT1__, __INPUT2__, ..., __INPUT__）に対応。
 *
 * 期待するドリル側の構造（例）:
 *   const quizConfig = {
 *     appId: 'grade3-example-v1',
 *     title: '○○のけいさん',        // 任意（HTML h1/h2があればそちら優先）
 *     themeColors: theme_sky,       // 任意（window.theme_* を期待／CSS変数に反映）
 *     pointsPerQuestion: 10,        // 任意（既定10）
 *     timeLimitSec: 60,             // 任意（既定60）
 *     starThresholds: {             // 任意（既定 circle:100, star1..5）
 *       circle: 100, star1:110, star2:120, star3:130, star4:140, star5:150
 *     },
 *     computeScore: (elapsedSec, base) => base + Math.max(0, 50 - Math.floor(elapsedSec))
 *       // 任意：未指定なら内蔵既定を使用
 *
 *     problemGenerator: () => [
 *       // 形式A: a, b, op, answer を持つ単純計算
 *       { a: 7, b: 8, op: '×', answer: 56 },
 *       // 形式B: displayText に HTML文字列。__INPUT1__ など補助欄、__INPUT__ が最終解答欄
 *       //        multiAnswers: [補助欄の想定解の配列] （順番対応）
 *       {
 *         displayText: 'りんご __INPUT1__ こ と みかん __INPUT2__ こ で 合計は = __INPUT__ こ',
 *         multiAnswers: [3, 4],
 *         answer: 7
 *       }
 *     ]
 *   };
 *
 *   document.addEventListener('DOMContentLoaded', () => initializeDrillApp(quizConfig));
 */
(function(){
  'use strict';

  // ==========================
  // ユーティリティ
  // ==========================
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const ls = window.localStorage;
  const nowDT = () => new Date().toLocaleString();

  // スクロール中央寄せ（フォーカス時）
  function scrollCenter(el){ if(!el) return; try { el.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){} }

  // CSS変数にテーマ反映
  function applyThemeColors(colors){
    if(!colors) return;
    const root = document.documentElement;
    for(const [k,v] of Object.entries(colors)) root.style.setProperty(k, v);
  }

  // ストレージキー作成
  function makeKeys(appId){
    return {
      HS: `${appId}:hs`,
      CLEAR: `${appId}:clearCount`,
      MONTHLY: (ym)=>`${appId}:monthlyClear-${ym}`,
      DAILY: (ymd)=>`${appId}:dailyClear-${ymd}`,
      HISTORY: `${appId}:history`,
      STATUS: `${appId}:status`
    };
  }

  // 既定の星しきい値
  const DEFAULT_THRESHOLDS = { circle:100, star1:110, star2:120, star3:130, star4:140, star5:150 };

  // 既定のスコア計算
  function defaultComputeScore(elapsedSec, baseScore){
    // 経過秒に応じて最大 +50 のボーナス（単純）
    // 例: 残り時間比例などに置き換え可能
    const bonus = Math.max(0, 50 - Math.floor(elapsedSec));
    return baseScore + bonus;
  }

  // 星HTML組み立て
  function buildStarsHtml(score, th){
    if(score >= th.star5) return ` ★★★★★ `;
    if(score >= th.star4) return ` ★★★★☆ `;
    if(score >= th.star3) return ` ★★★☆☆ `;
    if(score >= th.star2) return ` ★★☆☆☆ `;
    if(score >= th.star1) return ` ★☆☆☆☆ `;
    if(score >= th.circle) return ` ○ `;
    return '―';
  }

  // ==================================
  // メイン：initializeDrillApp
  // ==================================
  window.initializeDrillApp = function(userConfig){
    // ---- 設定 ----
    const cfg = Object.assign({
      appId: 'app-unknown',
      title: '',
      themeColors: null,
      pointsPerQuestion: 10,
      timeLimitSec: 60,
      starThresholds: DEFAULT_THRESHOLDS,
      computeScore: null,      // 任意フック
      showJudgeIcon: true      // ○×表示ON/OFF
    }, userConfig || {});

    // HTMLから上書き（あれば尊重）
    const mainTitle = $('#main-title');
    const subTitle  = $('#sub-title');
    if(document.title.trim() === '' && subTitle && subTitle.textContent.trim() !== ''){
      document.title = subTitle.textContent.trim();
    }
    if(mainTitle && mainTitle.textContent.trim() === '' && cfg.title){
      mainTitle.textContent = cfg.title;
    }

    // テーマ反映（<body data-theme="theme_sky"> もしくは cfg.themeColors）
    const themeName = document.body?.dataset?.theme || '';
    const themeObj = themeName && window[themeName] ? window[themeName] : cfg.themeColors;
    applyThemeColors(themeObj);

    // ---- 状態 ----
    let problems = [];
    let startTime = 0;
    let incorrectSelector = '#problems-wrapper input.needs-fix';

    // ストレージキー
    const K = makeKeys(cfg.appId);

    // ---- 表示更新 ----
    function updateDisplay(starsHtml){
      const total   = +(ls.getItem(K.CLEAR) || 0);
      const daily   = +(ls.getItem(K.DAILY(todayStr())) || 0);
      const monthly = +(ls.getItem(K.MONTHLY(monthStr())) || 0);
      const hs      = +(ls.getItem(K.HS) || 0);
      setText('highScoreValue', hs);
      setText('dailyCountValue', daily);
      setText('monthlyCountValue', monthly);
      setText('clearCountValue', total);
      setHTML('overallStars', starsHtml ?? (ls.getItem(K.STATUS) || '―'));
      const hist = JSON.parse(ls.getItem(K.HISTORY) || '[]');
      const list = $('#history-list');
      if(list) list.innerHTML = hist.map(h => ` ${h.datetime}：${h.score}てん `).join('');
    }

    function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = String(val); }
    function setHTML(id, val){ const el = document.getElementById(id); if(el) el.innerHTML = val; }
    function todayStr(){ return new Date().toISOString().slice(0,10); }
    function monthStr(){ return new Date().toISOString().slice(0,7); }

    // ---- 問題表示 ----
    function displayProblems(items){
      const wrap = $('#problems-wrapper');
      if(!wrap) return;
      wrap.innerHTML = '';

      items.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'problem';

        const content = document.createElement('div');
        content.className = 'problem-content';

        const num = document.createElement('div');
        num.className = 'problem-number';
        num.textContent = (i+1) + '.';

        const eq = document.createElement('div');
        eq.className = 'problem-equation';

        // 最終解答欄
        const mainInput = document.createElement('input');
        mainInput.type = 'number';
        mainInput.id = `ans-${i}`;

        let mainPlaced = false;

        if(p.displayText && typeof p.displayText === 'string'){
          // 補助欄 __INPUT1__ ... を実体化
          let html = p.displayText;
          html = html.replace(/__INPUT(\d+)__/g, (_m, d) => {
            const k = parseInt(d, 10);
            return ` <input type="number" id="ans-${i}-${k}" class="sub-blank" inputmode="numeric"> `;
          });

          // __INPUT__ があればその位置に mainInput を差し込む
          if(html.includes('__INPUT__')){
            html = html.replace('__INPUT__', ` ${mainInput.outerHTML} `);
            mainPlaced = true;
            eq.innerHTML = html;
          } else {
            eq.innerHTML = html;
          }
        } else {
          // a op b = [input]
          const a = (p.a != null) ? p.a : '';
          const b = (p.b != null) ? p.b : '';
          const op = p.op || '＋';
          eq.innerHTML = ` ${a} ${op} ${b} =`;
        }

        // main が未配置なら末尾に追加
        if(!mainPlaced) eq.appendChild(mainInput);

        // ○×アイコン
        if(cfg.showJudgeIcon){
          const icon = document.createElement('span');
          icon.id = `icon-${i}`; icon.className = 'result-icon';
          eq.appendChild(icon);
        }

        content.append(num, eq);
        const actions = document.createElement('div');
        actions.className = 'problem-actions';
        row.append(content, actions);
        wrap.appendChild(row);

        // イベント付与
        attachInputEvents(document.getElementById(`ans-${i}`));
        const subs = eq.querySelectorAll(`[id^="ans-${i}-"]`);
        subs.forEach(sub => attachInputEvents(sub));
      });
    }

    function attachInputEvents(el){
      if(!el) return;
      el.addEventListener('focus', () => scrollCenter(el));

      // needs-fix のとき最初の1キーで自動全消去
      el.addEventListener('keydown', (e) => {
        if(el.dataset.autoclear === '1'){
          const skip = ['Shift','Alt','Meta','Control','CapsLock','Tab','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
          if(!skip.includes(e.key)){
            el.value = ''; delete el.dataset.autoclear;
          }
        }
        if(e.key === 'Enter'){
          e.preventDefault();
          focusNextTarget();
        }
        if(e.key === 'Tab'){
          // 誤答が残っていれば誤答欄だけを巡回
          const list = $$(incorrectSelector);
          if(list.length > 0){
            e.preventDefault();
            const dir = e.shiftKey ? -1 : 1;
            cycleWithin(list, document.activeElement, dir);
          }
        }
      });
    }

    function cycleWithin(list, current, dir){
      if(list.length === 0) return;
      let idx = list.indexOf(current);
      if(idx === -1) idx = 0;
      else idx = (idx + dir + list.length) % list.length;
      const next = list[idx];
      if(next){ next.focus(); try{ next.select(); }catch{} scrollCenter(next); }
    }

    function focusNextTarget(){
      const list = $$(incorrectSelector);
      if(list.length > 0){
        // 未修正の次の欄へ
        const cur = document.activeElement;
        cycleWithin(list, cur, +1);
      }else{
        // 誤答がなければ まるつけ or もういちど をフォーカス
        const checkBtn = $('#check-answers');
        if(checkBtn) checkBtn.focus();
      }
    }

    // ---- 採点 ----
    function checkAnswers(){
      const checkBtn = $('#check-answers');
      if(checkBtn) checkBtn.disabled = true;

      // 表示色（CSS変数）
      const cs = getComputedStyle(document.documentElement);
      const wrongColor   = cs.getPropertyValue('--c-feedback-wrong').trim()   || '#d33';
      const defaultColor = cs.getPropertyValue('--c-primary-light').trim()    || '#08c';

      // 全入力欄を初期化
      $$('#problems-wrapper input[type="number"]').forEach(inp => {
        inp.style.borderColor = '';
        inp.classList.remove('needs-fix');
      });

      let correctCount = 0;

      problems.forEach((p,i) => {
        // 補助ブランクの採点（順番に対応）
        let multiOK = true;
        if(Array.isArray(p.multiAnswers) && p.multiAnswers.length > 0){
          for(let k=1; k<=p.multiAnswers.length; k++){
            const sub = document.getElementById(`ans-${i}-${k}`);
            const need = +p.multiAnswers[k-1];
            if(!sub || sub.value === '' || +sub.value !== need){
              multiOK = false;
              if(sub){ sub.style.borderColor = wrongColor; sub.classList.add('needs-fix'); sub.dataset.autoclear = '1'; }
            }else{
              sub.style.borderColor = defaultColor;
              sub.disabled = true;
            }
          }
        }

        // 最終解答
        const main = document.getElementById(`ans-${i}`);
        const needMain = (typeof p.answer !== 'undefined') ? +p.answer : NaN;
        const mainOK = (main && main.value !== '' && +main.value === needMain);

        // 判定
        const allOK = multiOK && mainOK;
        if(allOK){
          correctCount++;
          if(cfg.showJudgeIcon){ const ic = document.getElementById(`icon-${i}`); if(ic){ ic.textContent = '○'; ic.classList.add('correct'); ic.classList.remove('wrong'); } }
          if(main){ main.style.borderColor = defaultColor; main.disabled = true; }
        }else{
          if(cfg.showJudgeIcon){ const ic = document.getElementById(`icon-${i}`); if(ic){ ic.textContent = '×'; ic.classList.add('wrong'); ic.classList.remove('correct'); } }
          // 足りない欄に needs-fix
          if(Array.isArray(p.multiAnswers) && p.multiAnswers.length > 0){
            for(let k=1; k<=p.multiAnswers.length; k++){
              const sub = document.getElementById(`ans-${i}-${k}`);
              const need = +p.multiAnswers[k-1];
              if(!sub || sub.value === '' || +sub.value !== need){ if(sub){ sub.classList.add('needs-fix'); sub.dataset.autoclear = '1'; } }
            }
          }
          if(!mainOK && main){ main.style.borderColor = wrongColor; main.classList.add('needs-fix'); main.dataset.autoclear = '1'; }
        }
      });

      if(correctCount === problems.length){
        // スコア計算
        const elapsed = (Date.now() - startTime) / 1000;
        const base = (cfg.pointsPerQuestion || 10) * problems.length;
        const scorer = (typeof cfg.computeScore === 'function') ? cfg.computeScore : defaultComputeScore;
        const score = scorer(elapsed, base);

        // 星
        const th = Object.assign({}, DEFAULT_THRESHOLDS, normalizeThresholdKeys(cfg.starThresholds));
        const starsHtml = buildStarsHtml(score, th);

        // 保存
        const prevHS  = +(ls.getItem(K.HS) || 0);
        const isNewHS = score > prevHS;
        if(isNewHS) ls.setItem(K.HS, String(score));
        const total = +(ls.getItem(K.CLEAR) || 0) + 1; ls.setItem(K.CLEAR, String(total));
        const dKey = K.DAILY(todayStr());   ls.setItem(dKey, String((+(ls.getItem(dKey)||0))+1));
        const mKey = K.MONTHLY(monthStr()); ls.setItem(mKey, String((+(ls.getItem(mKey)||0))+1));
        ls.setItem(K.STATUS, starsHtml);

        // 履歴（最新10件）
        const hist = JSON.parse(ls.getItem(K.HISTORY) || '[]');
        hist.unshift({ datetime: nowDT(), score });
        if(hist.length > 10) hist.pop();
        ls.setItem(K.HISTORY, JSON.stringify(hist));

        // 表示
        const result = $('#result');
        if(result){
          const headline = isNewHS ? '🏆 ハイスコア達成！すごい！ 🏆' : '🎉 全問正解！おめでとう！ 🎉';
          result.style.color = '';
          result.innerHTML = `${headline} スコア: ${score}点 (タイム: ${elapsed.toFixed(1)} 秒)`;
        }
        updateDisplay(starsHtml);

        // confetti（存在すれば）
        if(isNewHS && typeof window.confetti === 'function') fireConfetti();

        const retryBtn = $('#retry'); if(retryBtn){ retryBtn.disabled = false; retryBtn.focus(); }
      }else{
        // 間違いあり
        const result = $('#result');
        if(result){ result.style.color = 'red'; result.textContent = '❌ まちがいがあります。赤いところを直そう！'; }
        const checkBtn = $('#check-answers'); if(checkBtn) checkBtn.disabled = false;
        // 最初の needs-fix へ
        const first = $(incorrectSelector); if(first){ first.focus(); try{ first.select(); }catch{} scrollCenter(first); }
      }
    }

    function resetResultArea(){
      const result = $('#result'); if(result){ result.style.color = ''; result.textContent=''; }
      const checkBtn = $('#check-answers'); if(checkBtn) checkBtn.disabled = false;
      const retryBtn = $('#retry'); if(retryBtn) retryBtn.disabled = true;
    }

    function fireConfetti(){
      const duration = 2000; const end = Date.now() + duration;
      (function frame(){
        try{
          window.confetti({ particleCount: 7, angle: 60, spread: 70, origin: { x: 0 } });
          window.confetti({ particleCount: 7, angle: 120, spread: 70, origin: { x: 1 } });
        }catch{}
        if(Date.now() < end) requestAnimationFrame(frame);
      })();
      try{ window.confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } }); }catch{}
    }

    function normalizeThresholdKeys(obj){
      // 旧キー名（star_circle等）→ 新キー（circle等）も受け入れる
      const o = Object.assign({}, obj||{});
      if(o.star_circle != null && o.circle == null) o.circle = o.star_circle;
      return o;
    }

    // ---- ボタン配線 ----
    const startBtn = $('#start');
    const checkBtn = $('#check-answers');
    const retryBtn = $('#retry');

    if(startBtn){
      startBtn.addEventListener('click', () => {
        resetResultArea();
        // 生成
        try{
          if(typeof cfg.problemGenerator === 'function') problems = cfg.problemGenerator();
          else if(typeof window.generateProblems === 'function') problems = window.generateProblems();
          else problems = [];
        }catch(e){ console.error(e); problems = []; }

        // 描画
        displayProblems(problems);
        // 計測開始
        startTime = Date.now();
        // ステータス描画
        updateDisplay();
        // 最初の入力にフォーカス
        const first = $('#problems-wrapper input[type="number"]');
        if(first){ first.focus(); try{ first.select(); }catch{} scrollCenter(first); }
      });
    }

    if(checkBtn){ checkBtn.addEventListener('click', checkAnswers); }
    if(retryBtn){ retryBtn.addEventListener('click', () => {
      // そのまま同じ problems を再挑戦（毎回再生成したい場合は start ボタンを押す運用）
      resetResultArea();
      // 入力欄を有効化して初期化
      $$('#problems-wrapper input[type="number"]').forEach(inp => { inp.disabled=false; inp.value=''; inp.style.borderColor=''; inp.classList.remove('needs-fix'); delete inp.dataset.autoclear; });
      const first = $('#problems-wrapper input[type="number"]'); if(first){ first.focus(); try{ first.select(); }catch{} scrollCenter(first); }
      const checkBtn2 = $('#check-answers'); if(checkBtn2) checkBtn2.disabled = false;
      const result = $('#result'); if(result){ result.style.color=''; result.textContent=''; }
      startTime = Date.now();
    }); }

    // 初期描画
    updateDisplay();
  };
})();
