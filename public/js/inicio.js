// Variable global para almacenar los datos del usuario
let currentUser = null;

// Estructura del menú para cada rol
const menuItems = {
  admin: [
    {
      title: "Horario",
      icon: "fa-calendar-alt",
      dropdown: [
        { title: "Laboratorio 1", link: "/horario.html?lab=lab1" },
        { title: "Laboratorio 2", link: "/horario.html?lab=lab2" },
      ],
    },
    {
      title: "Informe",
      icon: "fa-file-alt",
      dropdown: [
        { title: "Laboratorio 1", link: "/informe.html?lab=lab1" },
        { title: "Laboratorio 2", link: "/informe.html?lab=lab2" },
      ],
    },
    {
      title: "Registro",
      icon: "fa-edit",
      dropdown: [
        { title: "Laboratorio 1", link: "/registro.html?lab=lab1" },
        { title: "Laboratorio 2", link: "/registro.html?lab=lab2" },
        { title: "Nuevo Alumno", link: "/alumnos.html" },
      ],
    },
    {
      title: "Usuarios",
      icon: "fa-user-plus",
      dropdown: [{ title: "Registrar Usuario", link: "/usuarios.html" }],
    },
    {
      title: "Pase de Lista",
      icon: "fa-clipboard-list",
      dropdown: [{ title: "Pase de Lista", link: "/pase-lista.html" }],
    },
  ],
  user: [
    {
      title: "Registro",
      icon: "fa-edit",
      dropdown: [
        { title: "Laboratorio 1", link: "/registro.html?lab=lab1" },
        { title: "Laboratorio 2", link: "/registro.html?lab=lab2" },
      ],
    },
    {
      title: "Horario",
      icon: "fa-calendar-alt",
      dropdown: [
        { title: "Laboratorio 1", link: "/horario.html?lab=lab1" },
        { title: "Laboratorio 2", link: "/horario.html?lab=lab2" },
      ],
    },
    {
      title: "Pase de Lista",
      icon: "fa-clipboard-list",
      dropdown: [{ title: "Lista de Alumnos", link: "/pase-lista.html" }],
    },
  ],
};

// Acciones rápidas para cada rol
const quickActions = {
  admin: [
    {
      icon: "fa-calendar-check",
      label: "Horario Lab 1",
      link: "/horario.html?lab=lab1",
    },
    {
      icon: "fa-calendar-check",
      label: "Horario Lab 2",
      link: "/horario.html?lab=lab2",
    },
    {
      icon: "fa-file-alt",
      label: "Informe Lab 1",
      link: "/informe.html?lab=lab1",
    },
    {
      icon: "fa-file-alt",
      label: "Informe Lab 2",
      link: "/informe.html?lab=lab2",
    },
    {
      icon: "fa-user-plus",
      label: "Nuevo Alumno",
      link: "/alumnos.html",
    },
    {
      icon: "fa-edit",
      label: "Registro Lab 1",
      link: "/registro.html?lab=lab1",
    },
    {
      icon: "fa-edit",
      label: "Registro Lab 2",
      link: "/registro.html?lab=lab2",
    },
  ],
  user: [
    {
      icon: "fa-edit",
      label: "Registro Lab 1",
      link: "/registro.html?lab=lab1",
    },
    {
      icon: "fa-edit",
      label: "Registro Lab 2",
      link: "/registro.html?lab=lab2",
    },
    {
      icon: "fa-calendar-check",
      label: "Horario Lab 1",
      link: "/horario.html?lab=lab1",
    },
    {
      icon: "fa-calendar-check",
      label: "Horario Lab 2",
      link: "/horario.html?lab=lab2",
    },
  ],
};

// Inicializar la página cuando se carga
document.addEventListener("DOMContentLoaded", function () {
  // Obtener datos del usuario desde el servidor
  fetchUserData();
});

// Función para redirigir al login
function redirectToLogin() {
  showRedirectMessage("No hay sesión activa. Redirigiendo al login...");

  // Esperar 2 segundos antes de redirigir para que el usuario vea el mensaje
  setTimeout(() => {
    window.location.href = "/index.html";
  }, 2000);
}

// Función para obtener datos del usuario desde el servidor
async function fetchUserData() {
  try {
    showLoading(true);
    hideError();
    hideRedirectMessage();

    console.log("Iniciando obtención de datos del usuario...");

    // Intentar obtener información del servidor
    const response = await fetch("/api/user-info", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Respuesta del servidor:", response.status);

    if (response.status === 401) {
      // No autenticado, redirigir al login
      console.log("Usuario no autenticado, redirigiendo...");
      localStorage.removeItem("currentUser"); // Limpiar storage
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const userData = await response.json();
    console.log("Datos del usuario obtenidos:", userData);

    currentUser = userData;
    localStorage.setItem("currentUser", JSON.stringify(userData));

    // Cargar la interfaz con los datos del usuario
    loadUserData();
    renderNavigation();
    renderQuickActions();
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);

    // Verificar si es un error de redirección (401)
    if (
      error.message.includes("401") ||
      error.message.includes("No autenticado")
    ) {
      redirectToLogin();
      return;
    }

    // Intentar cargar desde localStorage como fallback
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      console.log("Cargando usuario desde localStorage...");
      currentUser = JSON.parse(storedUser);
      loadUserData();
      renderNavigation();
      renderQuickActions();
      showError("Conectado en modo offline (datos locales)");
    } else {
      // No hay datos locales ni servidor disponible
      showError("Error de conexión. Redirigiendo al login...");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 3000);
    }
  } finally {
    showLoading(false);
  }
}

