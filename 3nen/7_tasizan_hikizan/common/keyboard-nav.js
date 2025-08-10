// グリッド用の上下左右＆Enter移動。
// data-row / data-col を持つ input にだけ効くようにして、
// 通常の縦並び問題は邪魔しない（↑↓で数値が変わる問題を避ける）。
export function wireGridNavigation(root){
  root.addEventListener('keydown', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;

    // グリッド認識：data-row / data-col がある要素のみ
    const hasRow = el.hasAttribute('data-row');
    const hasCol = el.hasAttribute('data-col');
    if (!hasRow || !hasCol) return;

    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    const q = (r,c) => root.querySelector(`input[data-row="${r}"][data-col="${c}"]`);

    // 既定の↑↓で数値が増減する挙動を抑止
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.key)) {
      e.preventDefault();
    }

    let next = null;
    switch(e.key){
      case 'ArrowUp':    next = q(row-1, col); break;
      case 'ArrowDown':  next = q(row+1, col); break;
      case 'ArrowLeft':  next = q(row, col+1); break;  // 右詰め想定なので左右逆
      case 'ArrowRight': next = q(row, col-1); break;
      case 'Enter': {
        // 同じテーブル内の .needs-answer の次へ
        const list = [...root.querySelectorAll('input.needs-answer')];
        const idx = list.indexOf(el);
        next = list[idx+1] ?? null;
        break;
      }
    }
    if (next) { next.focus(); next.select?.(); }
  });
}
