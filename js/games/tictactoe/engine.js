(function (GA) {
  'use strict';

  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  var PLAYER = 'X';
  var BOT = 'O';

  function emptyBoard() { return new Array(9).fill(null); }

  function winnerOf(board) {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i];
      if (board[l[0]] && board[l[0]] === board[l[1]] && board[l[1]] === board[l[2]]) {
        return { symbol: board[l[0]], line: l };
      }
    }
    return null;
  }

  function legalMoves(board) {
    var moves = [];
    for (var i = 0; i < 9; i++) if (!board[i]) moves.push(i);
    return moves;
  }

  function minimax(board, turnSymbol, depth) {
    var win = winnerOf(board);
    if (win) return { score: win.symbol === BOT ? 10 - depth : depth - 10 };
    var moves = legalMoves(board);
    if (moves.length === 0) return { score: 0 };

    var best = null;
    for (var i = 0; i < moves.length; i++) {
      var idx = moves[i];
      board[idx] = turnSymbol;
      var result = minimax(board, turnSymbol === BOT ? PLAYER : BOT, depth + 1);
      board[idx] = null;
      var candidate = { score: result.score, move: idx };
      if (best === null) {
        best = candidate;
      } else if (turnSymbol === BOT && candidate.score > best.score) {
        best = candidate;
      } else if (turnSymbol === PLAYER && candidate.score < best.score) {
        best = candidate;
      }
    }
    return best;
  }

  function botMove(board, tier) {
    var moves = legalMoves(board);
    if (tier === 'rookie') {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    if (tier === 'skilled' && Math.random() < 0.45) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    return minimax(board, BOT, 0).move;
  }

  function createBot(tier) {
    var persona = GA.BotPersonas.get(tier);
    persona.pickMove = function (board) { return botMove(board, tier); };
    return persona;
  }

  GA.TicTacToe = {
    PLAYER: PLAYER,
    BOT: BOT,
    LINES: LINES,
    emptyBoard: emptyBoard,
    winnerOf: winnerOf,
    legalMoves: legalMoves,
    createBot: createBot
  };
})(window.GameArena = window.GameArena || {});
