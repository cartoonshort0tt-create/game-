(function (GA) {
  'use strict';

  var $ = GA.$;
  var WIN_TARGET = 3;
  var CADENCE_WORDS = ['Rock…', 'Paper…', 'Scissors…', 'Shoot!'];
  var HAND_EMOJI = { rock: '✊', paper: '🖐️', scissors: '✌️' };
  var CHOICES = ['rock', 'paper', 'scissors'];
  var match = null; // { bot, stake, playerWins, botWins, roundsPlayed, draws, over }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function setTagline(text, cls) {
    var el = $('rpsRoundResultText');
    el.textContent = text;
    el.className = 'neon-tagline round-result-text' + (cls ? ' ' + cls : '');
  }

  function updateScoreNums() {
    $('rpsPlayerScoreNum').textContent = match.playerWins;
    $('rpsBotScoreNum').textContent = match.botWins;
  }

  function updateStatsPanel() {
    $('rpsStatRounds').textContent = match.roundsPlayed;
    $('rpsStatWins').textContent = match.playerWins;
    $('rpsStatLosses').textContent = match.botWins;
    $('rpsStatDraws').textContent = match.draws;
  }

  function resetOrbs() {
    var pOrb = $('rpsPlayerOrb');
    var bOrb = $('rpsBotOrb');
    pOrb.className = 'neon-orb neon-blue-orb';
    bOrb.className = 'neon-orb neon-red-orb';
    $('rpsPlayerHand').textContent = '✊';
    $('rpsBotHand').textContent = '✊';
  }

  function setChoiceButtonsEnabled(enabled) {
    $('rpsChoiceRow').querySelectorAll('.neon-choice-btn').forEach(function (btn) { btn.disabled = !enabled; });
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = { bot: bot, stake: stake, playerWins: 0, botWins: 0, roundsPlayed: 0, draws: 0, over: false };

    $('rpsPlayerIcon').textContent = profile.avatar.emoji;
    $('rpsPlayerNameLabel').textContent = profile.displayName;
    $('rpsBotIcon').textContent = bot.emoji;
    $('rpsBotNameLabel').textContent = bot.name;
    updateScoreNums();
    updateStatsPanel();
    setTagline('Make Your Move!');
    resetOrbs();
    setChoiceButtonsEnabled(true);

    document.getElementById('screenRps').classList.remove('hidden');
  }

  function playRound(playerChoice) {
    if (!match || match.over) return;
    setChoiceButtonsEnabled(false);

    var pOrb = $('rpsPlayerOrb');
    var bOrb = $('rpsBotOrb');
    var pHand = $('rpsPlayerHand');
    var bHand = $('rpsBotHand');
    pOrb.classList.add('charging');
    bOrb.classList.add('charging');

    var wordIndex = 0;
    setTagline(CADENCE_WORDS[wordIndex], 'cadence');
    var cadenceTimer = setInterval(function () {
      wordIndex++;
      if (wordIndex < CADENCE_WORDS.length) setTagline(CADENCE_WORDS[wordIndex], 'cadence');
    }, 260);

    var shuffleTimer = setInterval(function () {
      pHand.textContent = HAND_EMOJI[CHOICES[Math.floor(Math.random() * 3)]];
      bHand.textContent = HAND_EMOJI[CHOICES[Math.floor(Math.random() * 3)]];
      GA.Sfx.play('shuffle');
    }, 90);

    setTimeout(function () {
      clearInterval(cadenceTimer);
      clearInterval(shuffleTimer);
      pOrb.classList.remove('charging');
      bOrb.classList.remove('charging');

      var bot = match.bot;
      var botChoice = bot.nextMove();
      bot.recordPlayerChoice(playerChoice);

      pHand.textContent = HAND_EMOJI[playerChoice];
      bHand.textContent = HAND_EMOJI[botChoice];
      pOrb.className = 'neon-orb neon-blue-orb reveal';
      bOrb.className = 'neon-orb neon-red-orb reveal';
      $('rpsArena').classList.add('impact-shake');
      GA.Sfx.play('reveal');
      setTimeout(function () { $('rpsArena').classList.remove('impact-shake'); }, 360);

      match.roundsPlayed++;
      var outcome = GA.RPS.judgeRound(playerChoice, botChoice);
      if (outcome === 'player') {
        match.playerWins++;
        pOrb.className = 'neon-orb neon-blue-orb glow-win';
        bOrb.className = 'neon-orb neon-red-orb glow-lose';
        setTagline(capitalize(playerChoice) + ' beats ' + botChoice + ' — you win the round!', 'win');
        GA.Arena.showToast('🔥 Nice throw!');
      } else if (outcome === 'bot') {
        match.botWins++;
        pOrb.className = 'neon-orb neon-blue-orb glow-lose';
        bOrb.className = 'neon-orb neon-red-orb glow-win';
        setTagline(capitalize(botChoice) + ' beats ' + playerChoice + ' — round lost.', 'lose');
        GA.Arena.showToast('💥 ' + match.bot.name + ' takes the round');
      } else {
        match.draws++;
        pOrb.className = 'neon-orb neon-blue-orb glow-draw';
        bOrb.className = 'neon-orb neon-red-orb glow-draw';
        setTagline('Both chose ' + playerChoice + ' — draw, replay the round.', 'draw');
        GA.Arena.showToast('🤝 Draw — go again');
      }

      updateScoreNums();
      updateStatsPanel();

      var matchOver = match.playerWins >= WIN_TARGET || match.botWins >= WIN_TARGET;
      setTimeout(function () {
        if (matchOver) {
          finish(match.playerWins >= WIN_TARGET ? 'win' : 'loss');
        } else {
          resetOrbs();
          setTagline('Make your move!');
          setChoiceButtonsEnabled(true);
        }
      }, 1500);
    }, 1100);
  }

  function quickPlay() {
    if (!match || match.over) return;
    var busy = $('rpsChoiceRow').querySelector('.neon-choice-btn').disabled;
    if (busy) return;
    GA.Sfx.play('select');
    playRound(CHOICES[Math.floor(Math.random() * 3)]);
  }

  function forfeitMatch() {
    if (!match || match.over) return;
    if (!confirm('Forfeit this match? ' + (match.stake > 0 ? 'Your staked coins will not be refunded.' : ''))) return;
    finish('loss');
  }

  function handleBack() {
    if (!match || match.over) { GA.Arena.backToLobby('rps'); return; }
    if (match.stake > 0) { forfeitMatch(); return; }
    match.over = true;
    GA.Sfx.play('click');
    GA.Arena.backToLobby('rps');
  }

  function finish(outcome) {
    if (!match || match.over) return;
    match.over = true;
    var scoreLine = 'Final score ' + match.playerWins + ' – ' + match.botWins;
    GA.Arena.finishMatch('rps', match.bot, match.stake, outcome, scoreLine);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('rpsChoiceRow').addEventListener('click', function (e) {
      var btn = e.target.closest('.neon-choice-btn');
      if (!btn || btn.disabled) return;
      GA.Sfx.play('select');
      playRound(btn.dataset.choice);
    });
    $('rpsQuickPlayBtn').addEventListener('click', quickPlay);
    $('rpsForfeitBtn').addEventListener('click', forfeitMatch);
    $('rpsBackBtn').addEventListener('click', handleBack);
  });

  GA.Games.rps = {
    name: 'Rock · Paper · Scissors',
    createBot: GA.RPS.createBot,
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
