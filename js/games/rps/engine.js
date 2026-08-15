(function (GA) {
  'use strict';

  var CHOICES = ['rock', 'paper', 'scissors'];

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

  var ADAPT_CHANCE = { rookie: 0, skilled: 0.4, master: 0.75 };

  function createBot(tier) {
    var persona = GA.BotPersonas.get(tier);
    var adaptChance = ADAPT_CHANCE[tier] || 0;
    var history = [];
    persona.nextMove = function () {
      if (history.length < 2 || Math.random() >= adaptChance) {
        return randomChoice();
      }
      var recent = history.slice(-5);
      var counts = { rock: 0, paper: 0, scissors: 0 };
      recent.forEach(function (c) { counts[c]++; });
      var predicted = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
      return counterTo(predicted);
    };
    persona.recordPlayerChoice = function (choice) {
      history.push(choice);
    };
    return persona;
  }

  function judgeRound(playerChoice, botChoice) {
    if (playerChoice === botChoice) return 'draw';
    return beats(playerChoice, botChoice) ? 'player' : 'bot';
  }

  GA.RPS = {
    CHOICES: CHOICES,
    beats: beats,
    createBot: createBot,
    judgeRound: judgeRound
  };
})(window.GameArena = window.GameArena || {});
