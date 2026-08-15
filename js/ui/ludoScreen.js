(function (GA) {
  'use strict';

  var $ = GA.$;
  var L = GA.Ludo;
  var DIE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  var match = null; // { bot, stake, state, over, phase, pendingMovable, pendingRoll, sixStreak }

  function setStatus(text, cls) {
    var el = $('ludoStatusText');
    el.textContent = text;
    el.className = 'round-result-text' + (cls ? ' ' + cls : '');
  }

  function tokenLabel(color, idx) { return color + idx; }

  function renderAll() {
    var track = $('ludoTrack');
    track.innerHTML = '';

    var baseWrap = document.createElement('div');
    baseWrap.className = 'ludo-base-col';
    ['P', 'B'].forEach(function (color) {
      var row = document.createElement('div');
      row.className = 'ludo-base-row';
      match.state.tokens[color].forEach(function (pos, idx) {
        if (pos !== L.BASE) return;
        var tok = document.createElement('span');
        tok.className = 'ludo-token ludo-token-' + (color === 'P' ? 'player' : 'bot');
        tok.title = 'Base';
        if (color === 'P' && match.phase === 'awaiting-choice' && match.pendingMovable.indexOf(idx) !== -1) {
          tok.classList.add('ludo-token-movable');
          tok.dataset.tokenIdx = idx;
        }
        row.appendChild(tok);
      });
      baseWrap.appendChild(row);
    });
    track.appendChild(baseWrap);

    var strip = document.createElement('div');
    strip.className = 'ludo-strip';
    for (var pos = 0; pos < L.TRACK_LENGTH; pos++) {
      var cell = document.createElement('div');
      cell.className = 'ludo-cell' + (L.isSafeSquare(pos) ? ' ludo-cell-safe' : '');
      ['P', 'B'].forEach(function (color) {
        match.state.tokens[color].forEach(function (p, idx) {
          if (p !== pos) return;
          var tok = document.createElement('span');
          tok.className = 'ludo-token ludo-token-' + (color === 'P' ? 'player' : 'bot');
          if (color === 'P' && match.phase === 'awaiting-choice' && match.pendingMovable.indexOf(idx) !== -1) {
            tok.classList.add('ludo-token-movable');
            tok.dataset.tokenIdx = idx;
          }
          cell.appendChild(tok);
        });
      });
      strip.appendChild(cell);
    }
    track.appendChild(strip);

    var homeWrap = document.createElement('div');
    homeWrap.className = 'ludo-home-col';
    ['P', 'B'].forEach(function (color) {
      var homeCount = match.state.tokens[color].filter(function (p) { return p === L.HOME; }).length;
      var badge = document.createElement('div');
      badge.className = 'ludo-home-badge';
      badge.textContent = '🏠 ' + homeCount + '/2';
      homeWrap.appendChild(badge);
    });
    track.appendChild(homeWrap);

    $('ludoDie').textContent = DIE_FACES[match.lastRoll || 0] || '🎲';
    $('ludoRollBtn').disabled = match.over || match.turn !== 'roll';
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = {
      bot: bot, stake: stake, over: false, state: L.newGame(),
      turn: Math.random() < 0.5 ? 'roll' : 'bot', phase: 'awaiting-roll',
      pendingMovable: [], pendingRoll: 0, sixStreak: 0, lastRoll: 0
    };
    $('ludoPlayerIcon').textContent = profile.avatar.emoji;
    $('ludoPlayerNameLabel').textContent = profile.displayName;
    $('ludoBotIcon').textContent = bot.emoji;
    $('ludoBotNameLabel').textContent = bot.name;

    document.getElementById('screenLudo').classList.remove('hidden');

    if (match.turn === 'bot') {
      setStatus(bot.name + ' rolls first…');
      renderAll();
      setTimeout(botTurnStep, 700);
    } else {
      setStatus('Your turn — roll the dice');
      renderAll();
    }
  }

  function checkWinAfterMove(color) {
    if (L.hasWon(match.state, color)) {
      match.over = true;
      renderAll();
      var outcome = color === 'P' ? 'win' : 'loss';
      setStatus(outcome === 'win' ? 'Both your tokens made it home!' : 'Your rival got both tokens home first.', outcome);
      setTimeout(function () { finish(outcome); }, 1000);
      return true;
    }
    return false;
  }

  function onRoll() {
    if (!match || match.over || match.turn !== 'roll') return;
    var roll = L.rollDie();
    match.lastRoll = roll;
    var movable = L.movableTokens(match.state, 'P', roll);

    if (movable.length === 0) {
      renderAll();
      setStatus('Rolled ' + roll + ' — no valid moves.');
      setTimeout(endPlayerTurn, 900);
      return;
    }
    if (movable.length === 1) {
      renderAll();
      setStatus('Rolled ' + roll + ' — moving your token…');
      setTimeout(function () { applyPlayerMove(movable[0], roll); }, 700);
      return;
    }
    match.phase = 'awaiting-choice';
    match.pendingMovable = movable;
    match.pendingRoll = roll;
    setStatus('Rolled ' + roll + ' — choose which token to move');
    renderAll();
  }

  function applyPlayerMove(idx, roll) {
    var result = L.applyTokenMove(match.state, 'P', idx, roll);
    match.phase = 'awaiting-roll';
    match.pendingMovable = [];
    renderAll();
    if (checkWinAfterMove('P')) return;

    var note = result.captured ? ' Captured a rival token!' : result.finished ? ' Token made it home!' : '';
    if (roll === 6 && match.sixStreak < 2) {
      match.sixStreak++;
      setStatus('Rolled a 6 — go again!' + note);
      match.turn = 'roll';
      renderAll();
    } else {
      match.sixStreak = 0;
      setStatus('Turn passed to ' + match.bot.name + '.' + note);
      endPlayerTurn();
    }
  }

  function endPlayerTurn() {
    match.turn = 'bot';
    renderAll();
    setTimeout(botTurnStep, 700);
  }

  function botTurnStep() {
    if (match.over) return;
    var roll = L.rollDie();
    match.lastRoll = roll;
    var movable = L.movableTokens(match.state, 'B', roll);

    if (movable.length === 0) {
      renderAll();
      setStatus(match.bot.name + ' rolled ' + roll + ' — no valid moves.');
      setTimeout(endBotTurn, 900);
      return;
    }
    var idx = match.bot.chooseToken(match.state, roll, movable);
    var result = L.applyTokenMove(match.state, 'B', idx, roll);
    renderAll();
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
    setStatus('Your turn — roll the dice');
    renderAll();
  }

  function onTokenClick(idx) {
    if (!match || match.phase !== 'awaiting-choice') return;
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
    var scoreLine = outcome === 'win' ? 'Both tokens home first' : 'Rival got both tokens home first';
    GA.Arena.finishMatch('ludo', match.bot, match.stake, outcome, scoreLine);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('ludoRollBtn').addEventListener('click', onRoll);
    $('ludoTrack').addEventListener('click', function (e) {
      var tok = e.target.closest('.ludo-token-movable');
      if (!tok) return;
      onTokenClick(Number(tok.dataset.tokenIdx));
    });
    $('ludoForfeitBtn').addEventListener('click', forfeitMatch);
  });

  GA.Games.ludo = {
    name: 'Ludo',
    createBot: L.createBot,
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
