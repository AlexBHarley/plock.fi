(async function () {
  if (typeof localStorage === undefined) {
    return;
  }

  const settings = JSON.parse(localStorage.getItem('plock/settings') || '{}');
  if (settings.darkMode === true) {
    document.documentElement.classList.add('dark');
    return;
  }

  if (settings.darkMode === false) {
    document.documentElement.classList.remove('dark');
    return;
  }

  const preference = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (preference) {
    document.documentElement.classList.add('dark');
    // localStorage.setItem({...settings, darkMode: true})
  }
})();
