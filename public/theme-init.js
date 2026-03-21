(function() {
  // 从 localStorage 缓存读取主题（同步）
  var cached = localStorage.getItem('theme-cache');
  if (cached) {
    try {
      var data = JSON.parse(cached);
      var theme = data.theme;
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  } else {
    // 无缓存时，跟随系统主题
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
})();
