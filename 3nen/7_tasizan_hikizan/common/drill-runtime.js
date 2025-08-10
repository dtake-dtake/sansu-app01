import { wireGridNavigation } from './keyboard-nav.js';

/* ===== テーマ（ドリルごと固定） ===== */
const PALETTES = [
  // blue
  { bg:'#eaf7ff', panel:'#ffffff', border:'#cbd5e1', text:'#1f2937', accent:'#2563eb', accentWeak:'#93c5fd', btn:'#2563eb', btnText:'#fff' },
  // green
  { bg:'#e8f5e9', panel:'#ffffff', border:'#c8e6c9', text:'#1f2937', accent:'#2e7d32', accentWeak:'#a5d6a7', btn:'#2e7d32', btnText:'#fff' },
  // orange
  { bg:'#fff7ed', panel:'#ffffff', border:'#ffddc1', text:'#1f2937', accent:'#f97316', accentWeak:'#fed7aa', btn:'#f97316', btnText:'#fff' },
  // purple
  { bg:'#f5f3ff', panel:'#ffffff', border:'#ddd6fe', text:'#1f2937', accent:'#7c3aed', accentWeak:'#c4b5fd', btn:'#7c3aed', btnText:'#fff' },
  // teal
  { bg:'#e0f2f1', panel:'#ffffff', border:'#b2dfdb', text:'#1f2937', accent:'#009688', accentWeak:'#80cbc4', btn:'#009688', btnText:'#fff' },
  // pink（サンプル寄せ）
  { bg:'#f7e0f0', panel:'#ffffff', border:'#f3b7dd', text:'#3d1d2b', accent:'#e51e9d', accentWeak:'#f7b1e4', btn:'#f542c5', btnText:'#fff' },
];

function hashString(str){ let h=0; for (let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))|0; return Math.abs(h); }
function applyTheme(p){
  const r=document.documentElement;
  r.style.setProperty('--bg',p.bg); r.style.setProperty('--panel',p.panel);
  r.style.setProperty('--border',p.border); r.style.setProperty('--text',p.text);
  r.style.setProperty('--accent',p.accent); r.style.setProperty('--accent-weak',p.accentWeak);
  r.style.setProperty('--btn',p.btn); r.style.setProperty('--btnText',p.btnText);
  r.style.setProperty('--ok','#e8fde3'); r.style.setProperty('--ok-border','#a5d6a7'); r.style.setProperty('--ng','#ffe0e0');
}
function paletteIndexForDrill(drillId){
  const sp=new URL(location.href).searchParams; const force=sp.get('theme');
  if(force!==null){ const n=Number(force); if(!Number.isNaN(n)&&n>=0&&n<PALETTES.length) return n; }
  return hashString(drillId)%PALETTES.length; // ドリルごと固定
}

