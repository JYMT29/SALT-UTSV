/**
 * Gestor de Tema y Accesibilidad
 * Maneja el modo oscuro y preferencias del usuario
 */

class ThemeManager {
  constructor() {
    this.settings = {
      theme: "light",
      fontSize: 100,
      highContrast: false,
      reduceMotion: false,
    };

    this.init();
  }

  init() {
    this.loadSettings();
    this.applySettings();
    this.setupSystemListeners();
    this.createThemeToggle();

    console.log("ThemeManager inicializado");
  }

  /**
   * Cargar configuraciones guardadas
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem("accessibilitySettings");
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }

      // Verificar preferencia del sistema
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        if (!localStorage.getItem("accessibilitySettings")) {
          this.settings.theme = "dark";
        }
      }
    } catch (error) {
      console.error("Error cargando configuraciones:", error);
    }
  }

  /**
   * Aplicar todas las configuraciones
   */
  applySettings() {
    // Aplicar tema
    document.documentElement.setAttribute("data-theme", this.settings.theme);

    // Aplicar tamaño de fuente
    document.documentElement.style.fontSize = `${this.settings.fontSize}%`;

    // Aplicar alto contraste
    document.body.classList.toggle("high-contrast", this.settings.highContrast);

    // Aplicar reducción de movimiento
    if (this.settings.reduceMotion) {
      document.documentElement.style.setProperty(
        "--transition-speed",
        "0.01ms"
      );
    }

    // Guardar en session para uso en otras páginas
    sessionStorage.setItem("currentTheme", this.settings.theme);
  }

  /**
   * Escuchar cambios del sistema
   */
  setupSystemListeners() {
    // Escuchar cambios en el tema del sistema
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("accessibilitySettings")) {
          this.setTheme(e.matches ? "dark" : "light");
        }
      });

    // Escuchar preferencia de reducción de movimiento
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .addEventListener("change", (e) => {
        this.settings.reduceMotion = e.matches;
        this.applySettings();
        this.saveSettings();
      });
  }

  /**
   * Cambiar tema
   */
  setTheme(theme) {
    this.settings.theme = theme;
    this.applySettings();
    this.saveSettings();

    // Disparar evento personalizado
    document.dispatchEvent(
      new CustomEvent("themeChange", {
        detail: { theme },
      })
    );
  }

  /**
   * Alternar entre tema claro/oscuro
   */
  toggleTheme() {
    const newTheme = this.settings.theme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);

    return newTheme;
  }

  /**
   * Ajustar tamaño de fuente
   */
  adjustFontSize(change) {
    this.settings.fontSize = Math.min(
      Math.max(this.settings.fontSize + change, 80),
      200
    );
    this.applySettings();
    this.saveSettings();

    return this.settings.fontSize;
  }

  /**
   * Restablecer tamaño de fuente
   */
  resetFontSize() {
    this.settings.fontSize = 100;
    this.applySettings();
    this.saveSettings();

    return this.settings.fontSize;
  }

  /**
   * Alternar alto contraste
   */
  toggleHighContrast() {
    this.settings.highContrast = !this.settings.highContrast;
    this.applySettings();
    this.saveSettings();

    return this.settings.highContrast;
  }

  /**
   * Alternar reducción de movimiento
   */
  toggleReduceMotion() {
    this.settings.reduceMotion = !this.settings.reduceMotion;
    this.applySettings();
    this.saveSettings();

    return this.settings.reduceMotion;
  }

  /**
   * Guardar configuraciones
   */
  saveSettings() {
    try {
      localStorage.setItem(
        "accessibilitySettings",
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error("Error guardando configuraciones:", error);
    }
  }

  /**
   * Restablecer todas las configuraciones
   */
  resetAllSettings() {
    this.settings = {
      theme: "light",
      fontSize: 100,
      highContrast: false,
      reduceMotion: false,
    };

    localStorage.removeItem("accessibilitySettings");
    this.applySettings();

    // Recargar para aplicar completamente
    setTimeout(() => location.reload(), 300);
  }

  /**
   * Crear botón de cambio de tema
   */
  createThemeToggle() {
    // Verificar si ya existe
    if (document.getElementById("theme-toggle")) return;

    const toggle = document.createElement("button");
    toggle.id = "theme-toggle";
    toggle.className = "theme-toggle";
    toggle.setAttribute("aria-label", "Cambiar tema");
    toggle.innerHTML = this.settings.theme === "dark" ? "☀️" : "🌙";

    toggle.addEventListener("click", () => {
      const newTheme = this.toggleTheme();
      toggle.innerHTML = newTheme === "dark" ? "☀️" : "🌙";
      toggle.setAttribute(
        "aria-label",
        `Cambiar a tema ${newTheme === "dark" ? "claro" : "oscuro"}`
      );
    });

    document.body.appendChild(toggle);
  }

  /**
   * Obtener configuración actual
   */
  getSettings() {
    return { ...this.settings };
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.themeManager = new ThemeManager();
});

// Exportar para uso modular
if (typeof module !== "undefined" && module.exports) {
  module.exports = ThemeManager;
}
