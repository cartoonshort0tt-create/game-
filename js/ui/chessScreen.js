(function (GA) {
  'use strict';

  var $ = GA.$;
  var C = GA.Chess;
  var GLYPH = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  };

  var match = null; // { bot, stake, state, over, locked, selected, legalForSelected }

  function squareId(r, c) { return r + '_' + c; }

  function renderBoard() {
    var boardEl = $('chessBoard');
    boardEl.innerHTML = '';
    var board = match.state.board;
    var dests = match.selected ? match.legalForSelected.map(function (m) { return m.to; }) : [];

    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var sq = document.createElement('button');
        sq.className = 'chess-sq ' + ((r + c) % 2 === 0 ? 'chess-sq-light' : 'chess-sq-dark');
        sq.dataset.r = r; sq.dataset.c = c;
        var piece = board[r][c];
        if (piece) {
          var glyphSpan = document.createElement('span');
          glyphSpan.className = 'chess-piece chess-piece-' + piece.color;
          glyphSpan.textContent = GLYPH[piece.color][piece.type];
          sq.appendChild(glyphSpan);
        }
        if (match.selected && match.selected[0] === r && match.selected[1] === c) sq.classList.add('chess-sq-selected');
        if (dests.some(function (d) { return d[0] === r && d[1] === c; })) sq.classList.add('chess-sq-dest');
        boardEl.appendChild(sq);
      }
    }
  }

  function setStatus(text, cls) {
    var el = $('chessStatusText');
    el.textContent = text;
    el.className = 'round-result-text' + (cls ? ' ' + cls : '');
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = { bot: bot, stake: stake, over: false, locked: false, selected: null, legalForSelected: [], state: C.newGame() };
    $('chessPlayerIcon').textContent = profile.avatar.emoji;
    $('chessBotIcon').textContent = bot.emoji;
    $('chessBotNameLabel').textContent = bot.name + ' (Black)';

    document.getElementById('screenChess').classList.remove('hidden');
    setStatus('Your move (White)');
    renderBoard();
  }

  function evaluateStatus() {
    var status = C.gameStatus(match.state);
    if (status === 'checkmate') {
      match.over = true;
      renderBoard();
      var playerWon = match.state.turn === C.BLACK;
      setStatus(playerWon ? 'Checkmate — you win!' : 'Checkmate — you lost.', playerWon ? 'win' : 'lose');
      setTimeout(function () { finish(playerWon ? 'win' : 'loss'); }, 1100);
      return true;
    }
    if (status === 'stalemate') {
      match.over = true;
      renderBoard();
      setStatus('Stalemate — it\'s a draw.', 'draw');
      setTimeout(function () { finish('draw'); }, 900);
      return true;
    }
    return false;
  }

  function botTurn() {
    if (match.over) return;
    var mv = match.bot.pickMove(match.state);
    GA.Sfx.play(mv.captured ? 'capture' : 'move');
    match.state = C.applyMove(match.state, mv);
    match.locked = false;
    renderBoard();
    if (evaluateStatus()) return;
    var checkNote = C.isInCheck(match.state.board, C.WHITE) ? ' — you are in check!' : '';
    setStatus('Your move (White)' + checkNote, checkNote ? 'lose' : '');
  }

  function trySelect(r, c) {
    var piece = match.state.board[r][c];
    if (piece && piece.color === C.WHITE) {
      match.selected = [r, c];
      match.legalForSelected = C.generateLegalMoves(match.state, C.WHITE).filter(function (m) { return m.from[0] === r && m.from[1] === c; });
      renderBoard();
    } else {
      match.selected = null;
      match.legalForSelected = [];
      renderBoard();
    }
  }

  function tryMove(r, c) {
    var chosen = match.legalForSelected.find(function (m) { return m.to[0] === r && m.to[1] === c; });
    if (!chosen) { trySelect(r, c); return; }
    GA.Sfx.play(chosen.captured ? 'capture' : 'move');
    match.state = C.applyMove(match.state, chosen);
    match.selected = null;
    match.legalForSelected = [];
    match.locked = true;
    renderBoard();
    if (evaluateStatus()) return;
    setStatus(match.bot.name + ' is thinking…');
    setTimeout(botTurn, 550);
  }

  function onSquareClick(r, c) {
    if (!match || match.over || match.locked) return;
    if (match.selected) {
      if (match.selected[0] === r && match.selected[1] === c) {
        match.selected = null; match.legalForSelected = []; renderBoard(); return;
      }
      tryMove(r, c);
    } else {
      var piece = match.state.board[r][c];
      if (piece && piece.color === C.WHITE) GA.Sfx.play('select');
      trySelect(r, c);
    }
  }

  function forfeitMatch() {
    if (!match || match.over) return;
    if (!confirm('Resign this match? ' + (match.stake > 0 ? 'Your staked coins will not be refunded.' : ''))) return;
    match.over = true;
    finish('loss');
  }

  function finish(outcome) {
    var scoreLine = outcome === 'draw' ? 'Stalemate' : (outcome === 'win' ? 'Checkmate delivered' : 'Checkmated');
    GA.Arena.finishMatch('chess', match.bot, match.stake, outcome, scoreLine);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('chessBoard').addEventListener('click', function (e) {
      var sq = e.target.closest('.chess-sq');
      if (!sq) return;
      onSquareClick(Number(sq.dataset.r), Number(sq.dataset.c));
    });
    $('chessForfeitBtn').addEventListener('click', forfeitMatch);
  });

  GA.Games.chess = {
    name: 'Chess',
    createBot: C.createBot,
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
