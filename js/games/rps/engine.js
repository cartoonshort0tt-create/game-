(function (GA) {
  'use strict';

  var CHOICES = ['rock', 'paper', 'scissors'];
  var EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };

  function beats(a, b) {
    return (a === 'rock' && b === 'scissors') ||
      (a === 'paper' && b === 'rock') ||
      (a === 'scissors' && b === 'paper');
  }

  function randomChoice() {
    return CHOICES[Math.floor(Math.random() * CHOICES.length)];
  }

  function counterTo(choice) {
    if (choice === 'rock') return 'paper';
    if (choice === 'paper') return 'scissors';
    return 'rock';
  }

  var BOT_PROFILES = {
    rookie: { name: 'Pip the Rookie', emoji: '🐣', color: '#95E1D3', adaptChance: 0 },
    skilled: { name: 'Chip the Rival', emoji: '🦝', color: '#F38181', adaptChance: 0.4 },
    master: { name: 'Byte the Sensei', emoji: '🐲', color: '#6C5CE7', adaptChance: 0.75 }
  };

  function createBot(tier) {
    var profile = BOT_PROFILES[tier] || BOT_PROFILES.rookie;
    var history = [];
    return {
      tier: tier,
      name: profile.name,
      emoji: profile.emoji,
      color: profile.color,
      nextMove: function () {
        if (history.length < 2 || Math.random() >= profile.adaptChance) {
          return randomChoice();
        }
        var recent = history.slice(-5);
        var counts = { rock: 0, paper: 0, scissors: 0 };
        recent.forEach(function (c) { counts[c]++; });
        var predicted = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
        return counterTo(predicted);
      },
      recordPlayerChoice: function (choice) {
        history.push(choice);
      }
    };
  }

  function judgeRound(playerChoice, botChoice) {
    if (playerChoice === botChoice) return 'draw';
    return beats(playerChoice, botChoice) ? 'player' : 'bot';
  }

  GA.RPS = {
    CHOICES: CHOICES,
    EMOJI: EMOJI,
    BOT_PROFILES: BOT_PROFILES,
    beats: beats,
    createBot: createBot,
    judgeRound: judgeRound
  };
})(window.GameArena = window.GameArena || {});
