/* ================================================
   BRAIN TRAINING GAME PACK — script.js
   ================================================ */

/* ================================================
   GLOBAL STATE
   ================================================ */
const scores = { mem: null, rxn: null, pat: 0 };

/* ================================================
   SCREEN NAVIGATION
   ================================================ */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  updateHubStats();
}

function updateHubStats() {
  document.getElementById('hs-mem').textContent = scores.mem ? scores.mem + 's' : '—';
  document.getElementById('hs-rxn').textContent = scores.rxn ? scores.rxn + 'ms' : '—';
  document.getElementById('hs-pat').textContent = scores.pat ? 'Lvl ' + scores.pat : '—';
}

/* ================================================
   HUB — card click handlers
   ================================================ */
document.getElementById('card-mem').addEventListener('click', () => { show('mem'); startMem(); });
document.getElementById('card-rxn').addEventListener('click', () => { show('rxn'); initRxn(); });
document.getElementById('card-pat').addEventListener('click', () => { show('pat'); startPat(); });

document.getElementById('back-mem').addEventListener('click', () => show('hub'));
document.getElementById('back-rxn').addEventListener('click', () => show('hub'));
document.getElementById('back-pat').addEventListener('click', () => show('hub'));

/* ================================================
   MEMORY GAME
   ================================================ */
const EMOJIS = ['🦊','🐧','🍕','🎸','🚀','⭐','🌈','🍓'];

let memFlipped  = [];
let memMatched  = 0;
let memMoves    = 0;
let memTimer    = null;
let memSecs     = 0;
let memLock     = false;

function startMem() {
  // Reset state
  memFlipped = [];
  memMatched = 0;
  memMoves   = 0;
  memSecs    = 0;
  memLock    = false;
  clearInterval(memTimer);

  // Reset UI
  document.getElementById('mem-moves').textContent = '0';
  document.getElementById('mem-time').textContent  = '0s';
  document.getElementById('mem-pairs').textContent = '0/8';
  document.getElementById('mem-msg').textContent   = 'Find the matching pairs!';

  // Build deck
  const deck = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
  const grid = document.getElementById('mem-grid');
  grid.innerHTML = '';

  deck.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'mem-card';
    card.dataset.emoji = emoji;
    card.dataset.idx   = i;
    card.innerHTML = `
      <div class="mem-card-inner">
        <div class="mem-front"></div>
        <div class="mem-back">${emoji}</div>
      </div>`;
    card.addEventListener('click', () => flipCard(card));
    grid.appendChild(card);
  });

  // Start timer
  memTimer = setInterval(() => {
    memSecs++;
    document.getElementById('mem-time').textContent = memSecs + 's';
  }, 1000);
}

function flipCard(card) {
  if (memLock) return;
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;

  card.classList.add('flipped');
  memFlipped.push(card);

  if (memFlipped.length === 2) {
    memLock = true;
    memMoves++;
    document.getElementById('mem-moves').textContent = memMoves;

    const [a, b] = memFlipped;

    if (a.dataset.emoji === b.dataset.emoji) {
      // Match found
      a.classList.add('matched');
      b.classList.add('matched');
      memMatched++;
      document.getElementById('mem-pairs').textContent = memMatched + '/8';
      memFlipped = [];
      memLock    = false;

      if (memMatched === 8) {
        clearInterval(memTimer);
        if (!scores.mem || memSecs < scores.mem) scores.mem = memSecs;
        document.getElementById('mem-msg').textContent =
          `🎉 Done in ${memSecs}s & ${memMoves} moves!`;
      }
    } else {
      // No match — flip back after delay
      setTimeout(() => {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        memFlipped = [];
        memLock    = false;
      }, 900);
    }
  }
}

document.getElementById('mem-restart').addEventListener('click', startMem);

/* ================================================
   REACTION GAME
   ================================================ */
let rxnState   = 'idle';
let rxnTimer   = null;
let rxnStart   = 0;
let rxnRound   = 0;
let rxnResults = [];

function initRxn() {
  clearTimeout(rxnTimer);
  rxnState   = 'idle';
  rxnRound   = 0;
  rxnResults = [];

  const arena = document.getElementById('rxn-arena');
  arena.className = 'wait';
  arena.textContent = 'Tap to start';

  document.getElementById('rxn-stats').textContent  = '';
  document.getElementById('rxn-history').innerHTML  = '';
}

document.getElementById('rxn-arena').addEventListener('click', handleRxn);

function handleRxn() {
  const arena = document.getElementById('rxn-arena');

  if (rxnState === 'idle') {
    rxnState = 'waiting';
    arena.className   = 'ready';
    arena.textContent = 'Wait for green...';
    scheduleGo();

  } else if (rxnState === 'waiting') {
    // Clicked too early
    clearTimeout(rxnTimer);
    arena.className   = 'wait';
    arena.textContent = 'Too early! Tap to retry';
    rxnState = 'idle';
    addRxnChip('early');
    rxnResults.push(null);

    if (rxnResults.length >= 5) {
      showRxnResult();
    } else {
      setTimeout(() => {
        if (rxnResults.length < 5) {
          rxnState = 'idle';
          arena.textContent = 'Tap to continue';
        }
      }, 1000);
    }

  } else if (rxnState === 'go') {
    // Valid reaction
    const ms = Date.now() - rxnStart;
    clearTimeout(rxnTimer);
    rxnResults.push(ms);
    addRxnChip(ms);
    rxnRound++;

    if (rxnRound >= 5) {
      showRxnResult();
    } else {
      arena.className   = 'ready';
      arena.textContent = 'Wait for green...';
      rxnState = 'waiting';
      scheduleGo();
    }
  }
}

