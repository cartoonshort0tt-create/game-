(function (GA) {
  'use strict';

  function svg(inner, extraClass) {
    return '<svg viewBox="0 0 100 100" class="piece-icon' + (extraClass ? ' ' + extraClass : '') +
      '" aria-hidden="true">' + inner + '</svg>';
  }

  var Icons = {
    idle: function () {
      return svg(
        '<ellipse cx="50" cy="90" rx="22" ry="5" fill="#000" opacity="0.18"/>' +
        '<circle cx="50" cy="52" r="25" fill="url(#bladeGrad)" stroke="url(#goldGrad)" stroke-width="2.5" filter="url(#softGlow)"/>' +
        '<circle cx="41" cy="41" r="7" fill="#ffffff" opacity="0.4"/>',
        'icon-idle'
      );
    },
    rock: function () {
      return svg(
        '<ellipse cx="50" cy="90" rx="30" ry="6" fill="#000" opacity="0.25"/>' +
        '<path d="M50 8 L76 24 L88 54 L70 90 L30 90 L12 54 L24 24 Z" fill="url(#stoneGrad)" stroke="url(#goldGrad)" stroke-width="2.5"/>' +
        '<path d="M50 8 L50 90 M24 24 L88 54 M76 24 L12 54" stroke="#000" stroke-opacity="0.18" stroke-width="1.4" fill="none"/>' +
        '<g filter="url(#softGlow)"><path d="M50 32 L50 68 M50 32 L37 50 M50 32 L63 50" stroke="url(#goldGrad)" stroke-width="3.4" stroke-linecap="round" fill="none"/></g>',
        'icon-rock'
      );
    },
    paper: function () {
      return svg(
        '<ellipse cx="50" cy="92" rx="28" ry="5" fill="#000" opacity="0.2"/>' +
        '<rect x="20" y="12" width="60" height="14" rx="7" fill="url(#parchmentGrad)" stroke="url(#goldGrad)" stroke-width="2.2"/>' +
        '<rect x="20" y="74" width="60" height="14" rx="7" fill="url(#parchmentGrad)" stroke="url(#goldGrad)" stroke-width="2.2"/>' +
        '<rect x="26" y="24" width="48" height="52" fill="url(#parchmentGrad)" stroke="url(#goldGrad)" stroke-width="1.6"/>' +
        '<circle cx="27" cy="19" r="5" fill="none" stroke="url(#goldGrad)" stroke-width="1.6"/>' +
        '<circle cx="73" cy="81" r="5" fill="none" stroke="url(#goldGrad)" stroke-width="1.6"/>' +
        '<g stroke="#8a7a52" stroke-width="1.6" stroke-linecap="round" opacity="0.55">' +
        '<line x1="34" y1="36" x2="66" y2="36"/><line x1="34" y1="45" x2="60" y2="45"/>' +
        '<line x1="34" y1="54" x2="66" y2="54"/><line x1="34" y1="63" x2="56" y2="63"/></g>' +
        '<circle cx="65" cy="69" r="6" fill="#7a1f2b" stroke="url(#goldGrad)" stroke-width="1.2"/>',
        'icon-paper'
      );
    },
    scissors: function () {
      return svg(
        '<ellipse cx="50" cy="92" rx="26" ry="5" fill="#000" opacity="0.2"/>' +
        '<g stroke="url(#goldGrad)" stroke-width="2.4" fill="none"><circle cx="30" cy="76" r="12"/><circle cx="70" cy="76" r="12"/></g>' +
        '<path d="M30 76 L82 16 L88 20 L38 80 Z" fill="url(#bladeGrad)" stroke="url(#goldGrad)" stroke-width="1.6"/>' +
        '<path d="M70 76 L18 16 L12 20 L62 80 Z" fill="url(#bladeGrad)" stroke="url(#goldGrad)" stroke-width="1.6"/>' +
        '<circle cx="50" cy="48" r="4.6" fill="url(#goldGrad)"/>',
        'icon-scissors'
      );
    },
    trophy: function () {
      return svg(
        '<ellipse cx="50" cy="92" rx="24" ry="5" fill="#000" opacity="0.2"/>' +
        '<rect x="38" y="78" width="24" height="8" rx="2" fill="url(#goldGrad)"/>' +
        '<rect x="44" y="66" width="12" height="14" fill="url(#goldGrad)"/>' +
        '<path d="M32 24 h36 v18 a18 18 0 0 1 -36 0 Z" fill="url(#trophyGrad)" stroke="url(#goldGrad)" stroke-width="2.2"/>' +
        '<path d="M32 28 c-12 0 -14 20 2 24" fill="none" stroke="url(#goldGrad)" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M68 28 c12 0 14 20 -2 24" fill="none" stroke="url(#goldGrad)" stroke-width="3.4" stroke-linecap="round"/>' +
        '<g fill="url(#goldGrad)"><path d="M18 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"/>' +
        '<path d="M82 10 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z"/></g>',
        'icon-trophy'
      );
    },
    brokenStone: function () {
      return svg(
        '<ellipse cx="50" cy="90" rx="28" ry="6" fill="#000" opacity="0.25"/>' +
        '<path d="M50 8 L76 24 L88 54 L70 90 L30 90 L12 54 L24 24 Z" fill="url(#stoneGrad)" stroke="url(#crackGrad)" stroke-width="2.2" opacity="0.88"/>' +
        '<path d="M46 10 L58 40 L42 46 L60 90" fill="none" stroke="url(#crackGrad)" stroke-width="3.2" stroke-linecap="round"/>',
        'icon-broken'
      );
    }
  };

  GA.Icons = Icons;
})(window.GameArena = window.GameArena || {});
