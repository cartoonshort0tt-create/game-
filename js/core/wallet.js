(function (GA) {
  'use strict';

  var KEY = 'gamearena_wallet_v1';
  var STARTING_BALANCE = 500;
  var DAILY_BONUS = 100;
  var FIRST_WIN_BONUS = 50;

  function freshState() {
    return {
      balance: STARTING_BALANCE,
      transactions: [{ type: 'bonus', amount: STARTING_BALANCE, balanceAfter: STARTING_BALANCE, note: 'Welcome bonus', at: Date.now() }],
      lastDailyBonus: null,
      firstWinDate: null
    };
  }

  function load() {
    var raw = localStorage.getItem(KEY);
    if (!raw) {
      var fresh = freshState();
      save(fresh);
      return fresh;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      var reset = freshState();
      save(reset);
      return reset;
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function logTransaction(state, type, amount, note) {
    state.transactions.unshift({ type: type, amount: amount, balanceAfter: state.balance, note: note, at: Date.now() });
    if (state.transactions.length > 50) state.transactions.length = 50;
  }

  var Wallet = {
    getBalance: function () {
      return load().balance;
    },
    getState: function () {
      return load();
    },
    credit: function (amount, note) {
      var s = load();
      s.balance += amount;
      logTransaction(s, 'credit', amount, note || 'Credit');
      save(s);
      return s.balance;
    },
    debit: function (amount, note) {
      var s = load();
      if (s.balance < amount) return false;
      s.balance -= amount;
      logTransaction(s, 'debit', -amount, note || 'Debit');
      save(s);
      return true;
    },
    canAfford: function (amount) {
      return load().balance >= amount;
    },
    claimDailyBonusIfAvailable: function () {
      var s = load();
      var today = new Date().toDateString();
      if (s.lastDailyBonus === today) return null;
      s.lastDailyBonus = today;
      s.balance += DAILY_BONUS;
      logTransaction(s, 'bonus', DAILY_BONUS, 'Daily login bonus');
      save(s);
      return DAILY_BONUS;
    },
    claimFirstWinBonusIfAvailable: function () {
      var s = load();
      var today = new Date().toDateString();
      if (s.firstWinDate === today) return null;
      s.firstWinDate = today;
      s.balance += FIRST_WIN_BONUS;
      logTransaction(s, 'bonus', FIRST_WIN_BONUS, 'First win of the day');
      save(s);
      return FIRST_WIN_BONUS;
    }
  };

  GA.Wallet = Wallet;
})(window.GameArena = window.GameArena || {});
