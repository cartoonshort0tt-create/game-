(function (GA) {
  'use strict';

  var WHITE = 'w';
  var BLACK = 'b';
  var VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  function newGame() {
    var board = [];
    for (var r = 0; r < 8; r++) board.push(new Array(8).fill(null));
    var backRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (var c = 0; c < 8; c++) {
      board[0][c] = { type: backRank[c], color: BLACK };
      board[1][c] = { type: 'p', color: BLACK };
      board[6][c] = { type: 'p', color: WHITE };
      board[7][c] = { type: backRank[c], color: WHITE };
    }
    return {
      board: board,
      turn: WHITE,
      castling: { wK: true, wQ: true, bK: true, bQ: true },
      epTarget: null
    };
  }

  function cloneState(state) {
    return {
      board: state.board.map(function (row) { return row.map(function (cell) { return cell ? { type: cell.type, color: cell.color } : null; }); }),
      turn: state.turn,
      castling: { wK: state.castling.wK, wQ: state.castling.wQ, bK: state.castling.bK, bQ: state.castling.bQ },
      epTarget: state.epTarget
    };
  }

  function findKing(board, color) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = board[r][c];
        if (p && p.type === 'k' && p.color === color) return [r, c];
      }
    }
    return null;
  }

  var KNIGHT_OFFSETS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  var KING_OFFSETS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  var ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function isSquareAttacked(board, r, c, byColor) {
    var pawnDir = byColor === WHITE ? 1 : -1;
    var pr = r + pawnDir;
    if (inBounds(pr, c - 1)) { var p1 = board[pr][c - 1]; if (p1 && p1.type === 'p' && p1.color === byColor) return true; }
    if (inBounds(pr, c + 1)) { var p2 = board[pr][c + 1]; if (p2 && p2.type === 'p' && p2.color === byColor) return true; }

    for (var i = 0; i < KNIGHT_OFFSETS.length; i++) {
      var nr = r + KNIGHT_OFFSETS[i][0], nc = c + KNIGHT_OFFSETS[i][1];
      if (inBounds(nr, nc)) { var np = board[nr][nc]; if (np && np.type === 'n' && np.color === byColor) return true; }
    }

    for (var k = 0; k < KING_OFFSETS.length; k++) {
      var kr = r + KING_OFFSETS[k][0], kc = c + KING_OFFSETS[k][1];
      if (inBounds(kr, kc)) { var kp = board[kr][kc]; if (kp && kp.type === 'k' && kp.color === byColor) return true; }
    }

    for (var d = 0; d < BISHOP_DIRS.length; d++) {
      var dr = BISHOP_DIRS[d][0], dc = BISHOP_DIRS[d][1];
      var rr = r + dr, cc = c + dc;
      while (inBounds(rr, cc)) {
        var bp = board[rr][cc];
        if (bp) {
          if (bp.color === byColor && (bp.type === 'b' || bp.type === 'q')) return true;
          break;
        }
        rr += dr; cc += dc;
      }
    }

    for (var e = 0; e < ROOK_DIRS.length; e++) {
      var dr2 = ROOK_DIRS[e][0], dc2 = ROOK_DIRS[e][1];
      var rr2 = r + dr2, cc2 = c + dc2;
      while (inBounds(rr2, cc2)) {
        var rp = board[rr2][cc2];
        if (rp) {
          if (rp.color === byColor && (rp.type === 'r' || rp.type === 'q')) return true;
          break;
        }
        rr2 += dr2; cc2 += dc2;
      }
    }
    return false;
  }

  function isInCheck(board, color) {
    var kingPos = findKing(board, color);
    if (!kingPos) return false;
    return isSquareAttacked(board, kingPos[0], kingPos[1], color === WHITE ? BLACK : WHITE);
  }

  function pseudoMovesForPiece(state, r, c) {
    var board = state.board;
    var piece = board[r][c];
    if (!piece) return [];
    var color = piece.color;
    var opp = color === WHITE ? BLACK : WHITE;
    var moves = [];

    function addMove(tr, tc, extra) {
      moves.push(Object.assign({ from: [r, c], to: [tr, tc], piece: piece.type, color: color, captured: board[tr][tc] ? board[tr][tc].type : null }, extra || {}));
    }

    if (piece.type === 'p') {
      var dir = color === WHITE ? -1 : 1;
      var startRow = color === WHITE ? 6 : 1;
      var lastRow = color === WHITE ? 0 : 7;
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        addMove(r + dir, c, { promotion: r + dir === lastRow });
        if (r === startRow && !board[r + 2 * dir][c]) addMove(r + 2 * dir, c, { doublePush: true });
      }
      [-1, 1].forEach(function (side) {
        var tr = r + dir, tc = c + side;
        if (!inBounds(tr, tc)) return;
        var target = board[tr][tc];
        if (target && target.color === opp) addMove(tr, tc, { promotion: tr === lastRow });
        else if (state.epTarget && state.epTarget[0] === tr && state.epTarget[1] === tc) addMove(tr, tc, { enPassant: true });
      });
    } else if (piece.type === 'n') {
      KNIGHT_OFFSETS.forEach(function (o) {
        var tr = r + o[0], tc = c + o[1];
        if (inBounds(tr, tc) && (!board[tr][tc] || board[tr][tc].color === opp)) addMove(tr, tc);
      });
    } else if (piece.type === 'k') {
      KING_OFFSETS.forEach(function (o) {
        var tr = r + o[0], tc = c + o[1];
        if (inBounds(tr, tc) && (!board[tr][tc] || board[tr][tc].color === opp)) addMove(tr, tc);
      });
      var rights = state.castling;
      var homeRow = color === WHITE ? 7 : 0;
      if (r === homeRow && c === 4 && !isInCheck(board, color)) {
        var canK = color === WHITE ? rights.wK : rights.bK;
        var canQ = color === WHITE ? rights.wQ : rights.bQ;
        if (canK && !board[homeRow][5] && !board[homeRow][6] &&
          !isSquareAttacked(board, homeRow, 5, opp) && !isSquareAttacked(board, homeRow, 6, opp)) {
          addMove(homeRow, 6, { castle: 'K' });
        }
        if (canQ && !board[homeRow][3] && !board[homeRow][2] && !board[homeRow][1] &&
          !isSquareAttacked(board, homeRow, 3, opp) && !isSquareAttacked(board, homeRow, 2, opp)) {
          addMove(homeRow, 2, { castle: 'Q' });
        }
      }
    } else {
      var dirSets = piece.type === 'b' ? BISHOP_DIRS : piece.type === 'r' ? ROOK_DIRS : BISHOP_DIRS.concat(ROOK_DIRS);
      dirSets.forEach(function (d) {
        var rr = r + d[0], cc = c + d[1];
        while (inBounds(rr, cc)) {
          var target = board[rr][cc];
          if (!target) { addMove(rr, cc); }
          else { if (target.color === opp) addMove(rr, cc); break; }
          rr += d[0]; cc += d[1];
        }
      });
    }
    return moves;
  }

  function applyMove(state, move) {
    var next = cloneState(state);
    var board = next.board;
    var piece = board[move.from[0]][move.from[1]];
    board[move.from[0]][move.from[1]] = null;

    if (move.enPassant) {
      var capturedRow = move.color === WHITE ? move.to[0] + 1 : move.to[0] - 1;
      board[capturedRow][move.to[1]] = null;
    }

    board[move.to[0]][move.to[1]] = move.promotion ? { type: 'q', color: move.color } : piece;

    if (move.castle === 'K') {
      var homeRowK = move.color === WHITE ? 7 : 0;
      board[homeRowK][5] = board[homeRowK][7];
      board[homeRowK][7] = null;
    } else if (move.castle === 'Q') {
      var homeRowQ = move.color === WHITE ? 7 : 0;
      board[homeRowQ][3] = board[homeRowQ][0];
      board[homeRowQ][0] = null;
    }

    if (piece.type === 'k') {
      if (move.color === WHITE) { next.castling.wK = false; next.castling.wQ = false; }
      else { next.castling.bK = false; next.castling.bQ = false; }
    }
    if (piece.type === 'r') {
      if (move.color === WHITE && move.from[0] === 7 && move.from[1] === 0) next.castling.wQ = false;
      if (move.color === WHITE && move.from[0] === 7 && move.from[1] === 7) next.castling.wK = false;
      if (move.color === BLACK && move.from[0] === 0 && move.from[1] === 0) next.castling.bQ = false;
      if (move.color === BLACK && move.from[0] === 0 && move.from[1] === 7) next.castling.bK = false;
    }
    if (move.captured === 'r') {
      if (move.to[0] === 7 && move.to[1] === 0) next.castling.wQ = false;
      if (move.to[0] === 7 && move.to[1] === 7) next.castling.wK = false;
      if (move.to[0] === 0 && move.to[1] === 0) next.castling.bQ = false;
      if (move.to[0] === 0 && move.to[1] === 7) next.castling.bK = false;
    }

    next.epTarget = move.doublePush ? [(move.from[0] + move.to[0]) / 2, move.from[1]] : null;
    next.turn = move.color === WHITE ? BLACK : WHITE;
    return next;
  }

  function generateLegalMoves(state, color) {
    var moves = [];
    var board = state.board;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = board[r][c];
        if (!p || p.color !== color) continue;
        var pseudo = pseudoMovesForPiece(state, r, c);
        for (var i = 0; i < pseudo.length; i++) {
          var next = applyMove(state, pseudo[i]);
          if (!isInCheck(next.board, color)) moves.push(pseudo[i]);
        }
      }
    }
    return moves;
  }

  function gameStatus(state) {
    var legal = generateLegalMoves(state, state.turn);
    var inCheck = isInCheck(state.board, state.turn);
    if (legal.length === 0) return inCheck ? 'checkmate' : 'stalemate';
    return inCheck ? 'check' : 'ongoing';
  }

  function evaluate(state) {
    var score = 0;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = state.board[r][c];
        if (!p) continue;
        var val = VALUES[p.type];
        var centerBonus = (p.type === 'n' || p.type === 'p') ? (3.5 - Math.abs(3.5 - r)) * 0.02 + (3.5 - Math.abs(3.5 - c)) * 0.02 : 0;
        score += (p.color === WHITE ? 1 : -1) * (val + centerBonus);
      }
    }
    return score;
  }

  function minimax(state, depth, alpha, beta) {
    var status = gameStatus(state);
    if (status === 'checkmate') return { score: state.turn === WHITE ? -9000 - depth : 9000 + depth };
    if (status === 'stalemate') return { score: 0 };
    if (depth === 0) return { score: evaluate(state) };

    var moves = generateLegalMoves(state, state.turn);
    var maximizing = state.turn === WHITE;
    var best = maximizing ? -Infinity : Infinity;
    var bestMove = moves[0];
    for (var i = 0; i < moves.length; i++) {
      var next = applyMove(state, moves[i]);
      var result = minimax(next, depth - 1, alpha, beta);
      if (maximizing && result.score > best) { best = result.score; bestMove = moves[i]; }
      if (!maximizing && result.score < best) { best = result.score; bestMove = moves[i]; }
      if (maximizing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return { score: best, move: bestMove };
  }

  var DEPTH = { rookie: 0, skilled: 2, master: 3 };

  function botMove(state, tier) {
    var moves = generateLegalMoves(state, state.turn);
    if (tier === 'rookie') {
      var captures = moves.filter(function (m) { return m.captured; });
      if (captures.length && Math.random() < 0.5) return captures[Math.floor(Math.random() * captures.length)];
      return moves[Math.floor(Math.random() * moves.length)];
    }
    var result = minimax(state, DEPTH[tier] || 2, -Infinity, Infinity);
    return result.move || moves[Math.floor(Math.random() * moves.length)];
  }

  function createBot(tier) {
    var persona = GA.BotPersonas.get(tier);
    persona.pickMove = function (state) { return botMove(state, tier); };
    return persona;
  }

  GA.Chess = {
    WHITE: WHITE, BLACK: BLACK,
    newGame: newGame,
    generateLegalMoves: generateLegalMoves,
    applyMove: applyMove,
    gameStatus: gameStatus,
    isInCheck: isInCheck,
    createBot: createBot
  };
})(window.GameArena = window.GameArena || {});
