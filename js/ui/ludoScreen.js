(function (GA) {
  'use strict';

  var $ = GA.$;
  var L = GA.Ludo;
  var match = null; // { bot, stake, state, over, turn, phase, pendingMovable, pendingRoll, sixStreak, lastRoll }
  var cellEls = {}; // "r_c" -> DOM element, built once per match

  var GREEN_STRETCH = [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]];
  var BLUE_STRETCH = [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]];

  function cellKey(r, c) { return r + '_' + c; }

  function classifyCell(r, c) {
    for (var name in L.YARD_BOUNDS) {
      var b = L.YARD_BOUNDS[name];
      if (r >= b.r0 && r <= b.r1 && c >= b.c0 && c <= b.c1) {
        if (name === 'red') return { role: 'yard', owner: 'P' };
        if (name === 'yellow') return { role: 'yard', owner: 'B' };
        return { role: 'yard', owner: null };
      }
    }
    for (var i = 0; i < L.RING.length; i++) {
      if (L.RING[i][0] === r && L.RING[i][1] === c) {
        return { role: 'ring', safe: L.SAFE_INDEXES.indexOf(i) !== -1 };
      }
    }
    if (L.STRETCH.P.some(function (p) { return p[0] === r && p[1] === c; })) return { role: 'stretch', owner: 'P' };
    if (L.STRETCH.B.some(function (p) { return p[0] === r && p[1] === c; })) return { role: 'stretch', owner: 'B' };
    if (GREEN_STRETCH.some(function (p) { return p[0] === r && p[1] === c; })) return { role: 'stretch', owner: null };
    if (BLUE_STRETCH.some(function (p) { return p[0] === r && p[1] === c; })) return { role: 'stretch', owner: null };
    if (r === 7 && c === 7) return { role: 'hub' };
    return { role: 'center' };
  }

  function buildBoardOnce() {
    var boardEl = $('ludoTrack');
    boardEl.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'ludo-grid';
    cellEls = {};
    for (var r = 0; r < 15; r++) {
      for (var c = 0; c < 15; c++) {
        var info = classifyCell(r, c);
        var cell = document.createElement('div');
        cell.className = 'ludo-gcell ludo-role-' + info.role + (info.owner ? ' ludo-owner-' + info.owner : '') + (info.safe ? ' ludo-safe' : '');
        cell.style.gridColumn = (c + 1);
        cell.style.gridRow = (r + 1);
        if (info.role === 'ring' && info.safe) cell.innerHTML = '<span class="ludo-star">★</span>';
        if (info.role === 'hub') cell.innerHTML = '🏆';
        grid.appendChild(cell);
        cellEls[cellKey(r, c)] = cell;
      }
    }
    boardEl.appendChild(grid);
  }

  function clearTokenEls() {
    Object.keys(cellEls).forEach(function (k) {
      var el = cellEls[k];
      el.querySelectorAll('.ludo-token').forEach(function (t) { t.remove(); });
    });
  }

  function placeToken(r, c, color, idx, movable, isHomeGroup) {
    var cell = cellEls[cellKey(r, c)];
    if (!cell) return;
    var tok = document.createElement('span');
    tok.className = 'ludo-token ludo-token-' + (color === 'P' ? 'player' : 'bot') + (isHomeGroup ? ' ludo-token-mini' : '');
    if (movable) { tok.classList.add('ludo-token-movable'); tok.dataset.color = color; tok.dataset.tokenIdx = idx; }
    cell.appendChild(tok);
  }

  function renderTokens() {
    clearTokenEls();
    ['P', 'B'].forEach(function (color) {
      match.state.tokens[color].forEach(function (pos, idx) {
        var movable = match.phase === 'awaiting-choice' && match.awaitingColor === color && match.pendingMovable.indexOf(idx) !== -1;
        if (pos === -1) {
          var slot = L.YARD_SLOTS[color][idx];
          placeToken(slot[0], slot[1], color, idx, movable, false);
        } else if (L.isHome(pos)) {
          placeToken(7, 7, color, idx, false, true);
        } else {
          var coord = L.boardCoord(color, pos);
          if (coord) placeToken(coord[0], coord[1], color, idx, movable, false);
        }
      });
    });
  }

  function setStatus(text, cls) {
    var el = $('ludoStatusText');
    el.textContent = text;
    el.className = 'round-result-text' + (cls ? ' ' + cls : '');
  }

  function updateHomeBadges() {
    var pHome = match.state.tokens.P.filter(L.isHome).length;
    var bHome = match.state.tokens.B.filter(L.isHome).length;
    $('ludoPlayerNameLabel').textContent = GA.Profile.get().displayName + ' (🏠 ' + pHome + '/4)';
    $('ludoBotNameLabel').textContent = match.bot.name + ' (🏠 ' + bHome + '/4)';
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = {
      bot: bot, stake: stake, over: false, state: L.newGame(),
      turn: Math.random() < 0.5 ? 'roll' : 'bot', phase: 'awaiting-roll',
      pendingMovable: [], pendingRoll: 0, awaitingColor: null, sixStreak: 0, lastRoll: 0
    };
    $('ludoPlayerIcon').textContent = profile.avatar.emoji;
    $('ludoBotIcon').textContent = bot.emoji;

    document.getElementById('screenLudo').classList.remove('hidden');
    buildBoardOnce();
    updateHomeBadges();
    renderTokens();
    $('ludoDie').textContent = '🎲';
    $('ludoRollBtn').disabled = match.turn !== 'roll';

    if (match.turn === 'bot') {
      setStatus(bot.name + ' rolls first…');
      setTimeout(botTurnStep, 700);
    } else {
      setStatus('Your turn — roll the dice');
    }
  }

  function checkWinAfterMove(color) {
    if (L.hasWon(match.state, color)) {
      match.over = true;
      updateHomeBadges();
      renderTokens();
      var outcome = color === 'P' ? 'win' : 'loss';
      setStatus(outcome === 'win' ? 'All 4 tokens made it home!' : 'Your rival got all 4 tokens home first.', outcome);
      setTimeout(function () { finish(outcome); }, 1000);
      return true;
    }
    return false;
  }

  function onRoll() {
    if (!match || match.over || match.turn !== 'roll') return;
    GA.Sfx.play('dice');
    var roll = L.rollDie();
    match.lastRoll = roll;
    $('ludoDie').textContent = roll;
    var movable = L.movableTokens(match.state, 'P', roll);

    if (movable.length === 0) {
      setStatus('Rolled ' + roll + ' — no valid moves.');
      setTimeout(endPlayerTurn, 900);
      return;
    }
    if (movable.length === 1) {
      setStatus('Rolled ' + roll + ' — moving your token…');
      $('ludoRollBtn').disabled = true;
      setTimeout(function () { applyPlayerMove(movable[0], roll); }, 700);
      return;
    }
    match.phase = 'awaiting-choice';
    match.awaitingColor = 'P';
    match.pendingMovable = movable;
    match.pendingRoll = roll;
    $('ludoRollBtn').disabled = true;
    setStatus('Rolled ' + roll + ' — tap a glowing token to move it');
    renderTokens();
  }

  function applyPlayerMove(idx, roll) {
    var result = L.applyTokenMove(match.state, 'P', idx, roll);
    GA.Sfx.play(result.captured ? 'capture' : 'move');
    match.phase = 'awaiting-roll';
    match.pendingMovable = [];
    match.awaitingColor = null;
    updateHomeBadges();
    renderTokens();
    if (checkWinAfterMove('P')) return;

    var note = result.captured ? ' Captured a rival token!' : result.finished ? ' Token made it home!' : '';
    if (roll === 6 && match.sixStreak < 2) {
      match.sixStreak++;
      setStatus('Rolled a 6 — go again!' + note);
      match.turn = 'roll';
      $('ludoRollBtn').disabled = false;
    } else {
      match.sixStreak = 0;
      setStatus('Turn passed to ' + match.bot.name + '.' + note);
      endPlayerTurn();
    }
  }

  function endPlayerTurn() {
    match.turn = 'bot';
    $('ludoRollBtn').disabled = true;
    setTimeout(botTurnStep, 700);
  }

  function botTurnStep() {
    if (match.over) return;
    GA.Sfx.play('dice');
    var roll = L.rollDie();
    match.lastRoll = roll;
    $('ludoDie').textContent = roll;
    var movable = L.movableTokens(match.state, 'B', roll);

    if (movable.length === 0) {
      setStatus(match.bot.name + ' rolled ' + roll + ' — no valid moves.');
      setTimeout(endBotTurn, 900);
      return;
    }
    var idx = match.bot.chooseToken(match.state, roll, movable);
    var result = L.applyTokenMove(match.state, 'B', idx, roll);
    GA.Sfx.play(result.captured ? 'capture' : 'move');
    updateHomeBadges();
    renderTokens();
    if (checkWinAfterMove('B')) return;

    var note = result.captured ? ' Your token got sent home!' : result.finished ? ' rival token reached home!' : '';
    if (roll === 6 && match.sixStreak < 2) {
      match.sixStreak++;
      setStatus(match.bot.name + ' rolled a 6 — goes again!' + note);
      setTimeout(botTurnStep, 800);
    } else {
      match.sixStreak = 0;
      setStatus(match.bot.name + ' rolled ' + roll + '.' + note);
      endBotTurn();
    }
  }

  function endBotTurn() {
    match.turn = 'roll';
    $('ludoRollBtn').disabled = false;
    setStatus('Your turn — roll the dice');
  }

  function onTokenClick(color, idx) {
    if (!match || match.phase !== 'awaiting-choice' || match.awaitingColor !== color) return;
    if (match.pendingMovable.indexOf(idx) === -1) return;
    applyPlayerMove(idx, match.pendingRoll);
  }

  function forfeitMatch() {
    if (!match || match.over) return;
    if (!confirm('Forfeit this match? ' + (match.stake > 0 ? 'Your staked coins will not be refunded.' : ''))) return;
    match.over = true;
    finish('loss');
  }

  function finish(outcome) {
    var scoreLine = outcome === 'win' ? 'All 4 tokens home first' : 'Rival got all 4 tokens home first';
    GA.Arena.finishMatch('ludo', match.bot, match.stake, outcome, scoreLine);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('ludoRollBtn').addEventListener('click', onRoll);
    $('ludoTrack').addEventListener('click', function (e) {
      var tok = e.target.closest('.ludo-token-movable');
      if (!tok) return;
      onTokenClick(tok.dataset.color, Number(tok.dataset.tokenIdx));
    });
    $('ludoForfeitBtn').addEventListener('click', forfeitMatch);
  });

  GA.Games.ludo = {
    name: 'Ludo',
    createBot: L.createBot,
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
