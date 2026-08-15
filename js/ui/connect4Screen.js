(function (GA) {
  'use strict';

  var $ = GA.$;
  var C4 = GA.Connect4;
  var match = null; // { bot, stake, grid, over, turn, locked }

  function renderBoard(highlightCells) {
    var boardEl = $('c4Board');
    boardEl.innerHTML = '';
    for (var r = 0; r < C4.ROWS; r++) {
      for (var c = 0; c < C4.COLS; c++) {
        var cell = document.createElement('button');
        cell.className = 'c4-cell';
        cell.dataset.col = c;
        var symbol = match.grid[r][c];
        if (symbol) {
          var piece = document.createElement('span');
          piece.className = 'c4-piece ' + (symbol === C4.PLAYER ? 'c4-piece-player' : 'c4-piece-bot');
          if (highlightCells && highlightCells.some(function (p) { return p[0] === r && p[1] === c; })) {
            piece.classList.add('c4-win-piece');
          }
          cell.appendChild(piece);
        }
        cell.disabled = match.over || match.locked || !!match.grid[0][c];
        boardEl.appendChild(cell);
      }
    }
  }

  function setStatus(text, cls) {
    var el = $('c4StatusText');
    el.textContent = text;
    el.className = 'round-result-text' + (cls ? ' ' + cls : '');
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = {
      bot: bot, stake: stake, over: false, locked: false,
      grid: C4.emptyGrid(),
      turn: Math.random() < 0.5 ? C4.PLAYER : C4.BOT
    };
    $('c4PlayerIcon').textContent = profile.avatar.emoji;
    $('c4PlayerNameLabel').textContent = profile.displayName;
    $('c4BotIcon').textContent = bot.emoji;
    $('c4BotNameLabel').textContent = bot.name;

    document.getElementById('screenConnect4').classList.remove('hidden');
    renderBoard();

    if (match.turn === C4.BOT) {
      setStatus(bot.name + ' moves first…');
      setTimeout(botTurn, 700);
    } else {
      setStatus('Your turn — pick a column');
    }
  }

  function afterMove() {
    var win = C4.checkWinner(match.grid);
    if (win) {
      match.over = true;
      renderBoard(win.cells);
      setTimeout(function () { finish(win.symbol === C4.PLAYER ? 'win' : 'loss'); }, 800);
      return true;
    }
    if (C4.isFull(match.grid)) {
      match.over = true;
      renderBoard();
      setTimeout(function () { finish('draw'); }, 500);
      return true;
    }
    return false;
  }

  function botTurn() {
    if (match.over) return;
    match.locked = false;
    var col = match.bot.pickColumn(match.grid);
    C4.dropPiece(match.grid, col, C4.BOT);
    GA.Sfx.play('place');
    if (afterMove()) return;
    match.turn = C4.PLAYER;
    setStatus('Your turn — pick a column');
    renderBoard();
  }

  function playerDrop(col) {
    if (!match || match.over || match.locked || match.turn !== C4.PLAYER) return;
    if (match.grid[0][col]) return;
    C4.dropPiece(match.grid, col, C4.PLAYER);
    GA.Sfx.play('place');
    if (afterMove()) return;
    match.turn = C4.BOT;
    match.locked = true;
    setStatus(match.bot.name + ' is thinking…');
    renderBoard();
    setTimeout(botTurn, 650);
  }

  function forfeitMatch() {
    if (!match || match.over) return;
    if (!confirm('Forfeit this match? ' + (match.stake > 0 ? 'Your staked coins will not be refunded.' : ''))) return;
    match.over = true;
    finish('loss');
  }

  function finish(outcome) {
    var scoreLine = outcome === 'draw' ? 'Board filled — no winner' : (outcome === 'win' ? 'You connected four' : 'Your opponent connected four');
    GA.Arena.finishMatch('connect4', match.bot, match.stake, outcome, scoreLine);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('c4Board').addEventListener('click', function (e) {
      var cell = e.target.closest('.c4-cell');
      if (!cell || cell.disabled) return;
      playerDrop(Number(cell.dataset.col));
    });
    $('c4ForfeitBtn').addEventListener('click', forfeitMatch);
  });

  GA.Games.connect4 = {
    name: 'Connect 4',
    createBot: C4.createBot,
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