/* ===== ランタイム ===== */
export function mountDrill({ drillId, timeLimitSec=null, buildProblemSet, renderProblems }){
  const ns = `${drillId}-v1_`;
  const KEY_HS = ns+'highScore';
  const KEY_CLEAR = ns+'clearCount';
  const KEY_DAILY = ns+'daily-';
  const KEY_MONTH = ns+'month-';

  applyTheme(PALETTES[paletteIndexForDrill(drillId)]);

  const startArea = document.getElementById('start-area');
  const problemsWrapper = document.getElementById('problems-wrapper');
  const resultDiv = document.getElementById('result');
  const checkBtn = document.getElementById('check-answers');
  const retryBtn = document.getElementById('retry');
  const resetBtn = document.getElementById('reset-highscore');
  const highEl = document.getElementById('highScoreValue');
  const dailyEl = document.getElementById('dailyCountValue');
  const monthlyEl = document.getElementById('monthlyCountValue');
  const clearEl = document.getElementById('clearCountValue');
  const statusEl = document.getElementById('overallStars');

  let startTime=0, timerId=null;

  const now=()=>new Date();
  const todayKey=()=>KEY_DAILY+now().toISOString().slice(0,10);
  const monthKey=()=>KEY_MONTH+now().toISOString().slice(0,7);
  const loadInt=k=>+(localStorage.getItem(k)||0);
  const putInt=(k,v)=>localStorage.setItem(k,String(v));

  function updateStatsView(){
    if(highEl) highEl.textContent = loadInt(KEY_HS);
    if(clearEl) clearEl.textContent = loadInt(KEY_CLEAR);
    if(dailyEl) dailyEl.textContent = loadInt(todayKey());
    if(monthlyEl) monthlyEl.textContent = loadInt(monthKey());
  }
  function setStats({score, cleared, stars}){
    if(typeof score==='number' && score>loadInt(KEY_HS)) putInt(KEY_HS, score);
    if(cleared){
      putInt(KEY_CLEAR, loadInt(KEY_CLEAR)+1);
      putInt(todayKey(), loadInt(todayKey())+1);
      putInt(monthKey(), loadInt(monthKey())+1);
    }
    if(statusEl && stars) statusEl.textContent = stars;
    updateStatsView();
  }
  function scoreToStars(score){
    if(score>=141) return '★★★';
    if(score>=121) return '★★';
    if(score>=101) return '★';
    if(score>=100) return '○';
    return '―';
  }

  // ハイスコア行の右に小さなリセットを移動（HTML変更なしで実現）
  (function relocateReset(){
    if(!resetBtn || !highEl) return;
    const line = highEl.parentElement;        // 「ハイスコア：○○ てん」のdiv
    if(!line) return;
    resetBtn.classList.add('inline-reset');
    line.appendChild(resetBtn);               // 右側へ移動
  })();

  function start(){
    if(startArea) startArea.style.display='none';
    if(problemsWrapper){ problemsWrapper.innerHTML=''; problemsWrapper.style.display='block'; }
    if(resultDiv){ resultDiv.textContent=''; resultDiv.style.color=''; }
    if(checkBtn) checkBtn.disabled=false;
    if(retryBtn) retryBtn.disabled=true;

    const problems = (typeof buildProblemSet==='function') ? buildProblemSet() : [];
    if(typeof renderProblems==='function') renderProblems(problemsWrapper, problems);

    problemsWrapper?.querySelectorAll('input[data-correct]').forEach(inp=>{
      inp.classList.add('needs-answer');
      inp.addEventListener('focus', ()=>inp.select());
    });
    wireGridNavigation(problemsWrapper || document);

    startTime=Date.now();
    if(timeLimitSec){
      if(timerId) clearInterval(timerId);
      timerId=setInterval(()=>{
        const elapsed=Math.floor((Date.now()-startTime)/1000);
        if(elapsed>=timeLimitSec){ clearInterval(timerId); check(); }
      },250);
    }
    problemsWrapper?.querySelector('input.needs-answer')?.focus();
  }

  function computeScore(inputs, elapsedSec){
    const base=100;
    const tl=timeLimitSec ?? (inputs.length*45);
    const bonus = Math.max(0, Math.floor((tl - elapsedSec) * 50 / tl));
    return base + bonus;
  }

  function check(){
    const inputs=[...(problemsWrapper?.querySelectorAll('input[data-correct]') ?? [])];
    if(!inputs.length) return;

    let allCorrect=true;
    for(const inp of inputs){
      inp.classList.remove('correct','incorrect');
      const expected=(inp.dataset.correct ?? '').toString().trim();
      const emptyOk = inp.dataset.emptyOk === 'true';
      const value=(inp.value ?? '').toString().trim();
      const ok=(expected==='' && emptyOk && value==='') || (expected!=='' && value===expected);
      inp.classList.add(ok?'correct':'incorrect');
      inp.disabled=ok;
      if(!ok) allCorrect=false;
    }

    if(allCorrect){
      if(checkBtn) checkBtn.disabled=true;
      if(retryBtn) retryBtn.disabled=false;
      const elapsed=(Date.now()-startTime)/1000;
      const score=computeScore(inputs, elapsed);
      const stars=scoreToStars(score);
      if(resultDiv) resultDiv.innerHTML=`スコア: <strong>${score}点</strong><br>タイム: ${elapsed.toFixed(1)} 秒`;
      setStats({score, cleared:true, stars});
      retryBtn?.focus();
    }else{
      if(resultDiv){ resultDiv.innerHTML='❌ まちがいがあります。<br>赤いところを直そう！'; resultDiv.style.color='red'; }
      problemsWrapper?.querySelector('input.incorrect')?.focus();
    }
  }

  checkBtn?.addEventListener('click', check);
  retryBtn?.addEventListener('click', start);
  resetBtn?.addEventListener('click', ()=>{
    if(confirm('ハイスコアをリセットしますか？')){
      localStorage.removeItem(KEY_HS);
      updateStatsView();
    }
  });
  document.getElementById('start-btn')?.addEventListener('click', start);
  document.addEventListener('keydown', (e)=>{
    const startShown = startArea && getComputedStyle(startArea).display !== 'none';
    if(startShown && e.key==='Enter'){ e.preventDefault(); start(); }
  });

  updateStatsView();
}
