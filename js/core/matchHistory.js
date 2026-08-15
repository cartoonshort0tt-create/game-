(function (GA) {
  'use strict';

  var KEY = 'gamearena_match_history_v1';
  var MAX_ENTRIES = 30;

  function load() {
    var raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  var MatchHistory = {
    getAll: function () {
      return load();
    },
    record: function (entry) {
      var list = load();
      list.unshift(Object.assign({ at: Date.now() }, entry));
      if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
      save(list);
      return list;
    }
  };

  GA.MatchHistory = MatchHistory;
})(window.GameArena = window.GameArena || {});
