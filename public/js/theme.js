// theme.js - Gestión del tema oscuro/claro global

// Clase para gestionar el tema
class ThemeManager {
  constructor() {
    this.themeToggle = null;
    this.currentTheme = this.getSavedTheme() || "light";
    this.init();
  }

  // Inicializar el gestor de temas
  init() {
    // Aplicar tema guardado al cargar la página
    this.applyTheme(this.currentTheme);

    // Crear botón de toggle si no existe
    this.createThemeToggle();

    // Escuchar cambios de tema
    this.setupEventListeners();

    // Actualizar icono inicial
    this.updateToggleIcon();
  }

  // Obtener tema guardado en localStorage
  getSavedTheme() {
    return localStorage.getItem("theme");
  }

  // Guardar tema en localStorage
  saveTheme(theme) {
    localStorage.setItem("theme", theme);
  }

  // Aplicar tema al documento
  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.currentTheme = theme;
    this.saveTheme(theme);
  }

  // Cambiar entre temas
  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
    this.updateToggleIcon();
    this.showThemeNotification(newTheme);
  }

  // Crear botón de toggle de tema
  createThemeToggle() {
    // Verificar si el botón ya existe
    if (document.getElementById("theme-toggle")) return;

    // Crear botón
    this.themeToggle = document.createElement("button");
    this.themeToggle.id = "theme-toggle";
    this.themeToggle.className = "theme-toggle";
    this.themeToggle.title = "Cambiar tema";
    this.themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';

    // Agregar al body
    document.body.appendChild(this.themeToggle);
  }

  // Actualizar icono del botón
  updateToggleIcon() {
    if (!this.themeToggle) return;

    const icon = this.themeToggle.querySelector("i");
    if (this.currentTheme === "dark") {
      icon.className = "bi bi-sun-fill";
      this.themeToggle.title = "Cambiar a modo claro";
    } else {
      icon.className = "bi bi-moon-fill";
      this.themeToggle.title = "Cambiar a modo oscuro";
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // Botón de toggle
    document.addEventListener("click", (e) => {
      if (e.target.closest("#theme-toggle")) {
        this.toggleTheme();
      }
    });

    // Atajos de teclado
    document.addEventListener("keydown", (e) => {
      // Alt + T para toggle de tema
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // Detectar cambios de tema del sistema
    if (window.matchMedia) {
      const prefersDarkScheme = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      // Si no hay tema guardado, usar el del sistema
      if (!this.getSavedTheme()) {
        this.applyTheme(prefersDarkScheme.matches ? "dark" : "light");
        this.updateToggleIcon();
      }

      // Escuchar cambios en las preferencias del sistema
      prefersDarkScheme.addEventListener("change", (e) => {
        if (!this.getSavedTheme()) {
          // Solo si el usuario no ha elegido manualmente
          this.applyTheme(e.matches ? "dark" : "light");
          this.updateToggleIcon();
        }
      });
    }
  }

  // Mostrar notificación del cambio de tema
  showThemeNotification(theme) {
    // Crear notificación temporal
    const notification = document.createElement("div");
    notification.className = "theme-notification";
    notification.innerHTML = `
      <i class="bi ${theme === "dark" ? "bi-moon" : "bi-sun"}"></i>
      <span>Modo ${theme === "dark" ? "oscuro" : "claro"} activado</span>
    `;

    // Estilos para la notificación
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${theme === "dark" ? "#1e1e1e" : "#ffffff"};
      color: ${theme === "dark" ? "#ffffff" : "#000000"};
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
      border-left: 4px solid ${theme === "dark" ? "#d4af37" : "#1a3c6e"};
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 10);

    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-20px)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Método para obtener el tema actual
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Método para forzar un tema específico
  setTheme(theme) {
    if (theme === "light" || theme === "dark") {
      this.applyTheme(theme);
      this.updateToggleIcon();
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.themeManager = new ThemeManager();

  // Exportar para uso global
  window.toggleTheme = () => window.themeManager.toggleTheme();
  window.setTheme = (theme) => window.themeManager.setTheme(theme);
  window.getCurrentTheme = () => window.themeManager.getCurrentTheme();
});

// También funciona si se carga después del DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}
