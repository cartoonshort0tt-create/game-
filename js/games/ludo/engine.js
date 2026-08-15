(function (GA) {
  'use strict';

  // Verified closed-loop 56-cell ring on a 15x15 cross-shaped board (yards 6x6,
  // arms 3-wide, center 3x3). See BLUEPRINT for the derivation/verification method.
  var RING = [
    [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
    [7, 0],
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 6],
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
    [14, 7],
    [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
    [8, 8],
    [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
    [7, 14],
    [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
    [6, 8],
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
    [0, 7],
    [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
    [6, 6]
  ];
  var RING_LEN = RING.length; // 56

  var ENTRY = { P: 4, B: 32 };
  var SAFE_INDEXES = [4, 32, 20, 48]; // both entries + two symmetric star squares

  var STRETCH = {
    P: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
    B: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]]
  };
  var STRETCH_LEN = 6;
  var TOTAL_STEPS = (RING_LEN - 1) + STRETCH_LEN; // 61: relative ring steps + home stretch

  var YARD_SLOTS = {
    P: [[1, 1], [1, 4], [4, 1], [4, 4]],
    B: [[10, 10], [10, 13], [13, 10], [13, 13]]
  };

  var YARD_BOUNDS = {
    red: { r0: 0, r1: 5, c0: 0, c1: 5 },
    green: { r0: 0, r1: 5, c0: 9, c1: 14 },
    yellow: { r0: 9, r1: 14, c0: 9, c1: 14 },
    blue: { r0: 9, r1: 14, c0: 0, c1: 5 }
  };

  function newGame() {
    return {
      tokens: { P: [-1, -1, -1, -1], B: [-1, -1, -1, -1] }, // -1 = base, 0..54 = ring-relative, 55..60 = stretch(0-5), 61 = home
      turn: 'P'
    };
  }

  function rollDie() { return 1 + Math.floor(Math.random() * 6); }

  function globalRingIndex(color, relPos) {
    return (ENTRY[color] + relPos) % RING_LEN;
  }

  function boardCoord(color, pos) {
    if (pos < 0) return null;
    if (pos <= RING_LEN - 2) return RING[globalRingIndex(color, pos)];
    if (pos <= TOTAL_STEPS - 1) return STRETCH[color][pos - (RING_LEN - 1)];
    return null; // home
  }

  function isHome(pos) { return pos === TOTAL_STEPS; }
  function isSafePos(color, pos) {
    if (pos < 0 || pos > RING_LEN - 2) return false;
    return SAFE_INDEXES.indexOf(globalRingIndex(color, pos)) !== -1;
  }

  function movableTokens(state, color, roll) {
    var tokens = state.tokens[color];
    var result = [];
    for (var i = 0; i < tokens.length; i++) {
      var pos = tokens[i];
      if (isHome(pos)) continue;
      if (pos === -1) { if (roll === 6) result.push(i); continue; }
      if (pos + roll <= TOTAL_STEPS) result.push(i);
    }
    return result;
  }

  function applyTokenMove(state, color, tokenIdx, roll) {
    var opp = color === 'P' ? 'B' : 'P';
    var tokens = state.tokens[color];
    var pos = tokens[tokenIdx];
    var newPos = pos === -1 ? 0 : pos + roll;

    var captured = false;
    if (newPos <= RING_LEN - 2 && !isSafePos(color, newPos)) {
      var myGlobal = globalRingIndex(color, newPos);
      var oppTokens = state.tokens[opp];
      for (var i = 0; i < oppTokens.length; i++) {
        var oppPos = oppTokens[i];
        if (oppPos < 0 || oppPos > RING_LEN - 2) continue;
        if (globalRingIndex(opp, oppPos) === myGlobal) { oppTokens[i] = -1; captured = true; }
      }
    }

    tokens[tokenIdx] = newPos;
    return { captured: captured, finished: isHome(newPos) };
  }

  function hasWon(state, color) {
    return state.tokens[color].every(isHome);
  }

  function chooseBotToken(state, roll, movable) {
    var tokens = state.tokens.B;
    var playerTokens = state.tokens.P;

    var capturing = movable.filter(function (i) {
      var newPos = tokens[i] === -1 ? 0 : tokens[i] + roll;
      if (newPos > RING_LEN - 2 || isSafePos('B', newPos)) return false;
      var g = globalRingIndex('B', newPos);
      return playerTokens.some(function (p) { return p >= 0 && p <= RING_LEN - 2 && globalRingIndex('P', p) === g; });
    });
    if (capturing.length) return capturing[0];

    var finishing = movable.filter(function (i) { return tokens[i] !== -1 && tokens[i] + roll === TOTAL_STEPS; });
    if (finishing.length) return finishing[0];

    if (roll === 6) {
      var fromBase = movable.filter(function (i) { return tokens[i] === -1; });
      if (fromBase.length) return fromBase[0];
    }

    var onBoard = movable.filter(function (i) { return tokens[i] !== -1; });
    if (onBoard.length) {
      onBoard.sort(function (a, b) { return tokens[b] - tokens[a]; });
      return onBoard[0];
    }
    return movable[0];
  }

  function createBot(tier) {
    var persona = GA.BotPersonas.get(tier);
    persona.chooseToken = function (state, roll, movable) {
      if (tier === 'rookie') return movable[Math.floor(Math.random() * movable.length)];
      if (tier === 'skilled' && Math.random() < 0.3) return movable[Math.floor(Math.random() * movable.length)];
      return chooseBotToken(state, roll, movable);
    };
    return persona;
  }

  GA.Ludo = {
    RING: RING, RING_LEN: RING_LEN, ENTRY: ENTRY, STRETCH: STRETCH, STRETCH_LEN: STRETCH_LEN,
    TOTAL_STEPS: TOTAL_STEPS, SAFE_INDEXES: SAFE_INDEXES, YARD_SLOTS: YARD_SLOTS, YARD_BOUNDS: YARD_BOUNDS,
    newGame: newGame, rollDie: rollDie, boardCoord: boardCoord, isHome: isHome, isSafePos: isSafePos,
    globalRingIndex: globalRingIndex,
    movableTokens: movableTokens, applyTokenMove: applyTokenMove, hasWon: hasWon,
    createBot: createBot
  };
})(window.GameArena = window.GameArena || {});