function scheduleGo() {
  const delay = 1500 + Math.random() * 2500;
  rxnTimer = setTimeout(() => {
    rxnState  = 'go';
    rxnStart  = Date.now();
    const arena = document.getElementById('rxn-arena');
    arena.className   = 'go';
    arena.textContent = 'TAP!';
  }, delay);
}

function addRxnChip(value) {
  const history = document.getElementById('rxn-history');
  const chip    = document.createElement('div');
  chip.className = 'rxn-chip';

  if (value === 'early') {
    chip.textContent = 'early';
    chip.style.borderColor = 'rgba(250,109,154,0.4)';
    chip.style.color       = 'var(--accent2)';
  } else {
    chip.textContent = value + 'ms';
    if (value < 200) chip.classList.add('best');
  }

  history.appendChild(chip);
}

function showRxnResult() {
  rxnState = 'done';
  const valid = rxnResults.filter(r => r !== null);
  const avg   = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
  const best  = valid.length ? Math.min(...valid) : null;

  if (best && (!scores.rxn || best < scores.rxn)) scores.rxn = best;

  const arena = document.getElementById('rxn-arena');
  arena.className   = 'result';
  arena.textContent = best ? `Best: ${best}ms` : 'Done!';

  let grade = '';
  let col   = 'var(--text2)';

  if (best) {
    if      (best < 150) { grade = 'Superhuman';    col = 'var(--accent3)'; }
    else if (best < 200) { grade = 'Excellent';     col = 'var(--accent)';  }
    else if (best < 250) { grade = 'Good';          col = 'var(--accent4)'; }
    else                 { grade = 'Keep training'; col = 'var(--accent2)'; }
  }

  document.getElementById('rxn-stats').innerHTML = avg
    ? `<span style="color:${col}">${grade}</span> · avg ${avg}ms · best ${best}ms`
    : 'Incomplete';
}

document.getElementById('rxn-restart').addEventListener('click', initRxn);

/* ================================================
   PATTERN RECOGNITION GAME
   ================================================ */
const PAT_EMOJIS = ['🔴','🟡','🟢','🔵','🟣','🟠'];
const PAT_COLS   = 3;
const PAT_SIZE   = 9;

let patSeq       = [];
let patPlayerSeq = [];
let patLevel     = 1;
let patCanClick  = false;

function buildPatGrid() {
  const grid = document.getElementById('pat-grid');
  grid.style.gridTemplateColumns = `repeat(${PAT_COLS}, 1fr)`;
  grid.innerHTML = '';

  for (let i = 0; i < PAT_SIZE; i++) {
    const cell = document.createElement('div');
    cell.className   = 'pat-cell';
    cell.textContent = PAT_EMOJIS[i % PAT_EMOJIS.length];
    cell.addEventListener('click', () => patClick(i, cell));
    grid.appendChild(cell);
  }
}

function startPat() {
  patLevel     = 1;
  patSeq       = [];
  patPlayerSeq = [];
  patCanClick  = false;

  document.getElementById('pat-lvl-num').textContent    = '1';
  document.getElementById('pat-prog-fill').style.width  = '0%';
  document.getElementById('pat-start-btn').disabled     = true;

  buildPatGrid();
  setTimeout(nextPatRound, 400);
}

function nextPatRound() {
  patPlayerSeq = [];
  patSeq.push(Math.floor(Math.random() * PAT_SIZE));
  document.getElementById('pat-msg').textContent = 'Watch the sequence...';
  patCanClick = false;
  playPatSeq(0);
}

function playPatSeq(i) {
  if (i >= patSeq.length) {
    setTimeout(() => {
      patCanClick = true;
      document.getElementById('pat-msg').textContent = 'Your turn! Repeat the sequence.';
    }, 400);
    return;
  }

  const cells = document.querySelectorAll('.pat-cell');

  setTimeout(() => {
    const cell = cells[patSeq[i]];
    cell.style.background = 'rgba(250,197,109,0.55)';
    cell.classList.add('lit');

    setTimeout(() => {
      cell.style.background = '';
      cell.classList.remove('lit');
      playPatSeq(i + 1);
    }, 500);
  }, i === 0 ? 300 : 0);
}

function patClick(idx, el) {
  if (!patCanClick) return;

  // Flash the clicked cell
  el.style.background = 'rgba(124,109,250,0.45)';
  el.classList.add('player-hit');
  setTimeout(() => {
    el.style.background = '';
    el.classList.remove('player-hit');
  }, 300);

  patPlayerSeq.push(idx);
  const pos = patPlayerSeq.length - 1;

  // Wrong tap
  if (patPlayerSeq[pos] !== patSeq[pos]) {
    patWrong(el);
    return;
  }

  // Correct — full sequence matched
  if (patPlayerSeq.length === patSeq.length) {
    patCanClick = false;
    if (patLevel > scores.pat) scores.pat = patLevel;

    patLevel++;
    document.getElementById('pat-lvl-num').textContent   = patLevel;
    document.getElementById('pat-prog-fill').style.width = Math.min((patLevel / 20) * 100, 100) + '%';
    document.getElementById('pat-msg').textContent       = '✓ Correct! Next level incoming...';

    setTimeout(nextPatRound, 1000);
  }
}

function patWrong(el) {
  el.classList.add('wrong');
  patCanClick = false;
  document.getElementById('pat-msg').textContent =
    `✗ Wrong! You reached Level ${patLevel}`;

  setTimeout(() => {
    el.classList.remove('wrong');
    document.getElementById('pat-start-btn').disabled = false;
  }, 1200);
}

document.getElementById('pat-start-btn').addEventListener('click', startPat);

/* ================================================
   INIT — build pattern grid on load
   ================================================ */
buildPatGrid();
