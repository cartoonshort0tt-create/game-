(function (GA) {
  'use strict';

  var ROWS = 6;
  var COLS = 7;
  var PLAYER = 'P';
  var BOT = 'B';

  function emptyGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) g.push(new Array(COLS).fill(null));
    return g;
  }

  function validColumns(grid) {
    var cols = [];
    for (var c = 0; c < COLS; c++) if (!grid[0][c]) cols.push(c);
    return cols;
  }

  function dropPiece(grid, col, symbol) {
    for (var r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][col]) {
        grid[r][col] = symbol;
        return r;
      }
    }
    return -1;
  }

  function isFull(grid) {
    return validColumns(grid).length === 0;
  }

  function checkWinner(grid) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var symbol = grid[r][c];
        if (!symbol) continue;
        for (var d = 0; d < dirs.length; d++) {
          var dr = dirs[d][0], dc = dirs[d][1];
          var cells = [[r, c]];
          var ok = true;
          for (var step = 1; step < 4; step++) {
            var rr = r + dr * step, cc = c + dc * step;
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || grid[rr][cc] !== symbol) { ok = false; break; }
            cells.push([rr, cc]);
          }
          if (ok) return { symbol: symbol, cells: cells };
        }
      }
    }
    return null;
  }

  function evaluateWindow(cells, symbol) {
    var opp = symbol === BOT ? PLAYER : BOT;
    var count = 0, oppCount = 0, empty = 0;
    cells.forEach(function (v) {
      if (v === symbol) count++;
      else if (v === opp) oppCount++;
      else empty++;
    });
    if (count === 4) return 100000;
    if (oppCount === 4) return -100000;
    if (oppCount > 0) return 0;
    if (count === 3 && empty === 1) return 50;
    if (count === 2 && empty === 2) return 8;
    return 0;
  }

  function scorePosition(grid, symbol) {
    var score = 0;
    for (var r = 0; r < ROWS; r++) score += (grid[r][3] === symbol ? 4 : 0);

    for (var r2 = 0; r2 < ROWS; r2++) {
      for (var c = 0; c <= COLS - 4; c++) {
        score += evaluateWindow([grid[r2][c], grid[r2][c + 1], grid[r2][c + 2], grid[r2][c + 3]], symbol);
      }
    }
    for (var c2 = 0; c2 < COLS; c2++) {
      for (var r3 = 0; r3 <= ROWS - 4; r3++) {
        score += evaluateWindow([grid[r3][c2], grid[r3 + 1][c2], grid[r3 + 2][c2], grid[r3 + 3][c2]], symbol);
      }
    }
    for (var r4 = 0; r4 <= ROWS - 4; r4++) {
      for (var c4 = 0; c4 <= COLS - 4; c4++) {
        score += evaluateWindow([grid[r4][c4], grid[r4 + 1][c4 + 1], grid[r4 + 2][c4 + 2], grid[r4 + 3][c4 + 3]], symbol);
        score += evaluateWindow([grid[r4 + 3][c4], grid[r4 + 2][c4 + 1], grid[r4 + 1][c4 + 2], grid[r4][c4 + 3]], symbol);
      }
    }
    return score;
  }

  function minimax(grid, depth, alpha, beta, maximizing) {
    var win = checkWinner(grid);
    var cols = validColumns(grid);
    if (win || depth === 0 || cols.length === 0) {
      if (win) return { score: win.symbol === BOT ? 1000000 : -1000000 };
      if (cols.length === 0) return { score: 0 };
      return { score: scorePosition(grid, BOT) };
    }

    var order = cols.slice().sort(function (a, b) { return Math.abs(a - 3) - Math.abs(b - 3); });

    if (maximizing) {
      var best = { score: -Infinity, column: order[0] };
      for (var i = 0; i < order.length; i++) {
        var c = order[i];
        var r = dropPiece(grid, c, BOT);
        var result = minimax(grid, depth - 1, alpha, beta, false);
        grid[r][c] = null;
        if (result.score > best.score) best = { score: result.score, column: c };
        alpha = Math.max(alpha, best.score);
        if (alpha >= beta) break;
      }
      return best;
    } else {
      var worst = { score: Infinity, column: order[0] };
      for (var j = 0; j < order.length; j++) {
        var c2 = order[j];
        var r2 = dropPiece(grid, c2, PLAYER);
        var result2 = minimax(grid, depth - 1, alpha, beta, true);
        grid[r2][c2] = null;
        if (result2.score < worst.score) worst = { score: result2.score, column: c2 };
        beta = Math.min(beta, worst.score);
        if (alpha >= beta) break;
      }
      return worst;
    }
  }

  var DEPTH = { rookie: 0, skilled: 3, master: 5 };

  function botMove(grid, tier) {
    var cols = validColumns(grid);
    if (tier === 'rookie') {
      return cols[Math.floor(Math.random() * cols.length)];
    }
    return minimax(grid, DEPTH[tier] || 3, -Infinity, Infinity, true).column;
  }

  function createBot(tier) {
    var persona = GA.BotPersonas.get(tier);
    persona.pickColumn = function (grid) { return botMove(grid, tier); };
    return persona;
  }

  GA.Connect4 = {
    ROWS: ROWS, COLS: COLS, PLAYER: PLAYER, BOT: BOT,
    emptyGrid: emptyGrid, validColumns: validColumns, dropPiece: dropPiece,
    isFull: isFull, checkWinner: checkWinner, createBot: createBot
  };
})(window.GameArena = window.GameArena || {});
