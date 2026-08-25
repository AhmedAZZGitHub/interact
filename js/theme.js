/**
 * ==========================================================================
 * THEME MANAGER (DARK OBSIDIAN / LIGHT ROTARY)
 * Persistent Contextual Theme Engine
 * ==========================================================================
 */

class ThemeManager {
  constructor() {
    this.storageKey = 'interact_theme_preference_v1';
    this.currentTheme = this.loadTheme();
  }

  loadTheme() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to Dark Mode
    return 'dark';
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.updateToggleButtons();
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem(this.storageKey, theme);

    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }

    this.updateToggleButtons();
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    
    if (window.app) {
      window.app.showToast(`Mode ${nextTheme === 'light' ? 'Clair ☀️' : 'Sombre 🌙'} activé.`, 'info');
    }
  }

  updateToggleButtons() {
    const isLight = this.currentTheme === 'light';
    const headerBtn = document.getElementById('header-theme-toggle-btn');
    if (headerBtn) {
      headerBtn.innerHTML = isLight ? '☀️' : '🌙';
      headerBtn.title = isLight ? 'Passer en mode sombre' : 'Passer en mode clair';
    }

    const settingsToggle = document.getElementById('settings-theme-switch');
    if (settingsToggle) {
      settingsToggle.checked = isLight;
    }
  }
}

// Global theme instance
const themeManager = new ThemeManager();
window.themeManager = themeManager;

document.addEventListener('DOMContentLoaded', () => {
  window.themeManager.init();
});
