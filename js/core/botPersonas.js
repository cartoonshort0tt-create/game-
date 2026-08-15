(function (GA) {
  'use strict';

  var PERSONAS = {
    rookie: { tier: 'rookie', name: 'Pip the Rookie', emoji: '🐣', color: '#95E1D3' },
    skilled: { tier: 'skilled', name: 'Chip the Rival', emoji: '🦝', color: '#F38181' },
    master: { tier: 'master', name: 'Byte the Sensei', emoji: '🐲', color: '#6C5CE7' }
  };

  GA.BotPersonas = {
    get: function (tier) {
      var p = PERSONAS[tier] || PERSONAS.rookie;
      return { tier: p.tier, name: p.name, emoji: p.emoji, color: p.color };
    }
  };
})(window.GameArena = window.GameArena || {});
