// このファイルは、全てのドリルアプリの動作を管理する共通エンジンです。
// このファイル自体は、特定のアプリ（例：「5の段」）に依存しません。
// どのドリルを動かすかは、外部から渡される「config」オブジェクトによって決まります。

function initializeDrillApp(config) {
    // ===== アプリの状態を管理する変数 =====
    let problems = [], startTime = 0, highScore = 0;
    let totalClearCount = 0, monthlyCount = 0, dailyCount = 0;
    let overallStatusStars = '―', incorrectIndices = [];
    let confettiIntervalId = null;

    // ===== ユーティリティ関数と定数 =====
    const ls = localStorage;
    const nowDT = () => new Date().toLocaleString();
    const scrollCenter = el => el && el.scrollIntoView({ behavior: "smooth", block: "center" });
    const hasFn = (o, k) => o && typeof o[k] === 'function';

    // ===== 設定からローカルストレージのキーを生成 =====
    const KEY_HS             = `${config.appId}:hs`;
    const KEY_HISTORY        = `${config.appId}:history`;
    const KEY_CLEAR          = `${config.appId}:clearCount`;
    const KEY_MONTHLY_PREFIX = `${config.appId}:monthlyClear-`;
    const KEY_DAILY_PREFIX   = `${config.appId}:dailyClear-`;
    const KEY_OVERALL_STATUS = `${config.appId}:status`;

    // ===== データ保存・読み込み関数群 =====
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

    // ===== 表示更新関数群 =====
    function updateDisplay() {
        const hsEl     = document.querySelector('#highScoreValue');
        const clearEl  = document.querySelector('#clearCountValue');
        const monthEl  = document.querySelector('#monthlyCountValue');
        const dailyEl  = document.querySelector('#dailyCountValue');
        const starEl   = document.querySelector('#overallStars');
        const histList = document.querySelector('#history-list');

        if (hsEl)    hsEl.textContent = highScore;
        if (clearEl) clearEl.textContent = totalClearCount;
        if (monthEl) monthEl.textContent = monthlyCount;
        if (dailyEl) dailyEl.textContent = dailyCount;
        if (starEl)  starEl.innerHTML = overallStatusStars;

        const history = JSON.parse(ls.getItem(KEY_HISTORY) || '[]');
        if (histList) histList.innerHTML = history.map(h => `<li>${h.datetime}：${h.score}てん</li>`).join('');
    }

    // ===== DOM操作関数群 =====
    function displayProblems(generatedProblems) {
      const wrap = document.querySelector('#problems-wrapper');
      if (!wrap) return;
      wrap.innerHTML = '';

      // ★ カスタム描画フック（例：時計UI）
      if (hasFn(config, 'renderProblem')) {
        config.renderProblem(wrap, generatedProblems);
        return;
      }

      // 既定：数式 + 1入力
      generatedProblems.forEach((p, i) => {
        const row = document.createElement('div'); row.className = 'problem';
        const num = document.createElement('div'); num.className = 'problem-number'; num.textContent = (i + 1) + '.';
        const eq = document.createElement('div'); eq.className = 'problem-equation';
        eq.innerHTML = `<span>${p.a}</span><span>${p.op}</span><span>${p.b}</span>=`;
        const inp = document.createElement('input'); inp.type = 'number'; inp.id = `ans-${i}`;
        inp.addEventListener('focus', () => scrollCenter(inp));
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const currentProblemIndex = parseInt(e.target.id.replace('ans-', ''), 10);
            let nextIndexToFocus = -1;
            if (incorrectIndices.length > 0) {
              const currentIndexInIncorrect = incorrectIndices.indexOf(currentProblemIndex);
              if (currentIndexInIncorrect > -1 && currentIndexInIncorrect < incorrectIndices.length - 1) {
                nextIndexToFocus = incorrectIndices[currentIndexInIncorrect + 1];
              }
            } else if (currentProblemIndex < problems.length - 1) {
              nextIndexToFocus = currentProblemIndex + 1;
            }
            if (nextIndexToFocus !== -1) document.querySelector(`#ans-${nextIndexToFocus}`)?.focus();
            else document.querySelector('#check-answers')?.focus();
          }
        });
        const icon = document.createElement('span'); icon.id = `icon-${i}`; icon.className = 'result-icon';
        eq.append(inp, icon); row.append(num, eq); wrap.appendChild(row);
      });
    }

    function applyThemeColors(colors) {
        if (!colors) return;
        const root = document.documentElement;
        for (const [key, value] of Object.entries(colors)) {
            root.style.setProperty(key, value);
        }
    }

    // ===== ゲームロジック関数群 =====
    function checkAnswers() {
      const checkBtn = document.querySelector('#check-answers');
      if (checkBtn) checkBtn.disabled = true;

      let newIncorrectIndices = []; let correctCount = 0;
      const wrongColor = getComputedStyle(document.documentElement).getPropertyValue('--c-feedback-wrong').trim();
      const defaultBorderColor = getComputedStyle(document.documentElement).getPropertyValue('--c-primary-light').trim();
      
      problems.forEach((p, i) => {
        const inputField = document.querySelector(`#ans-${i}`);
        if (!inputField) return;
        if (inputField.disabled) { correctCount++; return; }
        const user = inputField.value; const ans = p.answer;
        const icon = document.querySelector(`#icon-${i}`);
        if (icon) { icon.textContent = ''; icon.classList.remove('correct', 'wrong'); }
        inputField.style.borderColor = defaultBorderColor;
        if (user !== '' && +user === ans) {
          if (icon) { icon.textContent = '○'; icon.classList.add('correct'); }
          inputField.disabled = true; correctCount++;
        } else {
          if (icon) { icon.textContent = '×'; icon.classList.add('wrong'); }
          inputField.disabled = false; inputField.value = ''; inputField.style.borderColor = wrongColor;
          newIncorrectIndices.push(i);
        }
      });
      incorrectIndices = newIncorrectIndices;

      if (incorrectIndices.length === 0) { // 全問正解
        onAllCorrect(correctCount);
      } else { // まだ間違いがある
        const resultEl = document.querySelector('#result');
        const wrongColorVar = getComputedStyle(document.documentElement).getPropertyValue('--c-feedback-wrong').trim();
        if (resultEl) {
          resultEl.innerHTML = 'おしい！まちがいを直そう！';
          resultEl.style.color = wrongColorVar;
        }
        if (checkBtn) checkBtn.disabled = false;
        document.querySelector(`#ans-${incorrectIndices[0]}`)?.focus();
      }
    }

    // ★ カスタム採点フック（時計UIなど、2入力などのとき）
    function customCheckWrapper() {
      const checkBtn = document.querySelector('#check-answers');
      if (checkBtn) checkBtn.disabled = true;

      const wrongColorVar = getComputedStyle(document.documentElement).getPropertyValue('--c-feedback-wrong').trim();

      const res = config.customCheck({ problems }); // { correctCount, incorrectIndices }
      const correctCount = res?.correctCount ?? 0;
      const newIncorrectIndices = res?.incorrectIndices ?? [];
      incorrectIndices = newIncorrectIndices;

      if (incorrectIndices.length === 0) {
        onAllCorrect(correctCount);
      } else {
        const resultEl = document.querySelector('#result');
        if (resultEl) {
          resultEl.innerHTML = 'おしい！まちがいを直そう！';
          resultEl.style.color = wrongColorVar;
        }
        if (checkBtn) checkBtn.disabled = false;

        // フォーカス先：#ans-i / #ans-hour-i / #ans-kind-i のどれか
        const idx = incorrectIndices[0];
        const cand = document.querySelector(`#ans-${idx}`) ||
                     document.querySelector(`#ans-hour-${idx}`) ||
                     document.querySelector(`#ans-kind-${idx}`);
        if (cand) cand.focus();
      }
    }

    function onAllCorrect(correctCount) {
        const NUM_QUESTIONS = problems.length;
        const TIME_LIMIT = NUM_QUESTIONS * (config.timeLimitPerQuestion ?? 5);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const baseScore = correctCount * (config.pointsPerQuestion ?? 10);
        let timeBonus = 0;
        if (+elapsed < TIME_LIMIT) {
          timeBonus = Math.floor(50 * ((TIME_LIMIT - (+elapsed)) / TIME_LIMIT));
        }
        let score = baseScore + timeBonus;

        let message = '🎉 全問正解！おめでとう！ 🎉';
        if (score > highScore) {
            message = '🏆 ハイスコア達成！すごい！ 🏆'; highScore = score;
            startConfettiLoop();
        }

        const resultEl = document.querySelector('#result');
        if (resultEl) resultEl.innerHTML = `${message}<br>スコア: <strong>${score}点</strong> (タイム: ${elapsed} 秒)`;
        
        // 星ランク
        let starsHtml = '―'; const s = config.starThresholds || {
          star_circle: 100, star1:110, star2:120, star3:130, star4:140, star5:145
        };
        if      (score >= s.star5) starsHtml = `<span class="stars-rainbow status-stars">★★★★★</span>`;
        else if (score >= s.star4) starsHtml = `<span class="stars-diamond status-stars">★★★★☆</span>`;
        else if (score >= s.star3) starsHtml = `<span class="stars-gold status-stars">★★★☆☆</span>`;
        else if (score >= s.star2) starsHtml = `<span class="stars-silver status-stars">★★☆☆☆</span>`;
        else if (score >= s.star1) starsHtml = `<span class="stars-bronze status-stars">★☆☆☆☆</span>`;
        else if (score >= s.star_circle) starsHtml = `<span class="stars-circle status-stars">○</span>`;
        
        overallStatusStars = starsHtml;
        const overallStarsEl = document.querySelector('#overallStars');
        if (overallStarsEl) {
          overallStarsEl.innerHTML = overallStatusStars;
          if (starsHtml !== '―') overallStarsEl.classList.add('sparkle-animation');
        }
        
        // クリア加算＆保存
        totalClearCount++; monthlyCount++; dailyCount++;
        saveData();
        saveHistoryEntry(score);
        updateDisplay();
        
        const retryBtn = document.querySelector('#retry');
        if (retryBtn) { retryBtn.focus(); scrollCenter(retryBtn); }
    }

    function startConfettiLoop() {
        if (confettiIntervalId) clearInterval(confettiIntervalId);
        // canvas-confetti のグローバル関数 confetti を使用
        confettiIntervalId = setInterval(() => confetti({
            particleCount: 7, startVelocity: 10, spread: 360,
            origin: { x: Math.random(), y: Math.random() - 0.2 },
            ticks: 400, gravity: 0.3, scalar: 0.8,
            colors: ['#FFC700','#FF0000','#FFFFFF','#00FF00','#00BFFF','#FF69B4','#BA55D3']
        }), 200);
    }

    function stopConfetti() {
        if (confettiIntervalId) clearInterval(confettiIntervalId);
        confettiIntervalId = null;
        if (typeof confetti !== 'undefined') confetti.reset();
    }

    function retry() {
      stopConfetti();
      startTime = Date.now();
      const checkBtn = document.querySelector('#check-answers');
      if (checkBtn) checkBtn.disabled = false;
      incorrectIndices = [];
      problems = hasFn(config, 'problemGenerator') ? config.problemGenerator() : [];
      displayProblems(problems);

      const resultEl = document.querySelector('#result');
      if (resultEl) {
        resultEl.textContent = '';
        resultEl.style.color = getComputedStyle(document.documentElement).getPropertyValue('--c-primary');
      }
      const overallStarsSpan = document.querySelector('#overallStars');
      if (overallStarsSpan) {
        overallStarsSpan.classList.remove('sparkle-animation');
        if (overallStatusStars === '―') overallStarsSpan.innerHTML = '―';
      }

      // ★ 初期フォーカス拡張：config.firstFocusSelector が優先
      const firstSelector = config.firstFocusSelector || '#ans-0';
      const first = document.querySelector(firstSelector);
      if (first) first.focus();
    }

    function resetAll() {
        if (confirm('ハイスコアとステータスをリセットしますか？')) {
            stopConfetti();
            highScore = 0;
            overallStatusStars = '―';
            // totalClearCount などはリセットしない方針
            saveData();
            updateDisplay();
        }
    }
    
    // ===== アプリケーションの初期化と実行 =====
    (function main() {
        applyThemeColors(config.themeColors);

        // ★ ドキュメントタイトル／見出し（h1/h2）を設定から反映
        if (config.title) document.title = config.title;
        const h1 = document.getElementById('main-title');
        const h2 = document.getElementById('sub-title');
        if (h1) h1.textContent = config.h1 || config.title || '';
        if (h2) h2.textContent = config.h2 || '';

        loadData();
        updateDisplay();

        // ★ まるつけ：customCheck があればそちらを使用
        const checkBtn = document.querySelector('#check-answers');
        if (checkBtn) checkBtn.onclick = () => {
          if (hasFn(config, 'customCheck')) return customCheckWrapper();
          return checkAnswers();
        };

        const retryBtn = document.querySelector('#retry');
        if (retryBtn) retryBtn.onclick = retry;

        const resetBtn = document.querySelector('#reset-highscore');
        if (resetBtn) resetBtn.onclick = resetAll;

        const startBtn = document.querySelector('#start-btn');
        const startArea = document.querySelector('#start-area');
        const problemsSection = document.querySelector('#problems-section');
        if (startBtn) {
          startBtn.onclick = () => {
              if (startArea) startArea.style.display = 'none';
              if (problemsSection) problemsSection.style.display = 'block';
              retry();
          };
        }
        // Enterでスタート
        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && startArea && startArea.style.display !== 'none') startBtn?.click();
        });
    })();
}
