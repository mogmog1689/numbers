'use strict';
const APP_TITLE = '日本語 数の単位 おぼえーる';
const APP_VER = 'v10';

/* ---------- データ ---------- */
// [名称, 読み, 10の指数]
const BIG = [
  ['一','いち',0],['十','じゅう',1],['百','ひゃく',2],['千','せん',3],
  ['万','まん',4],['億','おく',8],['兆','ちょう',12],['京','けい',16],
  ['垓','がい',20],['𥝱','じょ',24],['穣','じょう',28],['溝','こう',32],
  ['澗','かん',36],['正','せい',40],['載','さい',44],['極','ごく',48],
  ['恒河沙','ごうがしゃ',52],['阿僧祇','あそうぎ',56],['那由他','なゆた',60],
  ['不可思議','ふかしぎ',64],['無量大数','むりょうたいすう',68]
];
// 割を10^-1とする並び（分=10^-2）
const SMALL = [
  ['割','わり',-1],['分','ぶ',-2],['厘','りん',-3],['毛','もう',-4],
  ['糸','し',-5],['忽','こつ',-6],['微','び',-7],['繊','せん',-8],
  ['沙','しゃ',-9],['塵','じん',-10],['埃','あい',-11],['渺','びょう',-12],
  ['漠','ばく',-13],['模糊','もこ',-14],['逡巡','しゅんじゅん',-15],
  ['須臾','しゅゆ',-16],['瞬息','しゅんそく',-17],['弾指','だんし',-18],
  ['刹那','せつな',-19],['六徳','りっとく',-20],['虚空','こくう',-21],
  ['清浄','しょうじょう',-22],['阿頼耶','あらや',-23],['阿摩羅','あまら',-24],
  ['涅槃寂静','ねはんじゃくじょう',-25]
];
// 分を10^-1の先頭とする並び（割は含めない）
const SMALL_B = SMALL.slice(1).map(it => [it[0], it[1], it[2] + 1]);

const SETS = {
  big:    { label: '大きい数', sub: '一 〜 無量大数', dir: '次に大きい', items: BIG },
  small:  { label: '小さい数（割から）', sub: '割 〜 涅槃寂静（割=10⁻¹、分=10⁻²）', dir: '次に小さい', items: SMALL },
  smallB: { label: '小さい数（分から）', sub: '分 〜 涅槃寂静（分=10⁻¹、割は含めない）', dir: '次に小さい', items: SMALL_B }
};
const cls = set => (set === 'big' ? 'big' : 'small');
const realSet = set => (set === 'small' && rec.smallMode === 'bun' ? 'smallB' : set);
const QUIZ_LEN = 10;

/* ---------- 記録の保存 ---------- */
const KEY = 'kazu-record-v1';
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.items) return d; } catch (e) {}
  return { sessions: [], items: {} };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {} }
let rec = load();
const stat = (set, i) => rec.items[set + ':' + i] || (rec.items[set + ':' + i] = { ok: 0, ng: 0, pending: false, last: '' });
const pendingIdx = set => SETS[set].items.map((_, i) => i).filter(i => (rec.items[set + ':' + i] || {}).pending);
const pendingAll = () => Object.keys(SETS).reduce((n, s) => n + pendingIdx(s).length, 0);

