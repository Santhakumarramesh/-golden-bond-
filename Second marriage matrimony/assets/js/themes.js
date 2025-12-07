/**
 * Golden Bond - Theme Management System
 * Supports: Indian Red & Gold, Classic White & Gold, Modern Pastel, Dark Mode
 */

// Available themes
const themes = {
  'theme-indian': {
    name: 'Indian Red & Gold',
    icon: '🔴',
    description: 'Traditional Indian wedding colors'
  },
  'theme-classic': {
    name: 'Classic White & Gold',
    icon: '🟡',
    description: 'Elegant and timeless'
  },
  'theme-modern': {
    name: 'Modern Pastel',
    icon: '🌸',
    description: 'Soft and romantic'
  },
  'theme-dark': {
    name: 'Dark Mode',
    icon: '🌙',
    description: 'Easy on the eyes'
  }
};

// Current theme
let currentTheme = 'theme-indian';

/**
 * Set the current theme
 * @param {string} themeName - Theme class name
 */
function setTheme(themeName) {
  if (!themes[themeName]) {
    console.warn(`Theme '${themeName}' not found, falling back to Indian theme`);
    themeName = 'theme-indian';
  }
  
  // Remove all theme classes
  Object.keys(themes).forEach(theme => {
    document.body.classList.remove(theme);
  });
  
  // Add new theme class
  document.body.classList.add(themeName);
  currentTheme = themeName;
  
  // Save preference
  localStorage.setItem('soulmatch_theme', themeName);
  
  // Update theme selector if exists
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = themeName;
  }
  
  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(themeName);
  
  // Dispatch event for other scripts to listen
  document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
}

/**
 * Update meta theme-color based on current theme
 * @param {string} themeName - Theme class name
 */
function updateMetaThemeColor(themeName) {
  let themeColor;
  
  switch (themeName) {
    case 'theme-indian':
      themeColor = '#c41e3a';
      break;
    case 'theme-classic':
      themeColor = '#b8860b';
      break;
    case 'theme-modern':
      themeColor = '#e91e63';
      break;
    case 'theme-dark':
      themeColor = '#0f0f14';
      break;
    default:
      themeColor = '#c41e3a';
  }
  
  // Update or create meta theme-color tag
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.content = themeColor;
}

/**
 * Get current theme
 * @returns {string} - Current theme class name
 */
function getCurrentTheme() {
  return currentTheme;
}

/**
 * Get theme info
 * @param {string} themeName - Theme class name
 * @returns {object} - Theme info object
 */
function getThemeInfo(themeName) {
  return themes[themeName] || themes['theme-indian'];
}

/**
 * Get all available themes
 * @returns {object} - All themes object
 */
function getAllThemes() {
  return themes;
}

/**
 * Toggle between light and dark mode
 */
function toggleDarkMode() {
  if (currentTheme === 'theme-dark') {
    // Switch to previously saved light theme or default
    const savedLightTheme = localStorage.getItem('soulmatch_light_theme') || 'theme-indian';
    setTheme(savedLightTheme);
  } else {
    // Save current light theme and switch to dark
    localStorage.setItem('soulmatch_light_theme', currentTheme);
    setTheme('theme-dark');
  }
}

/**
 * Check if system prefers dark mode
 * @returns {boolean}
 */
function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Initialize theme system
 */
function initTheme() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('soulmatch_theme');
  
  if (savedTheme && themes[savedTheme]) {
    setTheme(savedTheme);
  } else if (systemPrefersDark()) {
    // Use dark mode if system prefers it
    setTheme('theme-dark');
  } else {
    // Default to Indian theme
    setTheme('theme-indian');
  }
  
  // Set up theme selector event listener
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }
  
  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually selected a theme
      if (!localStorage.getItem('soulmatch_theme')) {
        setTheme(e.matches ? 'theme-dark' : 'theme-indian');
      }
    });
  }
}

// Export for use in other modules
window.SoulMatchThemes = {
  setTheme,
  getCurrentTheme,
  getThemeInfo,
  getAllThemes,
  toggleDarkMode,
  initTheme
};