// Mostrar/ocultar indicador de carga
function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = show ? "flex" : "none";
}

// Mostrar mensaje de redirección
function showRedirectMessage(message) {
  const redirectElement = document.getElementById("redirect-message");
  const redirectText = document.getElementById("redirect-text");

  redirectText.textContent = message;
  redirectElement.style.display = "block";
  hideError();

  // Ocultar el contenido principal
  document.querySelector(".container").style.display = "none";
}

// Ocultar mensaje de redirección
function hideRedirectMessage() {
  const redirectElement = document.getElementById("redirect-message");
  redirectElement.style.display = "none";

  // Mostrar el contenido principal
  document.querySelector(".container").style.display = "block";
}

// Mostrar mensaje de error
function showError(message) {
  const errorElement = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");

  errorText.textContent = message;
  errorElement.style.display = "block";
  hideRedirectMessage();
}

// Ocultar mensaje de error
function hideError() {
  const errorElement = document.getElementById("error-message");
  errorElement.style.display = "none";
}

// Cargar datos del usuario en la interfaz
function loadUserData() {
  if (!currentUser) return;

  // Mostrar información del usuario
  const userName = document.getElementById("user-name");
  const userRole = document.getElementById("user-role");

  // Usar el nombre del usuario desde la sesión
  const displayName = currentUser.username || currentUser.nombre || "Usuario";
  const userRoleText =
    currentUser.role === "admin"
      ? "Administrador"
      : currentUser.role === "user"
      ? "Usuario"
      : currentUser.role || "Usuario";

  // Nombre completo
  userName.textContent = displayName;

  // Rol traducido al español
  userRole.textContent = userRoleText;

  // Simular datos de estadísticas
  document.getElementById("student-count").textContent =
    currentUser.role === "admin" ? "247" : "150";
  document.getElementById("teacher-count").textContent =
    currentUser.role === "admin" ? "36" : "50";

  console.log("Interfaz cargada para usuario:", displayName);
}

// Renderizar la navegación según el rol
function renderNavigation() {
  if (!currentUser) return;

  const navMenu = document.getElementById("nav-menu");
  navMenu.innerHTML = "";

  const role = currentUser.role || "user";

  // Si el rol no existe en menuItems, usar 'user' como valor por defecto
  const effectiveRole = menuItems[role] ? role : "user";

  menuItems[effectiveRole].forEach((item) => {
    const li = document.createElement("li");
    li.className = "nav-item";

    li.innerHTML = `
                    <a href="#" class="nav-link" onclick="toggleDropdown('${item.title.toLowerCase()}')">
                        <i class="fas ${item.icon}"></i>
                        <span>${item.title}</span>
                        <i class="fas fa-chevron-down ms-auto" style="font-size: 0.8rem"></i>
                    </a>
                    <ul class="dropdown-menu" id="${item.title.toLowerCase()}">
                        ${item.dropdown
                          .map(
                            (dropItem) => `
                            <li>
                                <a href="${dropItem.link}" class="dropdown-item">${dropItem.title}</a>
                            </li>
                        `
                          )
                          .join("")}
                    </ul>
                `;

    navMenu.appendChild(li);
  });
}

// Renderizar acciones rápidas según el rol
function renderQuickActions() {
  if (!currentUser) return;

  const quickActionsContainer = document.getElementById("quick-actions");
  quickActionsContainer.innerHTML = "";

  const role = currentUser.role || "user";

  // Si el rol no existe en quickActions, usar 'user' como valor por defecto
  const effectiveRole = quickActions[role] ? role : "user";

  quickActions[effectiveRole].forEach((action) => {
    const actionElement = document.createElement("a");
    actionElement.href = action.link;
    actionElement.className = "action-btn";
    actionElement.innerHTML = `
                    <i class="fas ${action.icon}"></i>
                    <span class="action-label">${action.label}</span>
                `;
    quickActionsContainer.appendChild(actionElement);
  });
}

// Función para cerrar sesión
function logout() {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    // Limpiar localStorage
    localStorage.removeItem("currentUser");

    // Usar el endpoint de logout
    fetch("/logout", {
      method: "GET",
      credentials: "same-origin",
    })
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          // Si no hay redirección, redirigir manualmente
          window.location.href = "/index.html";
        }
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error);
        // Redirigir de todas formas
        window.location.href = "/index.html";
      });
  }
}

// Funciones existentes para interactividad
function toggleDropdown(id) {
  event.preventDefault();
  const dropdown = document.getElementById(id);
  dropdown.classList.toggle("show");

  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    if (menu.id !== id && menu.classList.contains("show")) {
      menu.classList.remove("show");
    }
  });
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

document.addEventListener("click", function (event) {
  if (
    !event.target.matches(".nav-link") &&
    !event.target.closest(".nav-link")
  ) {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.classList.remove("show");
    });
  }
});
