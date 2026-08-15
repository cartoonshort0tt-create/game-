(function (GA) {
  'use strict';

  var $ = GA.$;
  var T = GA.TicTacToe;
  var match = null; // { bot, stake, board, over, turn }

  function renderBoard() {
    var boardEl = $('tttBoard');
    boardEl.innerHTML = '';
    var win = T.winnerOf(match.board);
    match.board.forEach(function (cell, idx) {
      var btn = document.createElement('button');
      btn.className = 'ttt-cell';
      btn.dataset.idx = idx;
      if (cell === T.PLAYER) btn.innerHTML = GA.Icons.xMark();
      if (cell === T.BOT) btn.innerHTML = GA.Icons.oMark();
      if (win && win.line.indexOf(idx) !== -1) btn.classList.add('ttt-win-cell');
      btn.disabled = !!cell || match.over || match.turn !== T.PLAYER;
      boardEl.appendChild(btn);
    });
  }

  function setStatus(text, cls) {
    var el = $('tttStatusText');
    el.textContent = text;
    el.className = 'round-result-text' + (cls ? ' ' + cls : '');
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = {
      bot: bot, stake: stake, over: false,
      board: T.emptyBoard(),
      turn: Math.random() < 0.5 ? T.PLAYER : T.BOT
    };
    $('tttPlayerIcon').textContent = profile.avatar.emoji;
    $('tttPlayerNameLabel').textContent = profile.displayName;
    $('tttBotIcon').textContent = bot.emoji;
    $('tttBotNameLabel').textContent = bot.name;

    document.getElementById('screenTictactoe').classList.remove('hidden');

    if (match.turn === T.BOT) {
      setStatus(bot.name + ' moves first…');
      renderBoard();
      setTimeout(botTurn, 700);
    } else {
      setStatus('Your turn — place your mark');
      renderBoard();
    }
  }

  function afterMove() {
    var win = T.winnerOf(match.board);
    if (win) {
      match.over = true;
      renderBoard();
      setTimeout(function () { finish(win.symbol === T.PLAYER ? 'win' : 'loss'); }, 700);
      return true;
    }
    if (T.legalMoves(match.board).length === 0) {
      match.over = true;
      renderBoard();
      setTimeout(function () { finish('draw'); }, 500);
      return true;
    }
    return false;
  }

  function botTurn() {
    if (match.over) return;
    var idx = match.bot.pickMove(match.board);
    match.board[idx] = T.BOT;
    if (afterMove()) return;
    match.turn = T.PLAYER;
    setStatus('Your turn — place your mark');
    renderBoard();
  }

  function playerMove(idx) {
    if (!match || match.over || match.turn !== T.PLAYER || match.board[idx]) return;
    match.board[idx] = T.PLAYER;
    if (afterMove()) return;
    match.turn = T.BOT;
    setStatus(match.bot.name + ' is thinking…');
    renderBoard();
    setTimeout(botTurn, 600);
  }

  function forfeitMatch() {
    if (!match || match.over) return;
    if (!confirm('Forfeit this match? ' + (match.stake > 0 ? 'Your staked coins will not be refunded.' : ''))) return;
    match.over = true;
    finish('loss');
  }

  function finish(outcome) {
    var scoreLine = outcome === 'draw' ? 'Board filled — no winner' : (outcome === 'win' ? 'You got three in a row' : 'Your opponent got three in a row');
    GA.Arena.finishMatch('tictactoe', match.bot, match.stake, outcome, scoreLine);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('tttBoard').addEventListener('click', function (e) {
      var btn = e.target.closest('.ttt-cell');
      if (!btn || btn.disabled) return;
      playerMove(Number(btn.dataset.idx));
    });
    $('tttForfeitBtn').addEventListener('click', forfeitMatch);
  });

  GA.Games.tictactoe = {
    name: 'Tic-Tac-Toe',
    createBot: T.createBot,
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
