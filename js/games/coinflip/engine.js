(function (GA) {
  'use strict';

  function flip() {
    return Math.random() < 0.5 ? 'heads' : 'tails';
  }

  function createBot(tier) {
    return GA.BotPersonas.get(tier);
  }

  GA.CoinFlip = { flip: flip, createBot: createBot };
})(window.GameArena = window.GameArena || {});
