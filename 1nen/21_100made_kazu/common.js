// ============================================================
//  共通エンジン  common.js（完全版）
//  - initializeDrillApp(config) を呼ぶだけで起動
//  - 複数ブランク: __INPUT1__, __INPUT2__, ... を補助ブランクに置換
//  - 最終解答   : __INPUT__（無ければ末尾に自動追加）
//  - 採点表示   : 正解=緑 / 不正解=赤（.correct-field / .incorrect-field）
//  - 採点後     : 最初の未正解欄へ自動フォーカス＆全選択＆1キーで自動消去
//  - キー操作   : Enter/Tab で「未正解欄のみ」巡回（Shift+Tabで逆順）
//  - レイアウト : 狭幅でも折り返し（flex-wrap + min-width:0）
//  - ○×非表示  : config.showJudgeIcon === false で○×を出さない
//  - 進捗保存   : ハイスコア／今日・今月・合計クリア数／履歴（各10件）
// ============================================================

function initializeDrillApp(config) {
  // ========= State =========
  let problems = [];
  let startTime = 0;
  let highScore = 0;
  let totalClearCount = 0, monthlyCount = 0, dailyCount = 0;
  let overallStatusStars = '―';
  let incorrectIndices = []; // 互換用に残す
  let confettiIntervalId = null;

  // ========= Utils =========
  const ls = localStorage;
  const nowDT = () => new Date().toLocaleString();
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const scrollCenter = el => el && el.scrollIntoView({ behavior: "smooth", block: "center" });

  // ○×表示フラグ（既定 true）
  const SHOW_ICON = (config.showJudgeIcon !== false);

  // --- 未正解欄ナビ用ヘルパー ---
  const NEEDS_FIX_SELECTOR = '#problems-wrapper input.needs-fix';
  function clearNeedsFix() {
    $$(NEEDS_FIX_SELECTOR).forEach(el => el.classList.remove('needs-fix'));
  }
  function firstNeedsFix() {
    return $(NEEDS_FIX_SELECTOR);
  }
  function needsFixList() {
    return $$(NEEDS_FIX_SELECTOR);
  }
  function focusSelect(el) {
    if (!el) return;
    el.focus();
    // number型でselectが効かない環境対策として二度試行
    try { el.select(); } catch(e) {}
    setTimeout(() => { try { el.select(); } catch(e) {} }, 0);
    scrollCenter(el);
  }
  function focusFirstNeedsFix() {
    focusSelect(firstNeedsFix());
  }
  function nextNeedsFixFrom(el) {
    const list = needsFixList();
    if (list.length === 0) return null;
    const i = list.indexOf(el);
    if (i === -1) return list[0];
    return list[(i + 1) % list.length];
  }
  function prevNeedsFixFrom(el) {
    const list = needsFixList();
    if (list.length === 0) return null;
    const i = list.indexOf(el);
    if (i === -1) return list[list.length - 1];
    return list[(i - 1 + list.length) % list.length];
  }

  // ========= LocalStorage Keys =========
  const KEY_HS             = `${config.appId}:hs`;
  const KEY_HISTORY        = `${config.appId}:history`;
  const KEY_CLEAR          = `${config.appId}:clearCount`;
  const KEY_MONTHLY_PREFIX = `${config.appId}:monthlyClear-`;
  const KEY_DAILY_PREFIX   = `${config.appId}:dailyClear-`;
  const KEY_OVERALL_STATUS = `${config.appId}:status`;

  // ========= Load/Save =========
  function loadData() {
    highScore = +ls.getItem(KEY_HS) || 0;
    const todayKey = KEY_DAILY_PREFIX + new Date().toISOString().slice(0, 10);
    const monthKey = KEY_MONTHLY_PREFIX + new Date().toISOString().slice(0, 7);
    totalClearCount = +ls.getItem(KEY_CLEAR) || 0;
    monthlyCount = +ls.getItem(monthKey) || 0;
    dailyCount = +ls.getItem(todayKey) || 0;
    overallStatusStars = ls.getItem(KEY_OVERALL_STATUS) || '―';
  }
  function saveData() {
    ls.setItem(KEY_HS, String(highScore));
    const todayKey = KEY_DAILY_PREFIX + new Date().toISOString().slice(0, 10);
    const monthKey = KEY_MONTHLY_PREFIX + new Date().toISOString().slice(0, 7);
    ls.setItem(KEY_CLEAR, String(totalClearCount));
    ls.setItem(monthKey, String(monthlyCount));
    ls.setItem(todayKey, String(dailyCount));
    ls.setItem(KEY_OVERALL_STATUS, overallStatusStars);
  }
  function saveHistoryEntry(score) {
    const history = JSON.parse(ls.getItem(KEY_HISTORY) || '[]');
    history.unshift({ datetime: nowDT(), score });
    if (history.length > 10) history.pop();
    ls.setItem(KEY_HISTORY, JSON.stringify(history));
  }

  // ========= View =========
  function updateDisplay() {
    $('#highScoreValue')    && ($('#highScoreValue').textContent    = highScore);
    $('#clearCountValue')   && ($('#clearCountValue').textContent   = totalClearCount);
    $('#monthlyCountValue') && ($('#monthlyCountValue').textContent = monthlyCount);
    $('#dailyCountValue')   && ($('#dailyCountValue').textContent   = dailyCount);
    $('#overallStars')      && ($('#overallStars').innerHTML        = overallStatusStars);
    const history = JSON.parse(ls.getItem(KEY_HISTORY) || '[]');
    const histUL = $('#history-list');
    if (histUL) histUL.innerHTML = history.map(h => `<li>${h.datetime}：${h.score}てん</li>`).join('');
  }

function focusSelect(el) {
  if (!el) return;
  el.focus();
  try { el.select(); } catch(e) {}
  setTimeout(() => { try { el.select(); } catch(e) {} }, 0);
}

function allFocusableInputs() {
  return Array.from(document.querySelectorAll(
    '#problems-wrapper input[type="number"]:not(:disabled)'
  ));
}



// 置き換え用：common.js の function attachInputEvents(el)
// 変更点：誤答を正しく打ち直して Enter →
//          まだ誤答が残っていれば次の誤答へ / すべて直っていれば「まるつけ」へ
function attachInputEvents(el) {
  if (!el) return;

  // ── ユーティリティ ─────────────────────────────────────
  const needsFixSelector = '#problems-wrapper input.needs-fix';
  const getNeedsFixList = () =>
    Array.from(document.querySelectorAll(needsFixSelector));
  const getAllFocusable = () =>
    Array.from(document.querySelectorAll('#problems-wrapper input[type="number"]:not(:disabled)'));
  const focusAndSelect = (target) => {
    if (!target) return;
    target.focus();
    try { target.select(); } catch(e) {}
    setTimeout(() => { try { target.select(); } catch(e) {} }, 0);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  // この入力の“想定解”を id から求める（initializeDrillApp のスコープにある problems を参照）
  const getExpectedFor = () => {
    const m = /^ans-(\d+)(?:-(\d+))?$/.exec(el.id);
    if (!m) return null;
    const idx = +m[1];
    const sub = m[2] ? +m[2] : null;
    const p = problems && problems[idx];
    if (!p) return null;
    if (sub) {
      if (!Array.isArray(p.multiAnswers) || sub < 1 || sub > p.multiAnswers.length) return null;
      return +p.multiAnswers[sub - 1];
    }
    if (typeof p.answer === 'undefined') return null;
    return +p.answer;
  };

  // ── フォーカス/クリック：誤答欄は全選択で打ち直しやすく ───────────────
  const trySelectIfNeedsFix = () => {
    if (el.classList.contains('needs-fix')) focusAndSelect(el);
  };
  el.addEventListener('focus', trySelectIfNeedsFix);
  el.addEventListener('click', trySelectIfNeedsFix);

  // ── キーハンドラ ──────────────────────────────────────
  el.addEventListener('keydown', (e) => {
    // 1キー目で自動消去（needs-fix で autoclear 指定のとき）
    if (el.dataset.autoclear === '1') {
      const skip = ['Shift','Alt','Meta','Control','CapsLock','Tab','Escape',
                    'ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      if (!skip.includes(e.key)) {
        el.value = '';
        delete el.dataset.autoclear;
      }
    }

    // Tab：誤答があるときは「間違いだけ」巡回（Shift+Tabで逆順）
    if (e.key === 'Tab') {
      const list = getNeedsFixList();
      if (list.length > 0) {
        e.preventDefault();
        const i = list.indexOf(el);
        const next = (i === -1)
          ? (e.shiftKey ? list[list.length - 1] : list[0])
          : (e.shiftKey ? list[(i - 1 + list.length) % list.length] : list[(i + 1) % list.length]);
        focusAndSelect(next);
      }
      return; // 誤答がないときは既定の Tab でOK
    }

    // Enter：誤答修正 → 連続で直す／全部直ったら「まるつけ」へ
    //         誤答あり → 間違いだけ巡回
    //         誤答なし → 次の欄（通常解答モード）
    if (e.key === 'Enter') {
      e.preventDefault();

      const needs = getNeedsFixList();

      // この欄が誤答リストにいて、正しい値に打ち直したか？
      if (el.classList.contains('needs-fix')) {
        const exp = getExpectedFor();
        if (exp !== null && el.value !== '' && +el.value === exp) {
          // この欄は“直った”とみなして誤答リストから除外
          el.classList.remove('needs-fix','incorrect-field');
          el.classList.add('correct-field');
          // 1キー目での自動消去も解除（もう正しいので）
          delete el.dataset.autoclear;

          const rest = getNeedsFixList(); // 残っている誤答欄を再取得
          if (rest.length > 0) {
            // まだ誤答がある → 次の誤答へ
            // 直前のリスト順を維持したい場合は、元の needs を使って次要素を決めてもOK
            focusAndSelect(rest[0]);
          } else {
            // すべて直った → まるつけへ
            const ck = document.querySelector('#check-answers');
            if (ck) ck.focus();
          }
          return;
        }
      }

      // ここまでで確定しなければ、まだ誤答が残っている → 誤答欄だけ巡回
      if (needs.length > 0) {
        const i = needs.indexOf(el);
        const next = (i >= 0 && i < needs.length - 1) ? needs[i + 1] : needs[0];
        focusAndSelect(next);
        return;
      }

      // 通常解答中：DOM順で次の未入力欄へ。最後なら「まるつけ」
      const all = getAllFocusable();
      const idx = all.indexOf(el);
      if (idx > -1 && idx < all.length - 1) {
        focusAndSelect(all[idx + 1]);
      } else {
        const ck = document.querySelector('#check-answers');
        if (ck) ck.focus();
      }
    }
  });
}




  function displayProblems(generatedProblems) {
    const wrap = $('#problems-wrapper');
    if (!wrap) return;
    wrap.innerHTML = '';

    generatedProblems.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'problem';

      const content = document.createElement('div');
      content.className = 'problem-content';

      const num = document.createElement('div');
      num.className = 'problem-number';
      num.textContent = (i + 1) + '.';

      const eq = document.createElement('div');
      eq.className = 'problem-equation';
      // 折返し可にするキモ（Flex 子の最小幅を 0 に）
      eq.style.flex = '1 1 auto';
      eq.style.minWidth = '0';
      eq.style.display = 'flex';
      eq.style.flexWrap = 'wrap';
      eq.style.alignItems = 'center';

      const mainInput = document.createElement('input');
      mainInput.type = 'number';
      mainInput.id = `ans-${i}`;

      // ★★★ 複数ブランク対応 ★★★
      if (p.displayText) {
        let html = p.displayText;

        // __INPUT1__ / __INPUT2__ / ...
        html = html.replace(/__INPUT(\d+)__/g, (_m, d) => {
          const k = parseInt(d, 10);
          return `<input type="number" id="ans-${i}-${k}" class="sub-blank">`;
        });

        // __INPUT__（最終解答の位置指定）
        let mainPlaced = false;
        if (html.includes('__INPUT__')) {
          html = html.replace('__INPUT__', `<input type="number" id="ans-${i}" class="main-blank">`);
          mainPlaced = true;
        }

        eq.innerHTML = html;
const hasAnswer = (typeof p.answer !== 'undefined');

// ...（displayText の置換が終わった直後）...
eq.innerHTML = html;

// ← ここを条件付きに
if (!mainPlaced && hasAnswer) {
  eq.appendChild(mainInput);
}

      } else {
        const op = p.op || '＋';
        eq.innerHTML = `<span>${p.a}</span><span>${op}</span><span>${p.b}</span>=`;
        eq.appendChild(mainInput);
      }

      // ○×アイコン（必要なときだけ作る）
      if (SHOW_ICON) {
        const icon = document.createElement('span');
        icon.id = `icon-${i}`;
        icon.className = 'result-icon';
        eq.appendChild(icon);
      }

      content.append(num, eq);
      const actions = document.createElement('div');
      actions.className = 'problem-actions';
      row.append(content, actions);
      wrap.appendChild(row);

      // イベント（メイン/補助）
      attachInputEvents(document.getElementById(`ans-${i}`));
      if (Array.isArray(p.multiAnswers) && p.multiAnswers.length > 0) {
        for (let k = 1; k <= p.multiAnswers.length; k++) {
          attachInputEvents(document.getElementById(`ans-${i}-${k}`));
        }
      }
    });
  }

  function applyThemeColors(colors) {
    if (!colors) return;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(colors)) root.style.setProperty(k, v);
  }

  // ========= Judge =========
  function checkAnswers() {
    const checkBtn = $('#check-answers');
    if (checkBtn) checkBtn.disabled = true;

    // 既存の未正解マークをクリア
    clearNeedsFix();

    let newIncorrect = [];
    let correctCount = 0;

    const cs = getComputedStyle(document.documentElement);
    const wrongColor   = (cs.getPropertyValue('--c-feedback-wrong')   || '#c62828').trim();
    const correctColor = (cs.getPropertyValue('--c-feedback-correct') || '#2e7d32').trim();
    const defaultColor = (cs.getPropertyValue('--c-primary-light')    || '#90caf9').trim();

    problems.forEach((p, i) => {
      const icon   = SHOW_ICON ? $(`#icon-${i}`) : null;
      if (SHOW_ICON && icon) { icon.textContent = ''; icon.classList.remove('correct', 'wrong'); }

      const mainEl = $(`#ans-${i}`);

      // リセット
      const resetField = el => {
        if (!el) return;
        el.classList.remove('correct-field','incorrect-field','needs-fix');
        el.style.borderColor = defaultColor;
        delete el.dataset.autoclear;
      };
      resetField(mainEl);
      if (Array.isArray(p.multiAnswers)) {
        for (let k = 1; k <= p.multiAnswers.length; k++) {
          resetField($(`#ans-${i}-${k}`));
        }
      }

      // 1) 補助ブランク採点
      let multiOk = true;
      if (Array.isArray(p.multiAnswers) && p.multiAnswers.length > 0) {
        for (let k = 1; k <= p.multiAnswers.length; k++) {
          const sub  = $(`#ans-${i}-${k}`);
          const need = +p.multiAnswers[k - 1];
          if (!sub || sub.value === '' || +sub.value !== need) {
            multiOk = false;
            if (sub) {
              sub.classList.add('incorrect-field','needs-fix');
              sub.classList.remove('correct-field');
              sub.style.borderColor = wrongColor;
              sub.dataset.autoclear = '1'; // 1キーで自動消去
            }
          } else {
            sub.classList.add('correct-field');
            sub.classList.remove('incorrect-field','needs-fix');
            sub.style.borderColor = correctColor;
            sub.disabled = true;
          }
        }
      }
      if (!multiOk) {
        if (SHOW_ICON && icon) { icon.textContent = '×'; icon.classList.add('wrong'); }
        mainEl && (mainEl.disabled = false);
        newIncorrect.push(i);
        return; // この問題は未達成
      }

      // 2) 最終解答採点
      if (typeof p.answer !== 'undefined') {
        const user = mainEl ? mainEl.value : '';
        if (mainEl && user !== '' && +user === +p.answer) {
          if (SHOW_ICON && icon) { icon.textContent = '○'; icon.classList.add('correct'); }
          mainEl.disabled = true;
          mainEl.classList.add('correct-field');
          mainEl.classList.remove('incorrect-field','needs-fix');
          mainEl.style.borderColor = correctColor;
          correctCount++;
        } else {
          if (SHOW_ICON && icon) { icon.textContent = '×'; icon.classList.add('wrong'); }
          if (mainEl) {
            mainEl.disabled = false;
            // 値は消さない（誤りを見せる）→ 1キーで消すためのフラグを付与
            mainEl.classList.add('incorrect-field','needs-fix');
            mainEl.classList.remove('correct-field');
            mainEl.style.borderColor = wrongColor;
            mainEl.dataset.autoclear = '1';
          }
          newIncorrect.push(i);
        }
      } else {
        // 最終解答なし（補助のみ）の課題
        if (SHOW_ICON && icon) { icon.textContent = '○'; icon.classList.add('correct'); }
        correctCount++;
      }
    });

    incorrectIndices = newIncorrect;

    if (incorrectIndices.length === 0) {
      // 全問正解
      const n = problems.length;
      const TIME_LIMIT = n * (config.timeLimitPerQuestion || 5);
      const PTS = config.pointsPerQuestion || 10;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const base = correctCount * PTS;
      let bonus = 0;
      if (+elapsed < TIME_LIMIT) bonus = Math.floor(50 * ((TIME_LIMIT - elapsed) / TIME_LIMIT));
      const score = base + bonus;

      let msg = '🎉 全問正解！おめでとう！ 🎉';
      if (score > highScore) { msg = '🏆 ハイスコア達成！すごい！ 🏆'; highScore = score; startConfettiLoop(); }

      const resultEl = $('#result');
      if (resultEl) resultEl.innerHTML = `${msg}<br>スコア: <strong>${score}点</strong> (タイム: ${elapsed} 秒)`;

      // 星判定
      let starsHtml = '―';
      const s = config.starThresholds;
      if (s) {
        if      (score >= s.star5) starsHtml = `<span class="stars-rainbow status-stars">★★★★★</span>`;
        else if (score >= s.star4) starsHtml = `<span class="stars-diamond status-stars">★★★★☆</span>`;
        else if (score >= s.star3) starsHtml = `<span class="stars-gold status-stars">★★★☆☆</span>`;
        else if (score >= s.star2) starsHtml = `<span class="stars-silver status-stars">★★☆☆☆</span>`;
        else if (score >= s.star1) starsHtml = `<span class="stars-bronze status-stars">★☆☆☆☆</span>`;
        else if (score >= s.star_circle) starsHtml = `<span class="stars-circle status-stars">○</span>`;
      }
      overallStatusStars = starsHtml;
      $('#overallStars') && ($('#overallStars').innerHTML = overallStatusStars);
      if (starsHtml !== '―') $('#overallStars') && $('#overallStars').classList.add('sparkle-animation');

      totalClearCount++; monthlyCount++; dailyCount++;
      saveData(); saveHistoryEntry(score); updateDisplay();

      const retryBtn = $('#retry');
      retryBtn && retryBtn.focus();
      scrollCenter(retryBtn);
    } else {
      // 未正解がある：最初の未正解欄へ
      const resultEl = $('#result');
      if (resultEl) {
        resultEl.textContent = 'おしい！まちがいを直そう！';
        resultEl.style.color = (cs.getPropertyValue('--c-feedback-wrong') || '#d32f2f').trim();
      }
      if (checkBtn) checkBtn.disabled = false;
      focusFirstNeedsFix();
    }
  }

  // ========= Effects =========
  function startConfettiLoop() {
    if (confettiIntervalId) clearInterval(confettiIntervalId);
    confettiIntervalId = setInterval(() => {
      if (typeof confetti !== 'function') return;
      confetti({
        particleCount: 7, startVelocity: 10, spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        ticks: 400, gravity: 0.3, scalar: 0.8,
        colors: ['#FFC700','#FF0000','#FFFFFF','#00FF00','#00BFFF','#FF69B4','#BA55D3']
      });
    }, 200);
  }
  function stopConfetti() {
    if (confettiIntervalId) clearInterval(confettiIntervalId);
    confettiIntervalId = null;
    if (typeof confetti !== 'undefined' && typeof confetti.reset === 'function') confetti.reset();
  }

  // ========= Actions =========
  function retry() {
    stopConfetti();
    startTime = Date.now();
    $('#check-answers') && ($('#check-answers').disabled = false);
    clearNeedsFix();
    incorrectIndices = [];
    problems = config.problemGenerator();
    displayProblems(problems);

    const resultEl = $('#result');
    if (resultEl) {
      resultEl.textContent = '';
      resultEl.style.color = getComputedStyle(document.documentElement).getPropertyValue('--c-primary');
    }
    const overall = $('#overallStars');
    if (overall) {
      overall.classList.remove('sparkle-animation');
      if (overallStatusStars === '―') overall.innerHTML = '―';
    }
    const first = $('#ans-0');
    first && first.focus();
  }

  function resetAll() {
    if (confirm('ハイスコアとステータスをリセットしますか？')) {
      stopConfetti();
      highScore = 0;
      overallStatusStars = '―';
      saveData();
      updateDisplay();
    }
  }

  // ========= Boot =========
  (function main() {
    applyThemeColors(config.themeColors);

    // 見出し
    document.title = config.title || document.title;
    const h1 = $('#main-title');
    const h2 = $('#sub-title');
    if (h1) h1.textContent = (typeof config.mainTitle === 'string' && config.mainTitle.length > 0)
      ? config.mainTitle : '１８　大きい　かず';   // 既定h1（必要に応じて運用で変更OK）
    if (h2) h2.textContent = config.title || '';

    loadData();
    updateDisplay();

    $('#check-answers')  && ($('#check-answers').onclick  = checkAnswers);
    $('#retry')          && ($('#retry').onclick          = retry);
    $('#reset-highscore')&& ($('#reset-highscore').onclick= resetAll);

    const startBtn = $('#start-btn');
    const startArea = $('#start-area');
    const problemsSection = $('#problems-section');
    if (startBtn && startArea && problemsSection) {
      startBtn.onclick = () => {
        startArea.style.display = 'none';
        problemsSection.style.display = 'block';
        retry();
      };
      document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && startArea.style.display !== 'none') startBtn.click();
      });
    }
  })();
}