/* ---------- 共通 ---------- */
const $ = s => document.querySelector(s);
const app = $('#app'), titleEl = $('#title'), backBtn = $('#back'), bar = $('#bar');
let backFn = null;
const GLYPH = { '𥝱': 'icons/kanji-jo.png' };  // 端末のフォントに無い字は画像で表示
const glyph = n => GLYPH[n] ? `<img class="gl" src="${GLYPH[n]}" alt="${n}">` : n;
const ruby = it => `<ruby>${glyph(it[0])}<rt>${it[1]}</rt></ruby>`;
const exHtml = (name, c = 'ex') => {
  try {
    const n = (typeof NOTES !== 'undefined') && NOTES[name]; if (!n) return '';
    if (!Array.isArray(n[1])) return `<div class="${c}">${n[0]}</div>`;   // 旧形式のnotes.jsでも止まらないように
    const links = n[1].slice().sort((a, b) => SRC_ORDER.indexOf(a[0]) - SRC_ORDER.indexOf(b[0]))
      .map(([k, t]) => `<a href="${srcUrl(k, t)}" target="_blank" rel="noopener">${SRC[k]}</a>`).join('・');
    return `<div class="${c}">${n[0]}<small>出典：${links}</small></div>`;
  } catch (err) { return ''; }
};
const pow = n => `10<sup>${n}</sup>`;
const now = () => {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
function screen(title, html, back, set) {
  titleEl.textContent = title;
  bar.className = set && cls(set) === 'small' ? 'small' : '';
  backFn = back; backBtn.hidden = !back;
  app.innerHTML = html; window.scrollTo(0, 0);
  app.querySelectorAll('a').forEach(a => a.addEventListener('click', e => e.stopPropagation()));
}
backBtn.onclick = () => backFn && backFn();
document.title = APP_TITLE;

/* ---------- ホーム ---------- */
function home() {
  Q = null;
  const sm = realSet('small'), S = SETS[sm];
  const first = S.items[0], last = S.items[S.items.length - 1];
  screen(APP_TITLE, `
    <button class="hero big" data-s="big"><b>大きい数</b><span>一 〜 無量大数（10<sup>0</sup> 〜 10<sup>68</sup>）</span></button>
    <button class="hero small" data-s="small"><b>小さい数</b><span>${first[0]} 〜 ${last[0]}（10<sup>-1</sup> 〜 10<sup>${last[2]}</sup>）</span></button>
    <button class="btn" id="rec">学習の記録<small>${rec.sessions.length}回分のクイズ ／ 要復習 ${pendingAll()}件</small></button>
    <p class="hint">大きい数は一・十・百・千のあと、万以降は一万進（万・億・兆…）です。小さい数は「割から」「分から」を小さい数のメニューで切り替えられます。</p>
    <div class="cite" id="cite">
      <h2>引用元</h2>
      <p>各単位の解説は、次の資料を ①→②→③ の優先順位で参照して要約したものです。各解説の下の「出典」から、参照したページを開けます。</p>
      <ul>
        <li>① <a href="https://jodoshuzensho.jp/daijiten/index.php/" target="_blank" rel="noopener">新纂浄土宗大辞典（WEB版）</a></li>
        <li>② <a href="https://kotobank.jp/" target="_blank" rel="noopener">コトバンク</a>（デジタル大辞泉、日本国語大辞典など）</li>
        <li>③ <a href="https://ja.wikipedia.org/wiki/命数法" target="_blank" rel="noopener">Wikipedia</a>（命数法ほか各単位の項目）</li>
      </ul>
      <p>読み方の参考： <a href="https://www.benricho.org/kanji/kansushi.html" target="_blank" rel="noopener">漢数詞（便利蝶）</a></p>
    </div>
    <p class="ver">${APP_VER}</p>
  `, null);
  app.querySelectorAll('.hero').forEach(b => b.onclick = () => menu(b.dataset.s));
  $('#rec').onclick = records;
}

/* ---------- セット別メニュー ---------- */
function menu(set0) {
  const set = realSet(set0), S = SETS[set], np = pendingIdx(set).length, seq = rec.order !== 'random';
  const isSmall = set0 === 'small';
  const bun = rec.smallMode === 'bun';
  screen(S.label, `
    <p class="hint">${S.sub}（${S.items.length}個）</p>
    ${isSmall ? `<div class="chips">
      <button class="chip ${bun ? '' : 'on'}" data-m="wari">割から始める</button>
      <button class="chip ${bun ? 'on' : ''}" data-m="bun">分から始める</button>
    </div>` : ''}
    <div class="chips">
      <button class="chip ${seq ? 'on' : ''}" data-o="seq">順番に出題</button>
      <button class="chip ${seq ? '' : 'on'}" data-o="random">ランダム出題</button>
    </div>
    <button class="btn" id="list"><b>一覧表</b><small>名称・読み・10の累乗・解説。隠して確認もできます</small></button>
    <button class="btn primary" id="quiz"><b>4択クイズ</b><small>「○○の${S.dir}単位は？」${seq ? '全' + (S.items.length - 1) + '問を順番に' : QUIZ_LEN + '問をランダムに'}</small></button>
    <button class="btn" id="rev" ${np ? '' : 'disabled'}><b>間違いだけ復習</b><small>${np ? `要復習 ${np}件` : '復習する項目はありません'}</small></button>
  `, home, set);
  app.querySelectorAll('[data-o]').forEach(c => c.onclick = () => { rec.order = c.dataset.o; save(); menu(set0); });
  app.querySelectorAll('[data-m]').forEach(c => c.onclick = () => { rec.smallMode = c.dataset.m; save(); menu(set0); });
  $('#list').onclick = () => list(set0);
  $('#quiz').onclick = () => startQuiz(set0, 'quiz');
  $('#rev').onclick = () => startQuiz(set0, 'review');
}

/* ---------- 一覧表 ---------- */
function list(set0) {
  const set = realSet(set0), S = SETS[set];
  const rows = S.items.map((it, i) => `
    <div class="row"><span class="no">${i + 1}</span>
    <span class="nm">${ruby(it)}</span><span class="pw">${pow(it[2])}</span>
    ${exHtml(it[0])}</div>`).join('');
  screen(S.label + ' 一覧', `
    <div class="chips">
      <button class="chip" data-c="hide-name">名称を隠す</button>
      <button class="chip" data-c="hide-rt">読みを隠す</button>
      <button class="chip" data-c="hide-pow">累乗を隠す</button>
      <button class="chip" data-c="hide-ex">解説を隠す</button>
    </div>
    <p class="hint">隠した状態で行をタップすると、その行だけ表示されます。</p>
    <div id="rows" class="${cls(set)}">${rows}</div>
  `, () => menu(set0), set);
  const rowsEl = $('#rows');
  app.querySelectorAll('.chip').forEach(c => c.onclick = () => {
    c.classList.toggle('on'); rowsEl.classList.toggle(c.dataset.c);
    rowsEl.querySelectorAll('.reveal').forEach(r => r.classList.remove('reveal'));
  });
  rowsEl.querySelectorAll('.row').forEach(r => r.onclick = () => r.classList.toggle('reveal'));
}

/* ---------- クイズ（選ぶと自動で次の問題へ） ---------- */
let Q = null;
function startQuiz(set0, mode) {
  const set = realSet(set0), S = SETS[set], last = S.items.length - 1;
  const pool = mode === 'review' ? pendingIdx(set).filter(i => i < last)
                                 : S.items.map((_, i) => i).filter(i => i < last);
  if (!pool.length) return menu(set0);
  const qs = rec.order === 'random' ? shuffle(pool).slice(0, QUIZ_LEN) : pool.slice().sort((a, b) => a - b);
  Q = { set, set0, mode, qs, n: 0, score: 0, misses: [], prev: null, token: 0 };
  question();
}
function prevHtml(title) {
  const p = Q.prev; if (!p) return '';
  const S = SETS[Q.set], q = S.items[p.qi], a = S.items[p.qi + 1];
  return `<div class="fb ${p.ok ? 'ok' : 'ng'}"><div class="fbt">${title}：${p.ok ? '正解' : '不正解'}</div>
    ${ruby(q)}（${pow(q[2])}）→ ${ruby(a)}（${pow(a[2])}）
    ${exHtml(a[0], 'ex2')}</div>`;
}
function question() {
  const S = SETS[Q.set], qi = Q.qs[Q.n], ans = qi + 1;
  const others = shuffle(S.items.map((_, i) => i).filter(i => i !== qi && i !== ans)).slice(0, 3);
  const opts = shuffle([ans, ...others]);
  Q.cur = { qi, ans, answered: false };
  const q = S.items[qi];
  screen((Q.mode === 'review' ? '復習 ' : 'クイズ ') + `${Q.n + 1}/${Q.qs.length}`, `
    <div class="prog"><i style="width:${Q.n / Q.qs.length * 100}%"></i></div>
    <div class="q"><div class="meta">${S.label}</div>
      <div class="word">${ruby(q)}</div>
      <div class="ask">の<b>${S.dir}単位</b>は？</div></div>
    <div id="opts">${opts.map(i => `<button class="btn opt" data-i="${i}">${ruby(S.items[i])}</button>`).join('')}</div>
    <div id="prev">${prevHtml('前の問題')}</div>
  `, () => { if (confirm('クイズを中断しますか？（この回の結果は記録されません）')) { Q.token++; menu(Q.set0); } }, Q.set);
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(+b.dataset.i));
}
function answer(i) {
  const c = Q.cur; if (c.answered) return; c.answered = true;
  const ok = i === c.ans, st = stat(Q.set, c.qi);
  st.last = now();
  if (ok) { Q.score++; st.ok++; st.pending = false; }
  else { st.ng++; st.pending = true; Q.misses.push(c.qi); }
  save();
  Q.prev = { qi: c.qi, ok };
  Q.token++;
  if (Q.n + 1 >= Q.qs.length) finish(); else { Q.n++; question(); }
}
function finish() {
  const S = SETS[Q.set];
  rec.sessions.unshift({ t: now(), set: Q.set, mode: Q.mode, total: Q.qs.length, score: Q.score, misses: Q.misses });
  rec.sessions = rec.sessions.slice(0, 200); save();
  const set = Q.set, set0 = Q.set0, mode = Q.mode, np = pendingIdx(set).length;
  screen('結果', `
    <div class="q"><div class="meta">${S.label}（${mode === 'review' ? '復習' : 'クイズ'}）</div>
      <div class="score">${Q.score} / ${Q.qs.length}</div></div>
    ${Q.misses.length ? `<div class="sec">間違えた問題</div>` + Q.misses.map(i =>
      `<div class="log">${ruby(S.items[i])} → ${ruby(S.items[i + 1])}　<span class="d">${pow(S.items[i + 1][2])}</span>${exHtml(S.items[i + 1][0])}</div>`).join('')
      : `<p class="center">全問正解です！</p>`}
    <div class="sec">最後の問題の解説</div>
    ${prevHtml('最終問')}
    <button class="btn primary c" id="again"><b>もう一度</b></button>
    <button class="btn c" id="rev" ${np ? '' : 'disabled'}><b>間違いだけ復習（${np}件）</b></button>
    <button class="btn c" id="m"><b>メニューへ</b></button>
  `, () => menu(set0), set);
  $('#again').onclick = () => startQuiz(set0, mode === 'review' && np ? 'review' : 'quiz');
  $('#rev').onclick = () => startQuiz(set0, 'review');
  $('#m').onclick = () => menu(set0);
}

