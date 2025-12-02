// theme.js - Gestión del tema oscuro/claro global - VERSIÓN CORREGIDA

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

    // Crear botón de toggle
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

  // Crear botón de toggle de tema - VERSIÓN MEJORADA
  createThemeToggle() {
    // Verificar si el botón ya existe
    if (document.getElementById("theme-toggle")) return;

    // Crear botón
    this.themeToggle = document.createElement("button");
    this.themeToggle.id = "theme-toggle";
    this.themeToggle.className = "theme-toggle";
    this.themeToggle.title = "Cambiar tema";
    this.themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
    this.themeToggle.setAttribute(
      "aria-label",
      "Cambiar entre modo claro y oscuro"
    );

    // Posicionar correctamente considerando el sidebar
    this.adjustTogglePosition();

    // Agregar al body
    document.body.appendChild(this.themeToggle);

    // Reajustar posición cuando cambie el tamaño de la ventana
    window.addEventListener("resize", () => this.adjustTogglePosition());
  }

  // Ajustar posición del botón según el diseño de la página
  adjustTogglePosition() {
    if (!this.themeToggle) return;

    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");

    if (sidebar && window.getComputedStyle(sidebar).display !== "none") {
      // Si hay sidebar visible, posicionar a la derecha del sidebar
      const sidebarWidth = sidebar.offsetWidth;
      this.themeToggle.style.left = `${sidebarWidth + 20}px`;
    } else if (mainContent) {
      // Si hay main-content pero no sidebar, posicionar normal
      this.themeToggle.style.left = "30px";
    }

    // Asegurarse de que esté sobre otros elementos
    this.themeToggle.style.zIndex = "9999";
  }

  // Actualizar icono del botón
  updateToggleIcon() {
    if (!this.themeToggle) return;

    const icon = this.themeToggle.querySelector("i");
    if (this.currentTheme === "dark") {
      icon.className = "bi bi-sun-fill";
      this.themeToggle.title = "Cambiar a modo claro";
      this.themeToggle.setAttribute("aria-label", "Cambiar a modo claro");
    } else {
      icon.className = "bi bi-moon-fill";
      this.themeToggle.title = "Cambiar a modo oscuro";
      this.themeToggle.setAttribute("aria-label", "Cambiar a modo oscuro");
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

    // Detectar cambios en el sidebar (para páginas con menú colapsable)
    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        // Reajustar posición después de que se colapse/expanda el sidebar
        setTimeout(() => this.adjustTogglePosition(), 300);
      });
    }
  }

  // Mostrar notificación del cambio de tema - VERSIÓN MEJORADA
  showThemeNotification(theme) {
    // Si ya hay una notificación, removerla
    const existingNotification = document.querySelector(".theme-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Crear notificación temporal
    const notification = document.createElement("div");
    notification.className = "theme-notification";
    notification.innerHTML = `
      <i class="bi ${theme === "dark" ? "bi-moon" : "bi-sun"}"></i>
      <span>Modo ${theme === "dark" ? "oscuro" : "claro"} activado</span>
    `;

    // Aplicar estilos dinámicamente según el tema
    const isDark = theme === "dark";
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${isDark ? "var(--bg-card)" : "var(--white)"};
      color: ${isDark ? "var(--text-primary)" : "var(--dark-gray)"};
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow-3d);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 10000;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s ease;
      border-left: 4px solid ${
        isDark ? "var(--secondary-color)" : "var(--primary-color)"
      };
      font-weight: 500;
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(20px)";
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

// Función para esperar a que Bootstrap Icons esté cargado
function waitForBootstrapIcons() {
  return new Promise((resolve) => {
    if (document.querySelector(".bi")) {
      resolve();
    } else {
      const observer = new MutationObserver(() => {
        if (document.querySelector(".bi")) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
}

// Inicializar cuando todo esté listo
async function initializeThemeManager() {
  // Esperar a que Bootstrap Icons esté disponible
  await waitForBootstrapIcons();

  // Inicializar el gestor de temas
  window.themeManager = new ThemeManager();

  // Exportar funciones globales
  window.toggleTheme = () => window.themeManager.toggleTheme();
  window.setTheme = (theme) => window.themeManager.setTheme(theme);
  window.getCurrentTheme = () => window.themeManager.getCurrentTheme();

  console.log("Theme Manager inicializado correctamente");
}

// Manejar diferentes estados de carga del DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeThemeManager);
} else {
  initializeThemeManager();
}

// También inicializar si el script se carga después
if (typeof window.themeManager === "undefined") {
  initializeThemeManager();
}
