(function (GA) {
  'use strict';

  var KEY = 'gamearena_profile_v1';
  var ADJECTIVES = ['Swift', 'Clever', 'Brave', 'Lucky', 'Sly', 'Mighty', 'Chill', 'Turbo', 'Fuzzy', 'Nimble'];
  var ANIMALS = ['Fox', 'Panda', 'Otter', 'Falcon', 'Tiger', 'Koala', 'Wolf', 'Shark', 'Rabbit', 'Dragon'];
  var EMOJIS = ['🦊', '🐼', '🦦', '🦅', '🐯', '🐨', '🐺', '🦈', '🐰', '🐲', '🐸', '🐵', '🐧', '🦁', '🐶', '🐱'];
  var COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#00B894', '#FD79A8', '#0984E3', '#E17055'];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomName() {
    return pick(ADJECTIVES) + pick(ANIMALS) + Math.floor(Math.random() * 90 + 10);
  }

  function freshProfile() {
    return {
      id: 'p_' + Math.random().toString(36).slice(2, 10),
      displayName: randomName(),
      avatar: { emoji: pick(EMOJIS), color: pick(COLORS) },
      stats: { wins: 0, losses: 0, draws: 0, arenaRating: 1000 },
      createdAt: Date.now()
    };
  }

  function load() {
    var raw = localStorage.getItem(KEY);
    if (!raw) {
      var fresh = freshProfile();
      save(fresh);
      return fresh;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      var reset = freshProfile();
      save(reset);
      return reset;
    }
  }

  function save(p) {
    localStorage.setItem(KEY, JSON.stringify(p));
  }

  var Profile = {
    EMOJIS: EMOJIS,
    COLORS: COLORS,
    get: function () {
      return load();
    },
    updateAvatar: function (emoji, color) {
      var p = load();
      p.avatar = { emoji: emoji, color: color };
      save(p);
      return p;
    },
    updateName: function (name) {
      var p = load();
      var clean = (name || '').trim().slice(0, 20);
      if (clean) p.displayName = clean;
      save(p);
      return p;
    },
    recordResult: function (outcome) {
      var p = load();
      if (outcome === 'win') {
        p.stats.wins++;
        p.stats.arenaRating += 15;
      } else if (outcome === 'loss') {
        p.stats.losses++;
        p.stats.arenaRating = Math.max(0, p.stats.arenaRating - 10);
      } else {
        p.stats.draws++;
      }
      save(p);
      return p;
    }
  };

  GA.Profile = Profile;
})(window.GameArena = window.GameArena || {});
