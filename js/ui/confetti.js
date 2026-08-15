(function (GA) {
  'use strict';

  var COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#00B894', '#FD79A8'];

  function burst(container, count) {
    count = count || 60;
    for (var i = 0; i < count; i++) {
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      piece.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      piece.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
      container.appendChild(piece);
      (function (el) {
        setTimeout(function () { el.remove(); }, 3200);
      })(piece);
    }
  }

  GA.Confetti = { burst: burst };
})(window.GameArena = window.GameArena || {});
