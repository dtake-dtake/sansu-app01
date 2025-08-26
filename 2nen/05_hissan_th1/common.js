// common.js — スコア/星/保存/紙吹雪をまとめた共通ユーティリティ
(function(global){
  const ls = window.localStorage;
  const toDigits = (n,len)=>n.toString().padStart(len,'0').split('').map(Number);

  function makeKeys(appId){
    return {
      HS: `${appId}:hs`,
      CLEAR: `${appId}:clear`,
      MONTHLY: (ym)=>`${appId}:monthlyClear-${ym}`,
      DAILY: (ymd)=>`${appId}:dailyClear-${ymd}`,
      HISTORY: `${appId}:history`,
      STATUS: `${appId}:status`
    };
  }

  function nowDT(){ return new Date().toLocaleString(); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function thisMonth(){ return new Date().toISOString().slice(0,7); }

  const defaultThresholds = { circle:100, star1:110, star2:120, star3:130, star4:140, star5:150 };

  const Common = {
    _appId:null, _keys:null, _startTime:0, _thresholds:defaultThresholds,
    _timeLimit:60, _confetti:true, _highScore:0,

    setup({ appId, starThresholds=defaultThresholds, timeLimitSec=60, confetti=true }){
      this._appId = appId;
      this._keys = makeKeys(appId);
      this._thresholds = Object.assign({}, defaultThresholds, starThresholds);
      this._timeLimit = timeLimitSec;
      this._confetti = confetti;

      // load and draw
      this._loadAndUpdateUI();

      // reset HS button
      const resetBtn = document.getElementById('reset-highscore');
      if (resetBtn){
        resetBtn.onclick = ()=>{
          if (!confirm('ハイスコアをリセットしますか？')) return;
          try{ ls.removeItem(this._keys.HS); ls.removeItem(this._keys.STATUS); }catch{}
          this._highScore = 0;
          this._updateDisplay({ starsHtml:'―' });
        };
      }
    },

    beginAttempt(){ this._startTime = Date.now(); },
    elapsedSec(){ return this._startTime ? ((Date.now()-this._startTime)/1000) : 0; },

    computeScore(elapsedSec, baseScore=100){
      const t = Math.max(0, Math.floor((this._timeLimit - elapsedSec) * 50 / this._timeLimit));
      return baseScore + t;
    },

    // 置き換え版：九九方式の★（★★★★★/★★★★☆/... ＋ 色クラス）
    buildStarsHtml(score){
      const th = this._thresholds;
      const fmt = (n, cls) => `<span class="${cls} status-stars">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span>`;
      if      (score >= th.star5) return fmt(5, 'stars-rainbow');
      else if (score >= th.star4) return fmt(4, 'stars-diamond');
      else if (score >= th.star3) return fmt(3, 'stars-gold');
      else if (score >= th.star2) return fmt(2, 'stars-silver');
      else if (score >= th.star1) return fmt(1, 'stars-bronze');
      else if (score >= th.circle) return `<span class="stars-circle status-stars">○</span>`;
      return '―';
    },

    saveRun(score, starsHtml){
      // high score
      const prev = +ls.getItem(this._keys.HS) || 0;
      const isNewHigh = score > prev;
      if (isNewHigh) ls.setItem(this._keys.HS, String(score));
      this._highScore = isNewHigh ? score : prev;

      // counters
      const dKey = this._keys.DAILY(today());
      const mKey = this._keys.MONTHLY(thisMonth());
      const total = (+ls.getItem(this._keys.CLEAR) || 0) + 1;
      const daily = (+ls.getItem(dKey) || 0) + 1;
      const monthly = (+ls.getItem(mKey) || 0) + 1;
      ls.setItem(this._keys.CLEAR, String(total));
      ls.setItem(dKey, String(daily));
      ls.setItem(mKey, String(monthly));

      // status（星HTMLを保存）
      ls.setItem(this._keys.STATUS, starsHtml);

      // history（最新10件）
      const hist = JSON.parse(ls.getItem(this._keys.HISTORY) || '[]');
      hist.unshift({ datetime: nowDT(), score });
      if (hist.length > 10) hist.pop();
      ls.setItem(this._keys.HISTORY, JSON.stringify(hist));

      // display
  // display
  this._updateDisplay({ starsHtml });
    // ★をキラッと（九九と同じ挙動）
    const os = document.getElementById('overallStars');
    if (os){
      os.classList.remove('sparkle-animation');
      if (starsHtml !== '―') os.classList.add('sparkle-animation');
    }

      // confetti
      if (isNewHigh && this._confetti && typeof window.confetti === 'function'){
        this._fireConfetti();
      }
      return { isNewHigh };
    },

    showResultOK({ score, elapsedSec, starsHtml, isNewHigh }){
      const el = document.getElementById('result');
      if (el){
        el.style.color = ''; // 直前の赤を戻す
        const headline = isNewHigh ? '🏆 ハイスコア達成！すごい！ 🏆' : '🎉 全問正解！おめでとう！ 🎉';
        el.innerHTML = `${headline}<br>スコア: <strong>${score}点</strong> (タイム: ${elapsedSec.toFixed(1)} 秒)`;
      }
      const checkBtn = document.getElementById('check-answers');
      const retryBtn = document.getElementById('retry');
      if (checkBtn) checkBtn.disabled = true;
      if (retryBtn){ retryBtn.disabled = false; retryBtn.focus(); }
    },
    showResultNG(){
      const el = document.getElementById('result');
      if (el){ el.style.color='red'; el.innerHTML='❌ まちがいがあります。赤いところを直そう！'; }
      const checkBtn = document.getElementById('check-answers');
      if (checkBtn) checkBtn.disabled = false;
    },

    _fireConfetti(){
      const duration = 2000; const end = Date.now() + duration;
      (function frame(){
        window.confetti({ particleCount: 7, angle: 60, spread: 70, origin: { x: 0 } });
        window.confetti({ particleCount: 7, angle: 120, spread: 70, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      window.confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    },

    resetResultArea(){
      const el = document.getElementById('result');
      if (el){ el.style.color=''; el.textContent=''; }
      const checkBtn = document.getElementById('check-answers');
      const retryBtn = document.getElementById('retry');
      if (checkBtn) checkBtn.disabled = false;
      if (retryBtn) retryBtn.disabled = true;
    },

    _loadAndUpdateUI(){
      this._highScore = +ls.getItem(this._keys.HS) || 0;
      this._updateDisplay({ starsHtml: ls.getItem(this._keys.STATUS) || '―' });
    },

    _updateDisplay({ starsHtml }){
      const total = +ls.getItem(this._keys.CLEAR) || 0;
      const daily = +ls.getItem(this._keys.DAILY(today())) || 0;
      const monthly = +ls.getItem(this._keys.MONTHLY(thisMonth())) || 0;
      const hist = JSON.parse(ls.getItem(this._keys.HISTORY) || '[]');

      const setText=(id, val)=>{ const el=document.getElementById(id); if(el) el.textContent = String(val); };
      const setHTML=(id, val)=>{ const el=document.getElementById(id); if(el) el.innerHTML = val; };

      setText('highScoreValue', this._highScore);
      setText('dailyCountValue', daily);
      setText('monthlyCountValue', monthly);
      setText('clearCountValue', total);
      setHTML('overallStars', starsHtml);

      const list = document.getElementById('history-list');
      if (list){
        list.innerHTML = hist.map(h => `<li>${h.datetime}：${h.score}てん</li>`).join('');
      }
    }
  };

  global.Common = Common;
  global.toDigits = toDigits;
})(window);
