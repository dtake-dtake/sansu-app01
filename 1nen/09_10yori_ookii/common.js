// このファイルは、全てのドリルアプリの動作を管理する共通エンジンです。
// このファイル自体は、特定のアプリに依存しません。
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
    const scrollCenter = el => el.scrollIntoView({ behavior: "smooth", block: "center" });

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
        document.querySelector('#highScoreValue').textContent = highScore;
        document.querySelector('#clearCountValue').textContent = totalClearCount;
        document.querySelector('#monthlyCountValue').textContent = monthlyCount;
        document.querySelector('#dailyCountValue').textContent = dailyCount;
        document.querySelector('#overallStars').innerHTML = overallStatusStars;
        const history = JSON.parse(ls.getItem(KEY_HISTORY) || '[]');
        document.querySelector('#history-list').innerHTML = history.map(h => `<li>${h.datetime}：${h.score}てん</li>`).join('');
    }

    // ===== DOM操作関数群 =====
    function displayProblems(generatedProblems) {
      const wrap = document.querySelector('#problems-wrapper'); wrap.innerHTML = '';
      generatedProblems.forEach((p, i) => {
        const row = document.createElement('div'); row.className = 'problem';
        const num = document.createElement('div'); num.className = 'problem-number'; num.textContent = (i + 1) + '.';
        const eq = document.createElement('div'); eq.className = 'problem-equation';
        
        const inp = document.createElement('input'); inp.type = 'number'; inp.id = `ans-${i}`;

        // ★★★【アップグレード部分】★★★
        // configのdisplayTextに "__INPUT__" があれば、その場所に入力欄を埋め込む
        if (p.displayText && p.displayText.includes('__INPUT__')) {
            // ★変更点: inp.outerHTML を span タグで囲む
            const inputHtml = `<span>${inp.outerHTML}</span>`;
            eq.innerHTML = p.displayText.replace('__INPUT__', inputHtml);
                } else {
            // なければ、これまで通り末尾に入力欄を追加
            eq.innerHTML = p.displayText || `<span>${p.a}</span><span>${p.op}</span><span>${p.b}</span>=`;
            eq.appendChild(inp);
        }

        const icon = document.createElement('span'); icon.id = `icon-${i}`; icon.className = 'result-icon';
        eq.appendChild(icon);
        row.append(num, eq); 
        wrap.appendChild(row);

        // イベントリスナーは、HTMLを挿入した後に要素を見つけて設定する
        const inputElement = document.getElementById(`ans-${i}`);
        if(inputElement) {
            inputElement.addEventListener('focus', () => scrollCenter(inputElement));
            inputElement.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const currentProblemIndex = i;
                let nextIndexToFocus = -1;
                if (incorrectIndices.length > 0) {
                  const currentIndexInIncorrect = incorrectIndices.indexOf(currentProblemIndex);
                  if (currentIndexInIncorrect > -1 && currentIndexInIncorrect < incorrectIndices.length - 1) {
                    nextIndexToFocus = incorrectIndices[currentIndexInIncorrect + 1];
                  }
                } else if (currentProblemIndex < problems.length - 1) {
                    nextIndexToFocus = currentProblemIndex + 1;
                }
                if (nextIndexToFocus !== -1) document.querySelector(`#ans-${nextIndexToFocus}`).focus();
                else document.querySelector('#check-answers').focus();
              }
            });
        }
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
      document.querySelector('#check-answers').disabled = true;
      let newIncorrectIndices = []; let correctCount = 0;
      const wrongColor = getComputedStyle(document.documentElement).getPropertyValue('--c-feedback-wrong').trim();
      const defaultBorderColor = getComputedStyle(document.documentElement).getPropertyValue('--c-primary-light').trim();
      
      problems.forEach((p, i) => {
        const inputField = document.querySelector(`#ans-${i}`);
        if(inputField.disabled) { correctCount++; return; }
        const user = inputField.value; const ans = p.answer;
        const icon = document.querySelector(`#icon-${i}`);
        icon.textContent = ''; icon.classList.remove('correct', 'wrong');
        inputField.style.borderColor = defaultBorderColor;
        if (user !== '' && +user === ans) {
          icon.textContent = '○'; icon.classList.add('correct'); inputField.disabled = true; correctCount++;
        } else {
          icon.textContent = '×'; icon.classList.add('wrong'); inputField.disabled = false; inputField.value = ''; inputField.style.borderColor = wrongColor;
          newIncorrectIndices.push(i);
        }
      });
      incorrectIndices = newIncorrectIndices;

      if (incorrectIndices.length === 0) { // 全問正解
        const NUM_QUESTIONS = problems.length;
        const TIME_LIMIT = NUM_QUESTIONS * (config.timeLimitPerQuestion || 5);
        const pointsPerQuestion = config.pointsPerQuestion || 10;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const baseScore = correctCount * pointsPerQuestion;
        let timeBonus = 0;
        if (elapsed < TIME_LIMIT) timeBonus = Math.floor(50 * ((TIME_LIMIT - elapsed) / TIME_LIMIT));
        let score = baseScore + timeBonus;

        let message = '🎉 全問正解！おめでとう！ 🎉';
        if (score > highScore) {
            message = '🏆 ハイスコア達成！すごい！ 🏆'; highScore = score;
            startConfettiLoop();
        }

        document.querySelector('#result').innerHTML = `${message}<br>スコア: <strong>${score}点</strong> (タイム: ${elapsed} 秒)`;
        
        let starsHtml = '―'; const s = config.starThresholds;
        if (s) {
            if      (score >= s.star5) starsHtml = `<span class="stars-rainbow status-stars">★★★★★</span>`;
            else if (score >= s.star4) starsHtml = `<span class="stars-diamond status-stars">★★★★☆</span>`;
            else if (score >= s.star3) starsHtml = `<span class="stars-gold status-stars">★★★☆☆</span>`;
            else if (score >= s.star2) starsHtml = `<span class="stars-silver status-stars">★★☆☆☆</span>`;
            else if (score >= s.star1) starsHtml = `<span class="stars-bronze status-stars">★☆☆☆☆</span>`;
            else if (score >= s.star_circle) starsHtml = `<span class="stars-circle status-stars">○</span>`;
        }
        
        overallStatusStars = starsHtml;
        document.querySelector('#overallStars').innerHTML = overallStatusStars;
        if (starsHtml !== '―') document.querySelector('#overallStars').classList.add('sparkle-animation');
        
        totalClearCount++; monthlyCount++; dailyCount++;
        saveData();
        saveHistoryEntry(score);
        updateDisplay();
        
        const retryBtn = document.querySelector('#retry'); retryBtn.focus(); scrollCenter(retryBtn);
      } else { // まだ間違いがある
        document.querySelector('#result').innerHTML = 'おしい！まちがいを直して、もういちど「まるつけ」しよう！';
        document.querySelector('#result').style.color = wrongColor;
        document.querySelector('#check-answers').disabled = false;
        document.querySelector(`#ans-${incorrectIndices[0]}`).focus();
      }
    }

    function startConfettiLoop() {
        if (confettiIntervalId) clearInterval(confettiIntervalId);
        confettiIntervalId = setInterval(() => confetti({ particleCount: 7, startVelocity: 10, spread: 360, origin: { x: Math.random(), y: Math.random() - 0.2 }, ticks: 400, gravity: 0.3, scalar: 0.8, colors: ['#FFC700','#FF0000','#FFFFFF','#00FF00','#00BFFF','#FF69B4','#BA55D3'] }), 200);
    }

    function stopConfetti() {
        if (confettiIntervalId) clearInterval(confettiIntervalId);
        confettiIntervalId = null;
        if (typeof confetti !== 'undefined') confetti.reset();
    }

    function retry() {
      stopConfetti();
      startTime = Date.now();
      document.querySelector('#check-answers').disabled = false;
      incorrectIndices = [];
      problems = config.problemGenerator();
      displayProblems(problems);
      document.querySelector('#result').textContent = '';
      document.querySelector('#result').style.color = getComputedStyle(document.documentElement).getPropertyValue('--c-primary');
      const overallStarsSpan = document.querySelector('#overallStars');
      overallStarsSpan.classList.remove('sparkle-animation');
      if (overallStatusStars === '―') overallStarsSpan.innerHTML = '―';
      document.querySelector('#ans-0').focus();
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
    
    // ===== アプリケーションの初期化と実行 =====
    (function main() {
        applyThemeColors(config.themeColors);
        document.title = config.mainTitle || config.title;
        document.getElementById('main-title').textContent = config.mainTitle || 'わくわく算数ドリル';
        document.getElementById('sub-title').textContent = config.title;
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
