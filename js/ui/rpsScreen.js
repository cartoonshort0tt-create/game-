(function (GA) {
  'use strict';

  var $ = GA.$;
  var WIN_TARGET = 3;
  var CADENCE_WORDS = ['Rock…', 'Paper…', 'Scissors…', 'Shoot!'];
  var match = null; // { bot, stake, playerWins, botWins, over }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderDots(container, wins) {
    container.innerHTML = '';
    for (var i = 0; i < WIN_TARGET; i++) {
      var dot = document.createElement('span');
      dot.className = 'score-dot' + (i < wins ? ' filled' : '');
      container.appendChild(dot);
    }
  }

  function resetHands() {
    var pHand = $('rpsPlayerHand');
    var bHand = $('rpsBotHand');
    pHand.innerHTML = GA.Icons.idle();
    bHand.innerHTML = GA.Icons.idle();
    pHand.className = 'rps-hand';
    bHand.className = 'rps-hand';
  }

  function setChoiceButtonsEnabled(enabled) {
    $('rpsChoiceRow').querySelectorAll('.choice-btn').forEach(function (btn) { btn.disabled = !enabled; });
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = { bot: bot, stake: stake, playerWins: 0, botWins: 0, over: false };

    $('rpsPlayerIcon').textContent = profile.avatar.emoji;
    $('rpsPlayerNameLabel').textContent = profile.displayName;
    $('rpsBotIcon').textContent = bot.emoji;
    $('rpsBotNameLabel').textContent = bot.name;
    renderDots($('rpsPlayerDots'), 0);
    renderDots($('rpsBotDots'), 0);
    $('rpsRoundResultText').textContent = 'Make your move!';
    $('rpsRoundResultText').className = 'round-result-text';
    resetHands();
    setChoiceButtonsEnabled(true);

    document.getElementById('screenRps').classList.remove('hidden');
  }

  function playRound(playerChoice) {
    if (!match || match.over) return;
    setChoiceButtonsEnabled(false);

    var pHand = $('rpsPlayerHand');
    var bHand = $('rpsBotHand');
    var resultText = $('rpsRoundResultText');
    pHand.classList.add('charging');
    bHand.classList.add('charging');

    var wordIndex = 0;
    resultText.textContent = CADENCE_WORDS[wordIndex];
    resultText.className = 'round-result-text cadence';
    var cadenceTimer = setInterval(function () {
      wordIndex++;
      if (wordIndex < CADENCE_WORDS.length) resultText.textContent = CADENCE_WORDS[wordIndex];
    }, 260);

    // Rapidly cycle both hands through random choices to build suspense before the real reveal.
    var shuffleTimer = setInterval(function () {
      pHand.innerHTML = GA.Icons[GA.RPS.CHOICES[Math.floor(Math.random() * 3)]]();
      bHand.innerHTML = GA.Icons[GA.RPS.CHOICES[Math.floor(Math.random() * 3)]]();
      GA.Sfx.play('shuffle');
    }, 90);

    setTimeout(function () {
      clearInterval(cadenceTimer);
      clearInterval(shuffleTimer);
      pHand.classList.remove('charging');
      bHand.classList.remove('charging');

      var bot = match.bot;
      var botChoice = bot.nextMove();
      bot.recordPlayerChoice(playerChoice);

      pHand.innerHTML = GA.Icons[playerChoice]();
      bHand.innerHTML = GA.Icons[botChoice]();
      pHand.className = 'rps-hand reveal-flip';
      bHand.className = 'rps-hand reveal-flip';
      $('rpsArena').classList.add('impact-shake');
      GA.Sfx.play('reveal');
      setTimeout(function () { $('rpsArena').classList.remove('impact-shake'); }, 360);

      var outcome = GA.RPS.judgeRound(playerChoice, botChoice);
      if (outcome === 'player') {
        match.playerWins++;
        pHand.className = 'rps-hand reveal-flip glow-win';
        bHand.className = 'rps-hand reveal-flip glow-lose';
        resultText.textContent = capitalize(playerChoice) + ' beats ' + botChoice + ' — you win the round!';
        resultText.className = 'round-result-text win';
        GA.Arena.showToast('🔥 Nice throw!');
      } else if (outcome === 'bot') {
        match.botWins++;
        pHand.className = 'rps-hand reveal-flip glow-lose';
        bHand.className = 'rps-hand reveal-flip glow-win';
        resultText.textContent = capitalize(botChoice) + ' beats ' + playerChoice + ' — round lost.';
        resultText.className = 'round-result-text lose';
        GA.Arena.showToast('💥 ' + match.bot.name + ' takes the round');
      } else {
        pHand.className = 'rps-hand reveal-flip glow-draw';
        bHand.className = 'rps-hand reveal-flip glow-draw';
        resultText.textContent = 'Both chose ' + playerChoice + ' — draw, replay the round.';
        resultText.className = 'round-result-text draw';
        GA.Arena.showToast('🤝 Draw — go again');
      }

      renderDots($('rpsPlayerDots'), match.playerWins);
      renderDots($('rpsBotDots'), match.botWins);

      var matchOver = match.playerWins >= WIN_TARGET || match.botWins >= WIN_TARGET;
      setTimeout(function () {
        if (matchOver) {
          finish(match.playerWins >= WIN_TARGET ? 'win' : 'loss');
        } else {
          resetHands();
          resultText.textContent = 'Make your move!';
          resultText.className = 'round-result-text';
          setChoiceButtonsEnabled(true);
        }
      }, 1500);
    }, 1100);
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
    $('rpsChoiceRow').querySelectorAll('.choice-btn').forEach(function (btn) {
      btn.innerHTML = GA.Icons[btn.dataset.choice]();
    });
    $('rpsChoiceRow').addEventListener('click', function (e) {
      var btn = e.target.closest('.choice-btn');
      if (!btn || btn.disabled) return;
      GA.Sfx.play('select');
      playRound(btn.dataset.choice);
    });
    $('rpsForfeitBtn').addEventListener('click', forfeitMatch);
    $('rpsBackBtn').addEventListener('click', handleBack);
  });

  GA.Games.rps = {
    name: 'Rock · Paper · Scissors',
    createBot: GA.RPS.createBot,
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
