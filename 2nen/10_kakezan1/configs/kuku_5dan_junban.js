/**
 * 設定ファイル：五の段の九九（じゅんばん）
 * * このファイルは、「五の段（じゅんばん）」ドリルに固有の
 * 設定をすべて定義します。
 */

const quizConfig = {
  // 1. アプリの基本情報
  // ローカルストレージで他のアプリと区別するためのID
  appId: 'kuku-5dan-junban-v3', 
  
  // ブラウザのタブや画面に表示されるタイトル
  title: '五の段の九九（じゅんばん）',

  // 2. 問題を生成する専門の関数
  // この関数が、このドリルで出題される問題の配列を作成します
  problemGenerator: () => {
      const problems = [];
      for (let i = 1; i <= 9; i++) {
          // 問題の形式: { a: 数値1, b: 数値2, op: '×' or '＋'など, answer: 正答 }
          problems.push({ a: 5, b: i, op: '×', answer: 5 * i });
      }
      return problems;
  },

  // 3. スコアリング設定
  // 1問正解あたりの基本点
  pointsPerQuestion: 10,
  
  // タイムボーナス計算の基準となる、1問あたりの秒数
  timeLimitPerQuestion: 3,

  // 4. このアプリ固有の星の獲得基準（絶対スコア）
  // 9問 × 10点 = 90点が基本の満点。タイムボーナスでさらに高得点を狙う
  starThresholds: {
    star_circle: 90,  // 基本満点で○
    star1: 95,        // ★ (ブロンズ)
    star2: 105,       // ★★ (シルバー)
    star3: 115,       // ★★★ (ゴールド)
    star4: 125,       // ★★★★ (ダイヤモンド)
    star5: 135        // ★★★★★ (レインボー)
  },
  
  // 5. このアプリで使うテーマカラー
  // themes.jsで定義した変数名から、好きなテーマを選ぶ
  themeColors: theme_sky 
};

// ===================================================================
// ===== アプリケーションの実行 =====
// ===================================================================
// この設定オブジェクトを元に、共通エンジン（common.js）の
// `initializeDrillApp`関数を呼び出してアプリを開始します。
document.addEventListener('DOMContentLoaded', () => {
    initializeDrillApp(quizConfig); 
});