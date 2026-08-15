(function () {
  'use strict';

  var GA = window.GameArena;
  var $ = function (id) { return document.getElementById(id); };

  var GAMES = [
    { id: 'rps', name: 'Rock · Paper · Scissors', icon: '✂️', desc: 'Best of 5 rounds. Fast, fun, no skill floor — pure nerve.', playable: true },
    { id: 'coinflip', name: 'Coin Flip', icon: '🪙', desc: 'Heads or tails, winner takes the pot.', playable: false },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', icon: '⭕', desc: 'The classic 3x3 grid duel.', playable: false },
    { id: 'connect4', name: 'Connect 4', icon: '🔴', desc: 'Line up four before your rival does.', playable: false },
    { id: 'chess', name: 'Chess', icon: '♟️', desc: 'The flagship game. Full rules, bot powered by Stockfish.', playable: false },
    { id: 'ludo', name: 'Ludo', icon: '🎲', desc: 'Race your tokens home — up to 4 players.', playable: false }
  ];

  var WIN_TARGET = 3;
  var HOUSE_KEEP = 0.9; // winner receives 90% of the pot

  var state = {
    activeGame: null,
    selectedTier: 'rookie',
    selectedStake: 0,
    match: null // { tier, stake, bot, playerWins, botWins, round, over }
  };

  /* ---------------- Header ---------------- */

  function renderHeader() {
    var profile = GA.Profile.get();
    var avatarEl = $('profileAvatarIcon');
    avatarEl.textContent = profile.avatar.emoji;
    avatarEl.style.background = profile.avatar.color;
    $('profileNameLabel').textContent = profile.displayName;
    $('walletBalanceLabel').textContent = GA.Wallet.getBalance();
  }

  /* ---------------- Toast ---------------- */

  var toastTimer = null;
  function showToast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add('hidden'); }, 3200);
  }

  /* ---------------- Lobby grid ---------------- */

  function renderGameGrid() {
    var grid = $('gameGrid');
    grid.innerHTML = '';
    GAMES.forEach(function (g) {
      var card = document.createElement('div');
      card.className = 'game-card' + (g.playable ? '' : ' locked');
      card.innerHTML =
        '<span class="badge ' + (g.playable ? '' : 'soon') + '">' + (g.playable ? 'Playable' : 'Coming Soon') + '</span>' +
        '<div class="icon">' + g.icon + '</div>' +
        '<h3>' + g.name + '</h3>' +
        '<p>' + g.desc + '</p>' +
        '<button class="btn ' + (g.playable ? 'btn-primary' : 'btn-secondary') + '" ' + (g.playable ? '' : 'disabled') + '>' +
        (g.playable ? 'Play' : 'Locked') + '</button>';
      if (g.playable) {
        card.querySelector('button').addEventListener('click', function () { openStakeModal(g.id); });
      }
      grid.appendChild(card);
    });
  }

  /* ---------------- Avatar / profile modal ---------------- */

  function openAvatarModal() {
    var profile = GA.Profile.get();
    $('nameInput').value = profile.displayName;
    $('statWins').textContent = profile.stats.wins + 'W';
    $('statLosses').textContent = profile.stats.losses + 'L';
    $('statDraws').textContent = profile.stats.draws + 'D';
    $('statRating').textContent = profile.stats.arenaRating + ' rating';

    var emojiGrid = $('emojiGrid');
    emojiGrid.innerHTML = '';
    GA.Profile.EMOJIS.forEach(function (emoji) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-swatch' + (emoji === profile.avatar.emoji ? ' selected' : '');
      btn.textContent = emoji;
      btn.addEventListener('click', function () {
        emojiGrid.querySelectorAll('.emoji-swatch').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
      emojiGrid.appendChild(btn);
    });

    var colorRow = $('colorRow');
    colorRow.innerHTML = '';
    GA.Profile.COLORS.forEach(function (color) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch' + (color === profile.avatar.color ? ' selected' : '');
      btn.style.background = color;
      btn.addEventListener('click', function () {
        colorRow.querySelectorAll('.color-swatch').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
      colorRow.appendChild(btn);
    });

    $('avatarOverlay').classList.remove('hidden');
  }

  function saveProfileFromModal() {
    var selectedEmojiBtn = $('emojiGrid').querySelector('.emoji-swatch.selected');
    var selectedColorBtn = $('colorRow').querySelector('.color-swatch.selected');
    var current = GA.Profile.get();
    GA.Profile.updateAvatar(
      selectedEmojiBtn ? selectedEmojiBtn.textContent : current.avatar.emoji,
      selectedColorBtn ? selectedColorBtn.style.background : current.avatar.color
    );
    GA.Profile.updateName($('nameInput').value);
    $('avatarOverlay').classList.add('hidden');
    renderHeader();
  }

  /* ---------------- Stake modal ---------------- */

  function openStakeModal(gameId) {
    state.activeGame = gameId;
    state.selectedTier = 'rookie';
    state.selectedStake = 0;
    var game = GAMES.filter(function (g) { return g.id === gameId; })[0];
    $('stakeModalTitle').textContent = game.name;

    $('tierRow').querySelectorAll('.chip').forEach(function (chip) {
      chip.classList.toggle('selected', chip.dataset.tier === state.selectedTier);
    });
    $('stakeRow').querySelectorAll('.chip').forEach(function (chip) {
      chip.classList.toggle('selected', Number(chip.dataset.stake) === state.selectedStake);
    });
    updateStakeBalanceNote();
    $('stakeOverlay').classList.remove('hidden');
  }

  function updateStakeBalanceNote() {
    var note = $('stakeBalanceNote');
    var balance = GA.Wallet.getBalance();
    var startBtn = $('startMatchBtn');
    if (state.selectedStake === 0) {
      note.textContent = 'Practice mode — no coins at risk, no payout.';
      note.classList.remove('warn');
      startBtn.disabled = false;
      return;
    }
    var canAfford = balance >= state.selectedStake;
    var potentialWin = Math.floor(state.selectedStake * 2 * HOUSE_KEEP);
    note.textContent = canAfford
      ? 'Balance: 🪙 ' + balance + '. Win to collect 🪙 ' + potentialWin + ' (10% house cut applies).'
      : 'Not enough coins — balance is 🪙 ' + balance + '.';
    note.classList.toggle('warn', !canAfford);
    startBtn.disabled = !canAfford;
  }

  /* ---------------- Match intro ---------------- */

  function playIntroThenStart(bot) {
    var profile = GA.Profile.get();
    var pAv = $('introPlayerAvatar');
    pAv.textContent = profile.avatar.emoji;
    pAv.style.background = profile.avatar.color;
    var bAv = $('introBotAvatar');
    bAv.textContent = bot.emoji;
    bAv.style.background = bot.color;
    $('introNamesLine').textContent = profile.displayName + ' vs ' + bot.name;
    $('introStakeLine').textContent = state.selectedStake > 0
      ? 'Pot: 🪙 ' + (state.selectedStake * 2) + ' · Winner takes 🪙 ' + Math.floor(state.selectedStake * 2 * HOUSE_KEEP)
      : 'Practice match — no stake';

    $('stakeOverlay').classList.add('hidden');
    $('introOverlay').classList.remove('hidden');

    var count = 3;
    var counter = $('introCountdown');
    counter.textContent = count;
    var timer = setInterval(function () {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        $('introOverlay').classList.add('hidden');
        beginRpsMatch(bot);
        return;
      }
      counter.textContent = count > 0 ? count : 'GO!';
      counter.style.animation = 'none';
      void counter.offsetWidth;
      counter.style.animation = '';
    }, 700);
  }

  function startMatch() {
    var bot = GA.RPS.createBot(state.selectedTier);
    if (state.selectedStake > 0) {
      var ok = GA.Wallet.debit(state.selectedStake, 'RPS stake vs ' + bot.name);
      if (!ok) {
        updateStakeBalanceNote();
        return;
      }
      renderHeader();
    }
    playIntroThenStart(bot);
  }

  /* ---------------- RPS gameplay ---------------- */

  function renderDots(container, wins) {
    container.innerHTML = '';
    for (var i = 0; i < WIN_TARGET; i++) {
      var dot = document.createElement('span');
      dot.className = 'score-dot' + (i < wins ? ' filled' : '');
      container.appendChild(dot);
    }
  }

  function beginRpsMatch(bot) {
    var profile = GA.Profile.get();
    state.match = { bot: bot, stake: state.selectedStake, playerWins: 0, botWins: 0, over: false };

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

    document.getElementById('screenLobby').classList.add('hidden');
    document.getElementById('screenRps').classList.remove('hidden');
  }

  function renderChoiceButtons() {
    $('rpsChoiceRow').querySelectorAll('.choice-btn').forEach(function (btn) {
      btn.innerHTML = GA.Icons[btn.dataset.choice]();
    });
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
    $('rpsChoiceRow').querySelectorAll('.choice-btn').forEach(function (btn) {
      btn.disabled = !enabled;
    });
  }

  var CADENCE_WORDS = ['Rock…', 'Paper…', 'Scissors…', 'Shoot!'];

  function playRound(playerChoice) {
    if (!state.match || state.match.over) return;
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

    setTimeout(function () {
      clearInterval(cadenceTimer);
      pHand.classList.remove('charging');
      bHand.classList.remove('charging');

      var bot = state.match.bot;
      var botChoice = bot.nextMove();
      bot.recordPlayerChoice(playerChoice);

      pHand.innerHTML = GA.Icons[playerChoice]();
      bHand.innerHTML = GA.Icons[botChoice]();
      pHand.className = 'rps-hand reveal-flip';
      bHand.className = 'rps-hand reveal-flip';
      $('rpsArena').classList.add('impact-shake');
      setTimeout(function () { $('rpsArena').classList.remove('impact-shake'); }, 360);

      var outcome = GA.RPS.judgeRound(playerChoice, botChoice);
      if (outcome === 'player') {
        state.match.playerWins++;
        pHand.className = 'rps-hand reveal-flip glow-win';
        bHand.className = 'rps-hand reveal-flip glow-lose';
        resultText.textContent = capitalize(playerChoice) + ' beats ' + botChoice + ' — you win the round!';
        resultText.className = 'round-result-text win';
      } else if (outcome === 'bot') {
        state.match.botWins++;
        pHand.className = 'rps-hand reveal-flip glow-lose';
        bHand.className = 'rps-hand reveal-flip glow-win';
        resultText.textContent = capitalize(botChoice) + ' beats ' + playerChoice + ' — round lost.';
        resultText.className = 'round-result-text lose';
      } else {
        pHand.className = 'rps-hand reveal-flip glow-draw';
        bHand.className = 'rps-hand reveal-flip glow-draw';
        resultText.textContent = 'Both chose ' + playerChoice + ' — draw, replay the round.';
        resultText.className = 'round-result-text draw';
      }

      renderDots($('rpsPlayerDots'), state.match.playerWins);
      renderDots($('rpsBotDots'), state.match.botWins);

      var matchOver = state.match.playerWins >= WIN_TARGET || state.match.botWins >= WIN_TARGET;
      setTimeout(function () {
        if (matchOver) {
          finishMatch(state.match.playerWins >= WIN_TARGET ? 'win' : 'loss');
        } else {
          resetHands();
          resultText.textContent = 'Make your move!';
          resultText.className = 'round-result-text';
          setChoiceButtonsEnabled(true);
        }
      }, 1500);
    }, 1100);
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function forfeitMatch() {
    if (!state.match || state.match.over) return;
    if (!confirm('Forfeit this match? ' + (state.match.stake > 0 ? 'Your staked coins will not be refunded.' : ''))) return;
    finishMatch('loss');
  }

  function finishMatch(outcome) {
    if (!state.match || state.match.over) return;
    state.match.over = true;

    var stake = state.match.stake;
    var bot = state.match.bot;
    var delta = 0;

    if (outcome === 'win') {
      if (stake > 0) {
        var payout = Math.floor(stake * 2 * HOUSE_KEEP);
        GA.Wallet.credit(payout, 'RPS win vs ' + bot.name);
        delta = payout - stake;
      }
      var firstWin = GA.Wallet.claimFirstWinBonusIfAvailable();
      if (firstWin) {
        delta += firstWin;
        setTimeout(function () { showToast('🎉 First win of the day! +' + firstWin + ' bonus coins'); }, 600);
      }
    } else {
      delta = -stake;
    }

    GA.Profile.recordResult(outcome);
    GA.MatchHistory.record({
      game: 'rps', opponent: bot.name, tier: bot.tier, stake: stake,
      result: outcome, coinDelta: delta,
      score: state.match.playerWins + '-' + state.match.botWins
    });
    renderHeader();
    showResults(outcome, delta);
  }

  function showResults(outcome, delta) {
    document.getElementById('screenRps').classList.add('hidden');
    document.getElementById('screenLobby').classList.remove('hidden');

    $('resultsEmoji').innerHTML = outcome === 'win' ? GA.Icons.trophy() : GA.Icons.brokenStone();
    var title = $('resultsTitle');
    title.textContent = outcome === 'win' ? 'You Win!' : 'You Lost';
    title.className = 'results-title ' + (outcome === 'win' ? 'win' : 'lose');
    $('resultsScoreLine').textContent = 'Final score ' + state.match.playerWins + ' – ' + state.match.botWins + ' vs ' + state.match.bot.name;

    var deltaEl = $('resultsCoinDelta');
    if (delta === 0) {
      deltaEl.textContent = 'Practice match — no coins changed hands.';
      deltaEl.className = 'coin-delta';
    } else {
      deltaEl.textContent = (delta > 0 ? '+' : '') + delta + ' 🪙';
      deltaEl.className = 'coin-delta ' + (delta > 0 ? 'positive' : 'negative');
    }

    $('resultsOverlay').classList.remove('hidden');
    if (outcome === 'win') {
      GA.Confetti.burst($('confettiLayer'), 70);
      var flash = document.createElement('div');
      flash.className = 'screen-flash';
      document.body.appendChild(flash);
      setTimeout(function () { flash.remove(); }, 700);
    } else {
      $('resultsOverlay').querySelector('.modal-card').classList.add('shake-in');
      setTimeout(function () {
        var card = $('resultsOverlay').querySelector('.modal-card');
        if (card) card.classList.remove('shake-in');
      }, 500);
    }
  }

  /* ---------------- Event wiring ---------------- */

  function wireEvents() {
    $('profilePillBtn').addEventListener('click', openAvatarModal);
    $('avatarCloseBtn').addEventListener('click', function () { $('avatarOverlay').classList.add('hidden'); });
    $('saveProfileBtn').addEventListener('click', saveProfileFromModal);

    $('stakeCloseBtn').addEventListener('click', function () { $('stakeOverlay').classList.add('hidden'); });
    $('tierRow').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      state.selectedTier = chip.dataset.tier;
      $('tierRow').querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('selected', c === chip); });
    });
    $('stakeRow').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      state.selectedStake = Number(chip.dataset.stake);
      $('stakeRow').querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('selected', c === chip); });
      updateStakeBalanceNote();
    });
    $('startMatchBtn').addEventListener('click', startMatch);

    $('rpsChoiceRow').addEventListener('click', function (e) {
      var btn = e.target.closest('.choice-btn');
      if (!btn || btn.disabled) return;
      playRound(btn.dataset.choice);
    });
    $('rpsForfeitBtn').addEventListener('click', forfeitMatch);

    $('resultsLobbyBtn').addEventListener('click', function () { $('resultsOverlay').classList.add('hidden'); });
    $('resultsAgainBtn').addEventListener('click', function () {
      $('resultsOverlay').classList.add('hidden');
      openStakeModal('rps');
    });
  }

  /* ---------------- Boot ---------------- */

  function boot() {
    renderHeader();
    renderGameGrid();
    renderChoiceButtons();
    wireEvents();
    var bonus = GA.Wallet.claimDailyBonusIfAvailable();
    if (bonus) {
      renderHeader();
      showToast('☀️ Daily bonus! +' + bonus + ' coins');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