/* ---------- 学習の記録 ---------- */
function records() {
  const miss = [];
  for (const set of Object.keys(SETS)) SETS[set].items.forEach((it, i) => {
    const s = rec.items[set + ':' + i]; if (s && s.ng) miss.push({ set, it, s });
  });
  miss.sort((a, b) => b.s.ng - a.s.ng);
  screen('学習の記録', `
    <div class="sec">よく間違える単位（回数順）</div>
    ${miss.length ? miss.slice(0, 30).map(m => `<div class="log"><span class="tag ${cls(m.set)}">${SETS[m.set].label}</span>
      <b>${ruby(m.it)}</b>（${pow(m.it[2])}）<br>
      <span class="d">不正解 ${m.s.ng}回 ／ 正解 ${m.s.ok}回 ／ 最終 ${m.s.last}${m.s.pending ? ' ／ <span class="danger">要復習</span>' : ''}</span></div>`).join('')
      : '<div class="empty">まだ間違いはありません</div>'}
    <div class="sec">クイズの履歴</div>
    ${rec.sessions.length ? rec.sessions.slice(0, 50).map(s => `<div class="log">
      <span class="tag ${cls(s.set)}">${SETS[s.set].label}</span><b>${s.score}/${s.total}</b>
      <span class="d">${s.mode === 'review' ? '復習' : 'クイズ'} ／ ${s.t}</span>
      ${s.misses.length ? '<br>' + s.misses.map(i => `<span class="miss">${glyph(SETS[s.set].items[i][0])}</span>`).join('') : ''}</div>`).join('')
      : '<div class="empty">まだ履歴がありません</div>'}
    <button class="btn c" id="reset" style="margin-top:16px"><b class="danger">記録をすべて削除</b></button>
  `, home);
  $('#reset').onclick = () => {
    if (confirm('学習の記録をすべて削除します。よろしいですか？')) {
      const keep = { order: rec.order, smallMode: rec.smallMode };
      rec = Object.assign({ sessions: [], items: {} }, keep); save(); records();
    }
  };
}

/* ---------- 起動 ---------- */
home();
if ('serviceWorker' in navigator) {
  // 新しい版が有効になったら読み込み直して、常に最新の画面にする
  const had = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had || reloaded) return;
    reloaded = true; location.reload();
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {}));
}
