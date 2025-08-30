// 共通エンジン：全ドリル共通の描画・採点・記録ロジック
// initializeDrillApp(config) を呼ぶだけで動きます。

function initializeDrillApp(config) {
  // ========= State =========
  let problems = [];
  let startTime = 0;
  let highScore = 0;
  let totalClearCount = 0, monthlyCount = 0, dailyCount = 0;
  let overallStatusStars = '―';
  let incorrectIndices = [];
  let confettiIntervalId = null;

  // ========= Utils =========
  const ls = localStorage;
  const nowDT = () => new Date().toLocaleString();
  const scrollCenter = el => el && el.scrollIntoView({ behavior: "smooth", block: "center" });

  // ========= LS Keys =========
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
    document.querySelector('#highScoreValue').textContent = highScore;
    document.querySelector('#clearCountValue').textContent = totalClearCount;
    document.querySelector('#monthlyCountValue').textContent = monthlyCount;
    document.querySelector('#dailyCountValue').textContent = dailyCount;
    document.querySelector('#overallStars').innerHTML = overallStatusStars;
    const history = JSON.parse(ls.getItem(KEY_HISTORY) || '[]');
    document.querySelector('#history-list').innerHTML =
      history.map(h => `<li>${h.datetime}：${h.score}てん</li>`).join('');
  }

  function attachInputEvents(el, i) {
    if (!el) return;
    el.addEventListener('focus', () => scrollCenter(el));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const cur = i;
        let next = -1;
        if (incorrectIndices.length > 0) {
          const pos = incorrectIndices.indexOf(cur);
          if (pos > -1 && pos < incorrectIndices.length - 1) next = incorrectIndices[pos + 1];
        } else if (cur < problems.length - 1) next = cur + 1;
        if (next !== -1) {
          const t = document.querySelector(`#ans-${next}`);
          t && t.focus();
        } else {
          document.querySelector('#check-answers').focus();
        }
      }
    });
  }

  function displayProblems(generatedProblems) {
    const wrap = document.querySelector('#problems-wrapper');
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

      // 最終解答欄（必要時）
      const mainInput = document.createElement('input');
      mainInput.type = 'number';
      mainInput.id = `ans-${i}`;

      // ★★★ 複数ブランク対応 ★★★
      if (p.displayText) {
        let html = p.displayText;

        // 1) __INPUT1__ / __INPUT2__ / ... を補助ブランクに置換
        html = html.replace(/__INPUT(\d+)__/g, (_m, d) => {
          const k = parseInt(d, 10);
          return `<input type="number" id="ans-${i}-${k}" class="sub-blank">`;
        });

        // 2) __INPUT__ があれば最終解答欄をその位置へ
        let mainPlaced = false;
        if (html.includes('__INPUT__')) {
          html = html.replace(
            '__INPUT__',
            `<input type="number" id="ans-${i}" class="main-blank">`
          );
          mainPlaced = true;
        }

        eq.innerHTML = html;

        // 3) __INPUT__ が無い場合は末尾に最終解答欄を追加（後方互換）
        if (!mainPlaced) eq.appendChild(mainInput);
      } else {
        // 従来の a op b = [input]
        const op = p.op || '＋';
        eq.innerHTML = `<span>${p.a}</span><span>${op}</span><span>${p.b}</span>=`;
        eq.appendChild(mainInput);
      }

      // 判定アイコン
      const icon = document.createElement('span');
      icon.id = `icon-${i}`;
      icon.className = 'result-icon';
      eq.appendChild(icon);

      content.append(num, eq);
      const actions = document.createElement('div');
      actions.className = 'problem-actions';
      row.append(content, actions);
      wrap.appendChild(row);

      // イベント付与（最終解答欄）
      attachInputEvents(document.getElementById(`ans-${i}`), i);
      // イベント付与（補助ブランク）
      const subs = eq.querySelectorAll(`[id^="ans-${i}-"]`);
      subs.forEach(sub => attachInputEvents(sub, i));
    });
  }

  function applyThemeColors(colors) {
    if (!colors) return;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(colors)) root.style.setProperty(k, v);
  }

  // ========= Judge =========
  function checkAnswers() {
    document.querySelector('#check-answers').disabled = true;

    let newIncorrect = [];
    let correctCount = 0;

    const cs = getComputedStyle(document.documentElement);
    const wrongColor   = cs.getPropertyValue('--c-feedback-wrong').trim();
    const defaultColor = cs.getPropertyValue('--c-primary-light').trim();

    problems.forEach((p, i) => {
      const icon = document.querySelector(`#icon-${i}`);
      const mainEl = document.querySelector(`#ans-${i}`);
      icon.textContent = '';
      icon.classList.remove('correct', 'wrong');

      // 1) 補助ブランク採点（multiAnswers を順番にチェック）
      let multiOk = true;
      if (Array.isArray(p.multiAnswers) && p.multiAnswers.length > 0) {
        for (let k = 1; k <= p.multiAnswers.length; k++) {
          const sub = document.querySelector(`#ans-${i}-${k}`);
          const need = +p.multiAnswers[k - 1];
          if (!sub || sub.value === '' || +sub.value !== need) {
            multiOk = false;
            if (sub) sub.style.borderColor = wrongColor;
          } else {
            sub.style.borderColor = defaultColor;
            sub.disabled = true;
          }
        }
      }
      if (!multiOk) {
        icon.textContent = '×';
        icon.classList.add('wrong');
        mainEl && (mainEl.disabled = false);
        newIncorrect.push(i);
        return; // 次の問題へ
      }

      // 2) 最終解答採点（answer があれば判定）
      const hasMain = typeof p.answer !== 'undefined';
      if (hasMain) {
        const user = mainEl ? mainEl.value : '';
        if (mainEl && user !== '' && +user === +p.answer) {
          icon.textContent = '○';
          icon.classList.add('correct');
          mainEl.disabled = true;
          correctCount++;
        } else {
          icon.textContent = '×';
          icon.classList.add('wrong');
          if (mainEl) {
            mainEl.disabled = false;
            mainEl.value = '';
            mainEl.style.borderColor = wrongColor;
          }
          newIncorrect.push(i);
        }
      } else {
        // 最終解答が無い課題（補助ブランクのみ）も通過扱い
        icon.textContent = '○';
        icon.classList.add('correct');
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
      if (score > highScore) {
        msg = '🏆 ハイスコア達成！すごい！ 🏆';
        highScore = score;
        startConfettiLoop();
      }

      document.querySelector('#result').innerHTML =
        `${msg}<br>スコア: <strong>${score}点</strong> (タイム: ${elapsed} 秒)`;

      // 星
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
      const overall = document.querySelector('#overallStars');
      overall.innerHTML = overallStatusStars;
      if (starsHtml !== '―') overall.classList.add('sparkle-animation');

      totalClearCount++; monthlyCount++; dailyCount++;
      saveData();
      saveHistoryEntry(score);
      updateDisplay();

      const retryBtn = document.querySelector('#retry');
      retryBtn.focus(); scrollCenter(retryBtn);
    } else {
      // まだ間違いあり
      document.querySelector('#result').textContent =
        'おしい！まちがいを直そう！';
      document.querySelector('#result').style.color =
        getComputedStyle(document.documentElement).getPropertyValue('--c-feedback-wrong').trim();
      document.querySelector('#check-answers').disabled = false;
      const firstWrong = document.querySelector(`#ans-${incorrectIndices[0]}`);
      firstWrong && firstWrong.focus();
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
    document.querySelector('#check-answers').disabled = false;
    incorrectIndices = [];
    problems = config.problemGenerator();
    displayProblems(problems);

    const resultEl = document.querySelector('#result');
    resultEl.textContent = '';
    resultEl.style.color = getComputedStyle(document.documentElement).getPropertyValue('--c-primary');

    const overall = document.querySelector('#overallStars');
    overall.classList.remove('sparkle-animation');
    if (overallStatusStars === '―') overall.innerHTML = '―';

    const first = document.querySelector('#ans-0');
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
    document.getElementById('main-title').textContent =
      (typeof config.mainTitle === 'string' && config.mainTitle.length > 0)
        ? config.mainTitle
        : '１５　ひきざん⑵';         // 既定のh1（運用で変更OK）
    document.getElementById('sub-title').textContent = config.title || '';

    loadData();
    updateDisplay();

    document.querySelector('#check-answers').onclick = checkAnswers;
    document.querySelector('#retry').onclick = retry;
    document.querySelector('#reset-highscore').onclick = resetAll;

    const startBtn = document.querySelector('#start-btn');
    const startArea = document.querySelector('#start-area');
    const problemsSection = document.querySelector('#problems-section');
    startBtn.onclick = () => {
      startArea.style.display = 'none';
      problemsSection.style.display = 'block';
      retry();
    };
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && startArea.style.display !== 'none') startBtn.click();
    });
  })();
}
