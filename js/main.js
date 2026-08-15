(function () {
  'use strict';

  var GA = window.GameArena;
  var $ = GA.$;

  var GAMES = [
    { id: 'rps', name: 'Rock · Paper · Scissors', icon: '✂️', desc: 'Best of 5 rounds. Fast, fun, no skill floor — pure nerve.' },
    { id: 'coinflip', name: 'Coin Flip', icon: '🪙', desc: 'Call it in the air. Best of 3 flips, winner takes the pot.' },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', icon: '⭕', desc: 'The classic 3x3 grid duel. One game, winner takes all.' },
    { id: 'connect4', name: 'Connect 4', icon: '🔴', desc: 'Line up four before your rival does.' },
    { id: 'chess', name: 'Chess', icon: '♟️', desc: 'The flagship game. Full rules, checkmate to win.' },
    { id: 'ludo', name: 'Ludo', icon: '🎲', desc: 'Race both your tokens home before your rival.' }
  ];

  var HOUSE_KEEP = 0.9; // winner receives 90% of the pot

  var state = {
    activeGame: null,
    selectedTier: 'rookie',
    selectedStake: 0
  };

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

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
      var playable = !!GA.Games[g.id];
      var card = document.createElement('div');
      card.className = 'game-card' + (playable ? '' : ' locked');
      card.innerHTML =
        '<span class="badge ' + (playable ? '' : 'soon') + '">' + (playable ? 'Playable' : 'Coming Soon') + '</span>' +
        '<div class="icon">' + g.icon + '</div>' +
        '<h3>' + g.name + '</h3>' +
        '<p>' + g.desc + '</p>' +
        '<button class="btn ' + (playable ? 'btn-primary' : 'btn-secondary') + '" ' + (playable ? '' : 'disabled') + '>' +
        (playable ? 'Play' : 'Locked') + '</button>';
      if (playable) {
        card.querySelector('button').addEventListener('click', function () { GA.Sfx.play('open'); openStakeModal(g.id); });
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

  function computePayout(stake) {
    return Math.floor(stake * 2 * HOUSE_KEEP);
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
    note.textContent = canAfford
      ? 'Balance: 🪙 ' + balance + '. Win to collect 🪙 ' + computePayout(state.selectedStake) + ' (10% house cut applies).'
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
      ? 'Pot: 🪙 ' + (state.selectedStake * 2) + ' · Winner takes 🪙 ' + computePayout(state.selectedStake)
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
        document.getElementById('screenLobby').classList.add('hidden');
        GA.Games[state.activeGame].begin(bot, state.selectedStake);
        return;
      }
      counter.textContent = count > 0 ? count : 'GO!';
      counter.style.animation = 'none';
      void counter.offsetWidth;
      counter.style.animation = '';
    }, 700);
  }

  function startMatch() {
    var module = GA.Games[state.activeGame];
    var bot = module.createBot(state.selectedTier);
    if (state.selectedStake > 0) {
      var ok = GA.Wallet.debit(state.selectedStake, module.name + ' stake vs ' + bot.name);
      if (!ok) {
        updateStakeBalanceNote();
        return;
      }
      renderHeader();
    }
    playIntroThenStart(bot);
  }

  /* ---------------- Shared match resolution ---------------- */

  function finishMatch(gameId, bot, stake, outcome, scoreLine) {
    var delta = 0;

    if (outcome === 'win') {
      if (stake > 0) {
        var payout = computePayout(stake);
        GA.Wallet.credit(payout, GAMES.filter(function (g) { return g.id === gameId; })[0].name + ' win vs ' + bot.name);
        delta = payout - stake;
      }
      var firstWin = GA.Wallet.claimFirstWinBonusIfAvailable();
      if (firstWin) {
        delta += firstWin;
        setTimeout(function () { GA.Sfx.play('notify'); showToast('🎉 First win of the day! +' + firstWin + ' bonus coins'); }, 600);
      }
    } else if (outcome === 'draw') {
      if (stake > 0) {
        GA.Wallet.credit(stake, gameId + ' draw refund vs ' + bot.name);
      }
      delta = 0;
    } else {
      delta = -stake;
    }

    GA.Profile.recordResult(outcome);
    GA.MatchHistory.record({ game: gameId, opponent: bot.name, tier: bot.tier, stake: stake, result: outcome, coinDelta: delta, score: scoreLine });
    renderHeader();
    showResults(gameId, bot, outcome, delta, scoreLine);
  }

  function showResults(gameId, bot, outcome, delta, scoreLine) {
    document.getElementById('screen' + capitalize(gameId)).classList.add('hidden');
    document.getElementById('screenLobby').classList.remove('hidden');

    $('resultsEmoji').innerHTML = outcome === 'win' ? GA.Icons.trophy() : outcome === 'draw' ? GA.Icons.idle() : GA.Icons.brokenStone();
    var title = $('resultsTitle');
    title.textContent = outcome === 'win' ? 'You Win!' : outcome === 'draw' ? 'Draw' : 'You Lost';
    title.className = 'results-title ' + (outcome === 'win' ? 'win' : outcome === 'draw' ? 'draw' : 'lose');
    $('resultsScoreLine').textContent = scoreLine + ' vs ' + bot.name;

    var deltaEl = $('resultsCoinDelta');
    if (delta === 0) {
      deltaEl.textContent = outcome === 'draw' ? 'Draw — your stake was refunded.' : 'Practice match — no coins changed hands.';
      deltaEl.className = 'coin-delta';
    } else {
      deltaEl.textContent = (delta > 0 ? '+' : '') + delta + ' 🪙';
      deltaEl.className = 'coin-delta ' + (delta > 0 ? 'positive' : 'negative');
    }

    $('resultsOverlay').classList.remove('hidden');
    if (outcome === 'win') {
      GA.Sfx.play('win');
      if (delta > 0) setTimeout(function () { GA.Sfx.play('coin'); }, 550);
      GA.Confetti.burst($('confettiLayer'), 70);
      var flash = document.createElement('div');
      flash.className = 'screen-flash';
      document.body.appendChild(flash);
      setTimeout(function () { flash.remove(); }, 700);
    } else if (outcome === 'loss') {
      GA.Sfx.play('lose');
      $('resultsOverlay').querySelector('.modal-card').classList.add('shake-in');
      setTimeout(function () {
        var card = $('resultsOverlay').querySelector('.modal-card');
        if (card) card.classList.remove('shake-in');
      }, 500);
    } else {
      GA.Sfx.play('draw');
    }
  }

  GA.Arena = {
    finishMatch: finishMatch,
    showToast: showToast,
    computePayout: computePayout,
    HOUSE_KEEP: HOUSE_KEEP,
    backToLobby: function (gameId) {
      document.getElementById('screen' + capitalize(gameId)).classList.add('hidden');
      document.getElementById('screenLobby').classList.remove('hidden');
    }
  };

  /* ---------------- Event wiring ---------------- */

  function updateSoundToggleIcon() {
    $('soundToggleIcon').textContent = GA.Sfx.isMuted() ? '🔇' : '🔊';
  }

  function wireEvents() {
    $('soundToggleBtn').addEventListener('click', function () {
      GA.Sfx.toggleMuted();
      updateSoundToggleIcon();
      GA.Sfx.play('click');
    });

    $('profilePillBtn').addEventListener('click', function () { GA.Sfx.play('open'); openAvatarModal(); });
    $('avatarCloseBtn').addEventListener('click', function () { GA.Sfx.play('click'); $('avatarOverlay').classList.add('hidden'); });
    $('saveProfileBtn').addEventListener('click', function () { GA.Sfx.play('click'); saveProfileFromModal(); });

    $('stakeCloseBtn').addEventListener('click', function () { GA.Sfx.play('click'); $('stakeOverlay').classList.add('hidden'); });
    $('tierRow').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      GA.Sfx.play('select');
      state.selectedTier = chip.dataset.tier;
      $('tierRow').querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('selected', c === chip); });
    });
    $('stakeRow').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      GA.Sfx.play('select');
      state.selectedStake = Number(chip.dataset.stake);
      $('stakeRow').querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('selected', c === chip); });
      updateStakeBalanceNote();
    });
    $('startMatchBtn').addEventListener('click', function () { GA.Sfx.play('click'); startMatch(); });

    $('resultsLobbyBtn').addEventListener('click', function () { GA.Sfx.play('click'); $('resultsOverlay').classList.add('hidden'); });
    $('resultsAgainBtn').addEventListener('click', function () {
      GA.Sfx.play('click');
      $('resultsOverlay').classList.add('hidden');
      openStakeModal(state.activeGame);
    });
  }

  /* ---------------- Boot ---------------- */

  function boot() {
    renderHeader();
    renderGameGrid();
    wireEvents();
    updateSoundToggleIcon();
    var bonus = GA.Wallet.claimDailyBonusIfAvailable();
    if (bonus) {
      renderHeader();
      setTimeout(function () { GA.Sfx.play('notify'); }, 300);
      showToast('☀️ Daily bonus! +' + bonus + ' coins');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
