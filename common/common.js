// common.js - HTML主導でも動く拡張版
//  - main/subタイトルはHTMLに書いてあれば尊重
//  - <body data-theme="theme_xxx"> でテーマ適用（themes.jsの変数名）
//  - <body data-app-id="..."> で appId を指定可能
//  - 問題生成は config.problemGenerator / config.createProblems / window.generateProblems を自動検出
//  - 星の閾値は旧(new)両表記に対応
// 既存版をベースに必要最小限の非破壊変更を加えています。

(function () {
  'use strict';

  function initializeDrillApp(userConfig) {
    // ===== アプリの状態を管理する変数 =====
    let problems = [];
    let startTime = 0;
    let highScore = 0;
    let totalClearCount = 0, monthlyCount = 0, dailyCount = 0;
    let overallStatusStars = '―';
    let incorrectIndices = [];
    let confettiIntervalId = null;

    // ===== ユーティリティ =====
    const ls = localStorage;
    const nowDT = () => new Date().toLocaleString();
    const $ = (sel) => document.querySelector(sel);
    const byId = (id) => document.getElementById(id);
    const scrollCenter = (el) => el && el.scrollIntoView({ behavior: "smooth", block: "center" });

    // ===== 設定の取り込み（HTML優先の互換レイヤ） =====
    const config = Object.assign({}, userConfig || {});
    // appId: data-属性優先
    const appIdFromDOM = document.body && document.body.dataset ? document.body.dataset.appId : '';
    config.appId = appIdFromDOM || config.appId || 'app-unknown';

    // タイトルは「HTMLに文字があれば尊重」。空なら補完。
    const mainTitleEl = byId('main-title');
    const subTitleEl  = byId('sub-title');

    // ドキュメントタイトル補完（HTMLにsubがあればそれをタイトルに）
    if (document.title.trim() === '' && subTitleEl && subTitleEl.textContent.trim() !== '') {
      document.title = subTitleEl.textContent.trim();
    }

    // HTMLが空のときだけJSで埋める
    if (mainTitleEl && mainTitleEl.textContent.trim() === '') {
      mainTitleEl.textContent = config.mainTitle || 'わくわく算数ドリル';
    }
    if (subTitleEl && subTitleEl.textContent.trim() === '') {
      subTitleEl.textContent = config.subTitle || config.title || document.title || '';
    }

    // ===== ローカルストレージキー =====
    const KEY_HS             = `${config.appId}:hs`;
    const KEY_HISTORY        = `${config.appId}:history`;
    const KEY_CLEAR          = `${config.appId}:clearCount`;
    const KEY_MONTHLY_PREFIX = `${config.appId}:monthlyClear-`; // YYYY-MM
    const KEY_DAILY_PREFIX   = `${config.appId}:dailyClear-`;   // YYYY-MM-DD
    const KEY_OVERALL_STATUS = `${config.appId}:status`;

    // ===== データ保存・読み込み =====
    function loadData() {
      highScore = +ls.getItem(KEY_HS) || 0;
      const todayKey = KEY_DAILY_PREFIX + new Date().toISOString().slice(0, 10);
      const monthKey = KEY_MONTHLY_PREFIX + new Date().toISOString().slice(0, 7);
      totalClearCount = +ls.getItem(KEY_CLEAR) || 0;
      monthlyCount    = +ls.getItem(monthKey)  || 0;
      dailyCount      = +ls.getItem(todayKey)  || 0;
      overallStatusStars = ls.getItem(KEY_OVERALL_STATUS) || '―';
    }

    function saveData() {
      const todayKey = KEY_DAILY_PREFIX + new Date().toISOString().slice(0, 10);
      const monthKey = KEY_MONTHLY_PREFIX + new Date().toISOString().slice(0, 7);
      ls.setItem(KEY_HS, String(highScore));
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

    // ===== 表示更新 =====
    function updateDisplay() {
      const hs = byId('highScoreValue');
      const cc = byId('clearCountValue');
      const mc = byId('monthlyCountValue');
      const dc = byId('dailyCountValue');
      const os = byId('overallStars');

      if (hs) hs.textContent = highScore;
      if (cc) cc.textContent = totalClearCount;
      if (mc) mc.textContent = monthlyCount;
      if (dc) dc.textContent = dailyCount;
      if (os) os.innerHTML = overallStatusStars;

      const history = JSON.parse(ls.getItem(KEY_HISTORY) || '[]');
      const list = byId('history-list');
      if (list) list.innerHTML = history.map(h => `<li>${h.datetime}：${h.score}てん</li>`).join('');
    }

    // ===== テーマ適用 =====
    function applyThemeColors(colors) {
      if (!colors) return;
      const root = document.documentElement;
      for (const [key, value] of Object.entries(colors)) {
        root.style.setProperty(key, value);
      }
    }
    // data-theme から themes.js の同名変数を解決して適用（HTML優先）
    const themeNameFromDOM = (document.body && document.body.dataset) ? document.body.dataset.theme : '';
    const themeFromDOM = themeNameFromDOM && window[themeNameFromDOM]; // e.g. theme_sky
    applyThemeColors(themeFromDOM || config.themeColors); // HTML > config【themes.jsを想定】:contentReference[oaicite:2]{index=2}

    // ===== 問題の描画 =====
    function displayProblems(generatedProblems) {
      const wrap = byId('problems-wrapper');
      if (!wrap) return;
      wrap.innerHTML = '';

      generatedProblems.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'problem';

        const problemContent = document.createElement('div');
        problemContent.className = 'problem-content';

        const num = document.createElement('div');
        num.className = 'problem-number';
        num.textContent = (i + 1) + '.';

        const eq = document.createElement('div');
        eq.className = 'problem-equation';

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.id = `ans-${i}`;

        // 表示文字列の互換対応:
        //  1) p.displayText（__INPUT__ 置換対応）
        //  2) p.question（末尾に入力欄を追加）
        //  3) {a,op,b} から合成
        if (p.displayText && typeof p.displayText === 'string') {
          const inputHtml = `<span>${inp.outerHTML}</span>`;
          eq.innerHTML = p.displayText.includes('__INPUT__')
            ? p.displayText.replace('__INPUT__', inputHtml)
            : (p.displayText + inputHtml);
        } else if (p.question && typeof p.question === 'string') {
          eq.innerHTML = p.question;
          eq.appendChild(inp);
        } else {
          // 従来形式: a, b, op
          const a = (p.a != null) ? p.a : '';
          const b = (p.b != null) ? p.b : '';
          const op = p.op || '+';
          eq.innerHTML = `<span>${a}</span><span>${op}</span><span>${b}</span>=`;
          eq.appendChild(inp);
        }

        const icon = document.createElement('span');
        icon.id = `icon-${i}`;
        icon.className = 'result-icon';
        eq.appendChild(icon);

        problemContent.append(num, eq);

        const problemActions = document.createElement('div');
        problemActions.className = 'problem-actions';

        row.append(problemContent, problemActions);
        wrap.appendChild(row);

        // 入力欄イベント（Enterで次の誤答 or 次問 or まるつけ）
        const inputElement = byId(`ans-${i}`);
        if (inputElement) {
          inputElement.addEventListener('focus', () => scrollCenter(inputElement));
          inputElement.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const currentProblemIndex = i;
              let nextIndexToFocus = -1;
              if (incorrectIndices.length > 0) {
                const pos = incorrectIndices.indexOf(currentProblemIndex);
                if (pos > -1 && pos < incorrectIndices.length - 1) {
                  nextIndexToFocus = incorrectIndices[pos + 1];
                }
              } else if (currentProblemIndex < problems.length - 1) {
                nextIndexToFocus = currentProblemIndex + 1;
              }
              if (nextIndexToFocus !== -1) byId(`ans-${nextIndexToFocus}`)?.focus();
              else byId('check-answers')?.focus();
            }
          });
        }
      });
    }

    // ===== スコア算出・採点 =====
    function normalizeStarThresholds(s) {
      if (!s) return null;
      // 旧記法(star5..star1, star_circle) と 新記法(diamond..circle) の両対応
      return {
        star5:       s.star5       ?? s.diamond,
        star4:       s.star4       ?? s.gold,
        star3:       s.star3       ?? s.silver,
        star2:       s.star2       ?? s.bronze,
        star1:       s.star1       ?? s.circle,
        star_circle: s.star_circle ?? s.circle
      };
    }

    function checkAnswers() {
      const checkBtn = byId('check-answers');
      if (checkBtn) checkBtn.disabled = true;

      let newIncorrectIndices = [];
      let correctCount = 0;

      const css = getComputedStyle(document.documentElement);
      const wrongColor = css.getPropertyValue('--c-feedback-wrong').trim();
      const defaultBorderColor = css.getPropertyValue('--c-primary-light').trim();

      problems.forEach((p, i) => {
        const inputField = byId(`ans-${i}`);
        if (!inputField) return;

        if (inputField.disabled) { correctCount++; return; }

        const user = inputField.value;
        const ans = p.answer;
        const icon = byId(`icon-${i}`);

        if (icon) {
          icon.textContent = '';
          icon.classList.remove('correct', 'wrong');
        }
        inputField.style.borderColor = defaultBorderColor;

        if (user !== '' && +user === ans) {
          if (icon) { icon.textContent = '○'; icon.classList.add('correct'); }
          inputField.disabled = true;
          correctCount++;
        } else {
          if (icon) { icon.textContent = '×'; icon.classList.add('wrong'); }
          inputField.disabled = false;
          inputField.value = '';
          inputField.style.borderColor = wrongColor;
          newIncorrectIndices.push(i);
        }
      });

      incorrectIndices = newIncorrectIndices;

      if (incorrectIndices.length === 0) {
        // 全問正解
        const NUM_QUESTIONS = problems.length;
        const TIME_LIMIT = NUM_QUESTIONS * (config.timeLimitPerQuestion || 5);
        const pointsPerQuestion = config.pointsPerQuestion || 10;

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const baseScore = correctCount * pointsPerQuestion;
        let timeBonus = 0;
        if (+elapsed < TIME_LIMIT) {
          timeBonus = Math.floor(50 * ((TIME_LIMIT - (+elapsed)) / TIME_LIMIT));
        }
        const score = baseScore + timeBonus;

        let message = '🎉 全問正解！おめでとう！ 🎉';
        if (score > highScore) {
          message = '🏆 ハイスコア達成！すごい！ 🏆';
          highScore = score;
          startConfettiLoop();
        }

        const resultEl = byId('result');
        if (resultEl) {
          resultEl.innerHTML = `${message}<br>スコア: <strong>${score}点</strong> (タイム: ${elapsed} 秒)`;
          resultEl.style.color = getComputedStyle(document.documentElement).getPropertyValue('--c-primary');
        }

        // 星の評価
        let starsHtml = '―';
        const s2 = normalizeStarThresholds(config.starThresholds);
        if (s2) {
          if      (score >= s2.star5)       starsHtml = `<span class="stars-rainbow status-stars">★★★★★</span>`;
          else if (score >= s2.star4)       starsHtml = `<span class="stars-diamond status-stars">★★★★☆</span>`;
          else if (score >= s2.star3)       starsHtml = `<span class="stars-gold status-stars">★★★☆☆</span>`;
          else if (score >= s2.star2)       starsHtml = `<span class="stars-silver status-stars">★★☆☆☆</span>`;
          else if (score >= s2.star1)       starsHtml = `<span class="stars-bronze status-stars">★☆☆☆☆</span>`;
          else if (score >= s2.star_circle) starsHtml = `<span class="stars-circle status-stars">○</span>`;
        }

        overallStatusStars = starsHtml;
        const overallStarsSpan = byId('overallStars');
        if (overallStarsSpan) {
          overallStarsSpan.innerHTML = overallStatusStars;
          if (starsHtml !== '―') overallStarsSpan.classList.add('sparkle-animation');
        }

        totalClearCount++; monthlyCount++; dailyCount++;
        saveData();
        saveHistoryEntry(score);
        updateDisplay();

        const retryBtn = byId('retry');
        if (retryBtn) { retryBtn.focus(); scrollCenter(retryBtn); }
      } else {
        const resultEl = byId('result');
        if (resultEl) {
          resultEl.innerHTML = 'おしい！まちがいを直して、もういちど「まるつけ」しよう！';
          resultEl.style.color = wrongColor;
        }
        if (checkBtn) checkBtn.disabled = false;
        byId(`ans-${incorrectIndices[0]}`)?.focus();
      }
    }

    // ===== コンフェッティ =====
    function startConfettiLoop() {
      if (confettiIntervalId) clearInterval(confettiIntervalId);
      if (typeof confetti === 'undefined') return;
      confettiIntervalId = setInterval(() => {
        confetti({
          particleCount: 7,
          startVelocity: 10,
          spread: 360,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          ticks: 400,
          gravity: 0.3,
          scalar: 0.8,
          colors: ['#FFC700', '#FF0000', '#FFFFFF', '#00FF00', '#00BFFF', '#FF69B4', '#BA55D3']
        });
      }, 200);
    }

    function stopConfetti() {
      if (confettiIntervalId) clearInterval(confettiIntervalId);
      confettiIntervalId = null;
      if (typeof confetti !== 'undefined' && typeof confetti.reset === 'function') confetti.reset();
    }

    // ===== 再スタート =====
    function resolveProblemGenerator() {
      if (typeof config.problemGenerator === 'function') return config.problemGenerator;
      if (typeof config.createProblems === 'function')   return config.createProblems;
      if (typeof window.generateProblems === 'function') return window.generateProblems;
      return null;
    }

    function retry() {
      stopConfetti();
      startTime = Date.now();
      incorrectIndices = [];

      // 問題生成関数の解決
      const gen = resolveProblemGenerator();
      if (!gen) {
        const resultEl = byId('result');
        if (resultEl) resultEl.innerHTML = '問題生成関数が見つかりません。<br>window.generateProblems() を定義するか、config に problemGenerator / createProblems を指定してください。';
        return;
      }

      problems = gen();
      displayProblems(problems);

      const checkBtn = byId('check-answers');
      if (checkBtn) checkBtn.disabled = false;

      const resultEl = byId('result');
      if (resultEl) {
        resultEl.textContent = '';
        resultEl.style.color = getComputedStyle(document.documentElement).getPropertyValue('--c-primary');
      }

      const overallStarsSpan = byId('overallStars');
      if (overallStarsSpan) {
        overallStarsSpan.classList.remove('sparkle-animation');
        if (overallStatusStars === '―') overallStarsSpan.innerHTML = '―';
      }

      byId('ans-0')?.focus();
    }

    // ===== リセット =====
    function resetAll() {
      if (confirm('ハイスコアとステータスをリセットしますか？')) {
        stopConfetti();
        highScore = 0;
        overallStatusStars = '―';
        saveData();
        updateDisplay();
      }
    }

    // ===== 初期化 =====
    (function main() {
      loadData();
      updateDisplay();

      const checkBtn = byId('check-answers');
      const retryBtn = byId('retry');
      const resetBtn = byId('reset-highscore');
      const startBtn = byId('start-btn');
      const startArea = byId('start-area');
      const problemsSection = byId('problems-section');

      if (checkBtn) checkBtn.onclick = checkAnswers;
      if (retryBtn) retryBtn.onclick = retry;
      if (resetBtn) resetBtn.onclick = resetAll;

      if (startBtn && startArea && problemsSection) {
        startBtn.onclick = () => {
          startArea.style.display = 'none';
          problemsSection.style.display = 'block';
          retry();
        };
        // Enterでも開始
        document.addEventListener('keydown', e => {
          if (e.key === 'Enter' && startArea.style.display !== 'none') startBtn.click();
        });
      } else {
        // スタートUIが無いテンプレでも素直に開始できるように
        retry();
      }
    })();
  }

  // グローバル公開（従来互換）
  window.initializeDrillApp = initializeDrillApp;
})();
