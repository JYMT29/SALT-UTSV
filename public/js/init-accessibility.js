/**
 * Inicialización rápida para evitar flash de tema incorrecto
 */
(function () {
  "use strict";

  // Aplicar tema inmediatamente para evitar flash
  function applyInitialTheme() {
    try {
      const saved = localStorage.getItem("accessibilitySettings");
      if (saved) {
        const settings = JSON.parse(saved);

        // Aplicar tema inmediatamente
        if (settings.theme) {
          document.documentElement.setAttribute("data-theme", settings.theme);
        }

        // Aplicar tamaño de fuente
        if (settings.fontSize) {
          document.documentElement.style.fontSize = `${settings.fontSize}%`;
        }
      }
    } catch (error) {
      console.error("Error aplicando tema inicial:", error);
    }

    // Remover clase de loading
    document.body.classList.remove("loading");
  }

  // Añadir clase de loading inicial
  document.body.classList.add("loading");

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyInitialTheme);
  } else {
    applyInitialTheme();
  }
})();
