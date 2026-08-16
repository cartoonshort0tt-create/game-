(function (GA) {
  'use strict';

  var ctx = null;
  var muted = localStorage.getItem('gamearena_muted') === '1';

  function ensureCtx() {
    if (!ctx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startTime, duration, type, gainPeak) {
    var c = ensureCtx();
    if (!c) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var t0 = c.currentTime + startTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(gainPeak || 0.12, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  function noiseBurst(startTime, duration, gainPeak) {
    var c = ensureCtx();
    if (!c) return;
    var size = Math.max(1, Math.floor(c.sampleRate * duration));
    var buffer = c.createBuffer(1, size, c.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    var src = c.createBufferSource();
    src.buffer = buffer;
    var gain = c.createGain();
    var t0 = c.currentTime + startTime;
    gain.gain.setValueAtTime(gainPeak || 0.1, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(gain).connect(c.destination);
    src.start(t0);
  }

  var SOUNDS = {
    click: function () { tone(520, 0, 0.06, 'square', 0.05); },
    shuffle: function () { tone(300 + Math.random() * 120, 0, 0.035, 'square', 0.025); },
    select: function () { tone(700, 0, 0.08, 'sine', 0.07); },
    open: function () { tone(500, 0, 0.05, 'sine', 0.05); tone(680, 0.04, 0.07, 'sine', 0.05); },
    place: function () { tone(320, 0, 0.07, 'square', 0.08); tone(470, 0.04, 0.08, 'square', 0.06); },
    move: function () { tone(400, 0, 0.09, 'triangle', 0.09); },
    capture: function () { noiseBurst(0, 0.12, 0.13); tone(170, 0, 0.16, 'sawtooth', 0.09); },
    dice: function () { noiseBurst(0, 0.2, 0.09); },
    flip: function () { tone(500, 0, 0.05, 'sine', 0.05); tone(650, 0.05, 0.05, 'sine', 0.05); tone(800, 0.1, 0.08, 'sine', 0.05); },
    reveal: function () { tone(620, 0, 0.05, 'sine', 0.07); tone(320, 0.05, 0.08, 'sine', 0.05); },
    coin: function () { tone(880, 0, 0.08, 'sine', 0.08); tone(1320, 0.06, 0.12, 'sine', 0.07); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.11, 0.22, 'triangle', 0.1); }); },
    lose: function () { [400, 340, 280].forEach(function (f, i) { tone(f, i * 0.13, 0.24, 'sawtooth', 0.08); }); },
    draw: function () { tone(440, 0, 0.16, 'sine', 0.08); tone(440, 0.2, 0.16, 'sine', 0.06); },
    notify: function () { tone(660, 0, 0.07, 'sine', 0.07); tone(880, 0.08, 0.1, 'sine', 0.06); }
  };

  var Sfx = {
    play: function (name) {
      if (muted) return;
      try {
        var fn = SOUNDS[name];
        if (fn) fn();
      } catch (e) { /* Web Audio unavailable — fail silently, sound is non-essential */ }
    },
    isMuted: function () { return muted; },
    setMuted: function (value) {
      muted = !!value;
      localStorage.setItem('gamearena_muted', muted ? '1' : '0');
    },
    toggleMuted: function () {
      Sfx.setMuted(!muted);
      return muted;
    },
    unlock: function () { ensureCtx(); }
  };

  GA.Sfx = Sfx;

  ['pointerdown', 'keydown'].forEach(function (evt) {
    document.addEventListener(evt, function once() {
      Sfx.unlock();
      document.removeEventListener(evt, once);
    }, { once: true });
  });
})(window.GameArena = window.GameArena || {});
