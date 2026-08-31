// =========================================================
// THEME SYSTEM
// =========================================================

const THEME_COOKIE = 'theme_preference';

function getThemeFromCookie() {
    try {
        const cookie = document.cookie
            .split(';')
            .map((value) => value.trim())
            .find((value) => value.startsWith(`${THEME_COOKIE}=`));

        if (!cookie) {
            return 'dark';
        }

        const theme = decodeURIComponent(cookie.slice(THEME_COOKIE.length + 1));
        return theme === 'light' ? 'light' : 'dark';
    } catch (error) {
        return 'dark';
    }
}

function saveThemeToCookie(theme) {
    try {
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${THEME_COOKIE}=${theme}; expires=${expires}; path=/; SameSite=Lax`;
    } catch (error) {
        // The theme still works for the current page when cookies are blocked.
    }
}

function applyTheme(theme) {
    const isLightTheme = theme === 'light';
    document.documentElement.classList.toggle('light-theme', isLightTheme);

    const toggleButton = document.querySelector('.theme-toggle');

    if (toggleButton) {
        toggleButton.setAttribute(
            'aria-label',
            isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'
        );
        toggleButton.textContent = isLightTheme ? '\u{1F319}' : '\u2600\uFE0F';
    }
}

function initializeTheme() {
    applyTheme(getThemeFromCookie());
}

function toggleTheme() {
    const newTheme = document.documentElement.classList.contains('light-theme')
        ? 'dark'
        : 'light';

    applyTheme(newTheme);
    saveThemeToCookie(newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();

    const toggleButton = document.querySelector('.theme-toggle');

    if (toggleButton) {
        toggleButton.addEventListener('click', toggleTheme);
    }
});
