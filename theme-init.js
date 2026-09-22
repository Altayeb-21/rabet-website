(function () {
  'use strict';

  /* Set the right theme before the page finishes loading. */
  try {
    var saved = localStorage.getItem('rabetTheme');
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', saved || (dark ? 'dark' : 'light'));
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
