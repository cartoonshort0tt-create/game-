(function (GA) {
  'use strict';

  var TRACK_LENGTH = 24;
  var BASE = -1;
  var HOME = 24;
  var PLAYER = 'P';
  var BOT = 'B';

  function newGame() {
    return { tokens: { P: [BASE, BASE], B: [BASE, BASE] }, turn: PLAYER, sixStreak: 0 };
  }

  function rollDie() { return 1 + Math.floor(Math.random() * 6); }

  function isSafeSquare(pos) { return pos >= 0 && pos < TRACK_LENGTH && pos % 4 === 0; }

  function movableTokens(state, color, roll) {
    var tokens = state.tokens[color];
    var result = [];
    for (var i = 0; i < tokens.length; i++) {
      var pos = tokens[i];
      if (pos === HOME) continue;
      if (pos === BASE) { if (roll === 6) result.push(i); continue; }
      result.push(i);
    }
    return result;
  }

  function applyTokenMove(state, color, tokenIdx, roll) {
    var opp = color === PLAYER ? BOT : PLAYER;
    var tokens = state.tokens[color];
    var pos = tokens[tokenIdx];
    var newPos;
    if (pos === BASE) {
      newPos = 0;
    } else {
      newPos = Math.min(pos + roll, HOME);
    }

    var captured = false;
    if (newPos !== HOME && !isSafeSquare(newPos)) {
      var oppTokens = state.tokens[opp];
      for (var i = 0; i < oppTokens.length; i++) {
        if (oppTokens[i] === newPos) { oppTokens[i] = BASE; captured = true; }
      }
    }

    tokens[tokenIdx] = newPos;
    return { captured: captured, finished: newPos === HOME };
  }

  function hasWon(state, color) {
    return state.tokens[color].every(function (p) { return p === HOME; });
  }

  function chooseBotToken(state, roll, movable) {
    var tokens = state.tokens[BOT];
    var playerTokens = state.tokens[PLAYER];

    var capturing = movable.filter(function (i) {
      var pos = tokens[i] === BASE ? 0 : Math.min(tokens[i] + roll, HOME);
      return pos !== HOME && !isSafeSquare(pos) && playerTokens.indexOf(pos) !== -1;
    });
    if (capturing.length) return capturing[0];

    var finishing = movable.filter(function (i) { return tokens[i] !== BASE && tokens[i] + roll >= HOME; });
    if (finishing.length) return finishing[0];

    if (roll === 6) {
      var fromBase = movable.filter(function (i) { return tokens[i] === BASE; });
      if (fromBase.length) return fromBase[0];
    }

    var onTrack = movable.filter(function (i) { return tokens[i] !== BASE; });
    if (onTrack.length) {
      onTrack.sort(function (a, b) { return tokens[b] - tokens[a]; });
      return onTrack[0];
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
    TRACK_LENGTH: TRACK_LENGTH, BASE: BASE, HOME: HOME, PLAYER: PLAYER, BOT: BOT,
    newGame: newGame, rollDie: rollDie, isSafeSquare: isSafeSquare,
    movableTokens: movableTokens, applyTokenMove: applyTokenMove, hasWon: hasWon,
    createBot: createBot
  };
})(window.GameArena = window.GameArena || {});
