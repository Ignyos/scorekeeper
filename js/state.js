class State {
  constructor(globalSettings) {
    const defaults = {
      theme: "light",
      currentPage: "/",
    };

    this.globalSettings = {
      ...defaults,
      ...(globalSettings || {}),
    };
  }

  get theme() {
    return this.globalSettings.theme || "light";
  }

  get currentPage() {
    return this.globalSettings.currentPage || "/";
  }

  setTheme(theme) {
    this.globalSettings.theme = theme;
  }

  setCurrentPage(pathname) {
    this.globalSettings.currentPage = pathname;
  }

  toGlobalSettings() {
    return { ...this.globalSettings };
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme || "light");
}

window.ScorekeeperState = {
  State,
  applyTheme,
};