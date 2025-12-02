/**
 * Controles de Accesibilidad
 * Maneja el panel de controles y funcionalidades
 */

class AccessibilityControls {
  constructor() {
    this.panelOpen = false;
    this.init();
  }

  init() {
    this.createPanel();
    this.setupKeyboardShortcuts();
    this.announceAccessibilityFeatures();

    console.log("AccessibilityControls inicializado");
  }

  /**
   * Crear panel de controles
   */
  createPanel() {
    // Verificar si ya existe
    if (document.getElementById("accessibility-panel")) return;

    // Crear botón para abrir/cerrar panel
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "accessibility-toggle";
    toggleBtn.className = "accessibility-toggle";
    toggleBtn.innerHTML = "♿";
    toggleBtn.setAttribute("aria-label", "Abrir panel de accesibilidad");
    toggleBtn.setAttribute("aria-expanded", "false");

    // Crear panel
    const panel = document.createElement("div");
    panel.id = "accessibility-panel";
    panel.className = "accessibility-panel";
    panel.setAttribute("aria-label", "Panel de accesibilidad");
    panel.setAttribute("role", "toolbar");
    panel.setAttribute("aria-orientation", "vertical");

    // Botones del panel
    const buttons = [
      {
        id: "increase-font",
        icon: "A+",
        title: "Aumentar tamaño de texto",
        action: () => this.increaseFontSize(),
      },
      {
        id: "decrease-font",
        icon: "A-",
        title: "Disminuir tamaño de texto",
        action: () => this.decreaseFontSize(),
      },
      {
        id: "reset-font",
        icon: "A↺",
        title: "Restablecer tamaño de texto",
        action: () => this.resetFontSize(),
      },
      {
        id: "high-contrast",
        icon: "🎨",
        title: "Alternar alto contraste",
        action: () => this.toggleHighContrast(),
      },
      {
        id: "theme-toggle",
        icon: "🌓",
        title: "Cambiar tema claro/oscuro",
        action: () => this.toggleTheme(),
      },
      {
        id: "reset-all",
        icon: "↻",
        title: "Restablecer todas las configuraciones",
        action: () => this.resetAllSettings(),
      },
    ];

    // Añadir botones al panel
    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.id = btn.id;
      button.innerHTML = btn.icon;
      button.title = btn.title;
      button.setAttribute("aria-label", btn.title);

      button.addEventListener("click", (e) => {
        e.preventDefault();
        btn.action();
        this.announceAction(btn.title);
      });

      panel.appendChild(button);
    });

    // Añadir elementos al DOM
    document.body.appendChild(toggleBtn);
    document.body.appendChild(panel);

    // Eventos para abrir/cerrar panel
    toggleBtn.addEventListener("click", () => this.togglePanel());

    // Cerrar panel al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (
        this.panelOpen &&
        !panel.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        this.closePanel();
      }
    });

    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.panelOpen) {
        this.closePanel();
      }
    });
  }

  /**
   * Alternar panel de accesibilidad
   */
  togglePanel() {
    this.panelOpen = !this.panelOpen;
    const panel = document.getElementById("accessibility-panel");
    const toggleBtn = document.getElementById("accessibility-toggle");

    panel.classList.toggle("open", this.panelOpen);
    toggleBtn.setAttribute("aria-expanded", this.panelOpen.toString());
    toggleBtn.innerHTML = this.panelOpen ? "✕" : "♿";
    toggleBtn.setAttribute(
      "aria-label",
      this.panelOpen
        ? "Cerrar panel de accesibilidad"
        : "Abrir panel de accesibilidad"
    );

    if (this.panelOpen) {
      panel.focus();
      this.announce("Panel de accesibilidad abierto");
    }
  }

  openPanel() {
    if (!this.panelOpen) this.togglePanel();
  }

  closePanel() {
    if (this.panelOpen) this.togglePanel();
  }

  /**
   * Funciones de accesibilidad
   */
  increaseFontSize() {
    if (window.themeManager) {
      const newSize = window.themeManager.adjustFontSize(10);
      this.announce(`Tamaño de texto aumentado a ${newSize}%`);
    }
  }

  decreaseFontSize() {
    if (window.themeManager) {
      const newSize = window.themeManager.adjustFontSize(-10);
      this.announce(`Tamaño de texto disminuido a ${newSize}%`);
    }
  }

  resetFontSize() {
    if (window.themeManager) {
      window.themeManager.resetFontSize();
      this.announce("Tamaño de texto restablecido");
    }
  }

  toggleHighContrast() {
    if (window.themeManager) {
      const enabled = window.themeManager.toggleHighContrast();
      this.announce(`Alto contraste ${enabled ? "activado" : "desactivado"}`);
    }
  }

  toggleTheme() {
    if (window.themeManager) {
      const newTheme = window.themeManager.toggleTheme();
      this.announce(
        `Tema cambiado a ${newTheme === "dark" ? "oscuro" : "claro"}`
      );
    }
  }

  resetAllSettings() {
    if (
      window.themeManager &&
      confirm("¿Restablecer todas las configuraciones de accesibilidad?")
    ) {
      window.themeManager.resetAllSettings();
      this.announce("Todas las configuraciones han sido restablecidas");
    }
  }

  /**
   * Atajos de teclado
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Alt + A: Abrir panel de accesibilidad
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        this.openPanel();
      }

      // Alt + T: Cambiar tema
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        this.toggleTheme();
      }

      // Alt + +: Aumentar texto
      if (e.altKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        this.increaseFontSize();
      }

      // Alt + -: Disminuir texto
      if (e.altKey && e.key === "-") {
        e.preventDefault();
        this.decreaseFontSize();
      }

      // Alt + 0: Restablecer texto
      if (e.altKey && e.key === "0") {
        e.preventDefault();
        this.resetFontSize();
      }

      // Alt + H: Alto contraste
      if (e.altKey && e.key === "h") {
        e.preventDefault();
        this.toggleHighContrast();
      }
    });
  }

  /**
   * Anunciar acciones para lectores de pantalla
   */
  announce(message, priority = "polite") {
    // Crear elemento ARIA live para anuncios
    let announcement = document.getElementById("a11y-announcement");

    if (!announcement) {
      announcement = document.createElement("div");
      announcement.id = "a11y-announcement";
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      document.body.appendChild(announcement);
    }

    // Actualizar mensaje
    announcement.textContent = message;

    // Limpiar después de un tiempo
    setTimeout(() => {
      announcement.textContent = "";
    }, 3000);

    console.log("Anuncio de accesibilidad:", message);
  }

  announceAction(action) {
    this.announce(`${action} realizado`);
  }

  /**
   * Anunciar características de accesibilidad disponibles
   */
  announceAccessibilityFeatures() {
    setTimeout(() => {
      this.announce(
        "Esta página incluye características de accesibilidad: " +
          "Use Alt + A para abrir el panel de controles, " +
          "Alt + T para cambiar tema, " +
          "Alt + más y menos para ajustar tamaño de texto.",
        "assertive"
      );
    }, 1000);
  }

  /**
   * Mejorar focus para navegación por teclado
   */
  enhanceFocus() {
    // Añadir clase focus-visible para navegación por teclado
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation");
      }
    });

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-navigation");
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.accessibilityControls = new AccessibilityControls();
  window.accessibilityControls.enhanceFocus();
});

// Exportar para uso modular
if (typeof module !== "undefined" && module.exports) {
  module.exports = AccessibilityControls;
}
