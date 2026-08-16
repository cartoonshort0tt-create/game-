(function (GA) {
  'use strict';

  var $ = GA.$;
  var WIN_TARGET = 2;
  var match = null; // { bot, stake, playerWins, botWins, over }

  function renderDots(container, wins) {
    container.innerHTML = '';
    for (var i = 0; i < WIN_TARGET; i++) {
      var dot = document.createElement('span');
      dot.className = 'score-dot' + (i < wins ? ' filled' : '');
      container.appendChild(dot);
    }
  }

  function setCoinFace(face) {
    $('coinDisc').innerHTML = face === 'heads' ? GA.Icons.coinHeads() : GA.Icons.coinTails();
  }

  function setCallButtonsEnabled(enabled) {
    $('coinflipChoiceRow').querySelectorAll('.choice-btn').forEach(function (btn) { btn.disabled = !enabled; });
  }

  function begin(bot, stake) {
    var profile = GA.Profile.get();
    match = { bot: bot, stake: stake, playerWins: 0, botWins: 0, over: false };

    $('coinflipPlayerIcon').textContent = profile.avatar.emoji;
    $('coinflipPlayerNameLabel').textContent = profile.displayName;
    $('coinflipBotIcon').textContent = bot.emoji;
    $('coinflipBotNameLabel').textContent = bot.name;
    renderDots($('coinflipPlayerDots'), 0);
    renderDots($('coinflipBotDots'), 0);
    $('coinflipRoundResultText').textContent = 'Call it in the air!';
    $('coinflipRoundResultText').className = 'round-result-text';
    setCoinFace('heads');
    $('coinDisc').className = 'coin-disc';
    setCallButtonsEnabled(true);

    document.getElementById('screenCoinflip').classList.remove('hidden');
  }

  function playRound(call) {
    if (!match || match.over) return;
    setCallButtonsEnabled(false);

    var disc = $('coinDisc');
    var resultText = $('coinflipRoundResultText');
    disc.className = 'coin-disc spinning';
    resultText.textContent = 'Flipping…';
    resultText.className = 'round-result-text cadence';
    GA.Sfx.play('flip');

    var shuffleTimer = setInterval(function () {
      setCoinFace(Math.random() < 0.5 ? 'heads' : 'tails');
      GA.Sfx.play('shuffle');
    }, 90);

    setTimeout(function () {
      clearInterval(shuffleTimer);
      var landed = GA.CoinFlip.flip();
      disc.className = 'coin-disc landed-' + landed;
      setCoinFace(landed);
      GA.Sfx.play('reveal');

      var playerCorrect = call === landed;
      if (playerCorrect) {
        match.playerWins++;
        resultText.textContent = 'It landed on ' + landed + ' — you called it! Round won.';
        resultText.className = 'round-result-text win';
        GA.Arena.showToast('🔥 Called it!');
      } else {
        match.botWins++;
        resultText.textContent = 'It landed on ' + landed + ' — ' + match.bot.name + ' takes the round.';
        resultText.className = 'round-result-text lose';
        GA.Arena.showToast('💥 ' + match.bot.name + ' takes the round');
      }

      renderDots($('coinflipPlayerDots'), match.playerWins);
      renderDots($('coinflipBotDots'), match.botWins);

      var matchOver = match.playerWins >= WIN_TARGET || match.botWins >= WIN_TARGET;
      setTimeout(function () {
        if (matchOver) {
          finish(match.playerWins >= WIN_TARGET ? 'win' : 'loss');
        } else {
          resultText.textContent = 'Call it in the air!';
          resultText.className = 'round-result-text';
          setCallButtonsEnabled(true);
        }
      }, 1300);
    }, 900);
  }

  function forfeitMatch() {
    if (!match || match.over) return;
    if (!confirm('Forfeit this match? ' + (match.stake > 0 ? 'Your staked coins will not be refunded.' : ''))) return;
    finish('loss');
  }

  function handleBack() {
    if (!match || match.over) { GA.Arena.backToLobby('coinflip'); return; }
    if (match.stake > 0) { forfeitMatch(); return; }
    match.over = true;
    GA.Sfx.play('click');
    GA.Arena.backToLobby('coinflip');
  }

  function finish(outcome) {
    if (!match || match.over) return;
    match.over = true;
    var scoreLine = 'Final score ' + match.playerWins + ' – ' + match.botWins;
    GA.Arena.finishMatch('coinflip', match.bot, match.stake, outcome, scoreLine);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('coinflipChoiceRow').addEventListener('click', function (e) {
      var btn = e.target.closest('.choice-btn');
      if (!btn || btn.disabled) return;
      GA.Sfx.play('select');
      playRound(btn.dataset.call);
    });
    $('coinflipForfeitBtn').addEventListener('click', forfeitMatch);
    $('coinflipBackBtn').addEventListener('click', handleBack);
  });

  GA.Games.coinflip = {
    name: 'Coin Flip',
    createBot: GA.CoinFlip ? GA.CoinFlip.createBot : function (tier) { return GA.BotPersonas.get(tier); },
    begin: begin
  };
})(window.GameArena = window.GameArena || {});
