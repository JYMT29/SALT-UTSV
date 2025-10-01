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
      icon: "fa-user-cog",
      dropdown: [{ title: "Registrar Usuario", link: "/usuarios.html" }],
    },
    {
      title: "Pase de Lista",
      icon: "fa-clipboard-check",
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
      icon: "fa-clipboard-check",
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

  // Configurar el input de avatar
  const avatarInput = document.getElementById("avatar-input");
  avatarInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        document.getElementById("avatar-preview-img").src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
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

    // Hacer petición al endpoint de información del usuario
    const response = await fetch("/api/user-info", {
      method: "GET",
      credentials: "same-origin", // Incluir cookies de sesión
    });

    if (!response.ok) {
      if (response.status === 401) {
        // No autenticado, redirigir al login
        redirectToLogin();
        return;
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const userData = await response.json();

    // Usar los datos reales del usuario desde el backend
    currentUser = {
      id: userData.id,
      username: userData.username,
      nombre: userData.username, // El backend devuelve 'username' que es el nombre real
      role: userData.role,
      avatar: userData.avatar || "/img/default-avatar.png", // Usar avatar del servidor
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    // Cargar la interfaz con los datos del usuario
    loadUserData();
    renderNavigation();
    renderQuickActions();
    showLoading(false);
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
    showError("Error de conexión. Redirigiendo al login...");
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 3000);
  }
}

// Función para subir avatar al servidor
async function uploadAvatarToServer(avatarData) {
  try {
    const response = await fetch("/api/upload-avatar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        avatar: avatarData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.avatarUrl; // URL del avatar en el servidor
    } else {
      throw new Error(result.message || "Error al subir el avatar");
    }
  } catch (error) {
    console.error("Error al subir avatar:", error);
    throw error;
  }
}

// Función para guardar el avatar en el servidor
async function saveAvatar() {
  const avatarInput = document.getElementById("avatar-input");
  const file = avatarInput.files[0];

  if (!file) {
    alert("Por favor, selecciona una imagen");
    return;
  }

  // Validar tipo de archivo
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    alert("Por favor, selecciona una imagen válida (JPEG, PNG, GIF o WebP)");
    return;
  }

  // Validar tamaño (máximo 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert("La imagen es demasiado grande. El tamaño máximo permitido es 2MB");
    return;
  }

  try {
    // Mostrar indicador de carga
    const saveButton = document.querySelector("#avatar-upload button");
    const originalText = saveButton.textContent;
    saveButton.textContent = "Subiendo...";
    saveButton.disabled = true;

    // Convertir imagen a Base64
    const reader = new FileReader();

    reader.onload = async function (event) {
      try {
        const avatarData = event.target.result;

        // Subir al servidor
        const avatarUrl = await uploadAvatarToServer(avatarData);

        // Actualizar el avatar del usuario actual
        currentUser.avatar = avatarUrl;

        // Actualizar localStorage
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        // Actualizar la imagen del avatar en la interfaz
        document.getElementById("user-avatar-img").src = avatarUrl;
        document.getElementById("avatar-preview-img").src = avatarUrl;

        // Cerrar el panel de carga
        document.getElementById("avatar-upload").classList.remove("show");

        // Mostrar mensaje de éxito
        alert("Avatar actualizado correctamente");

        // Recargar datos del usuario para asegurar consistencia
        await fetchUserData();
      } catch (error) {
        console.error("Error al procesar avatar:", error);
        alert("Error al subir el avatar: " + error.message);
      } finally {
        // Restaurar botón
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }
    };

    reader.onerror = function () {
      alert("Error al leer el archivo");
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error en saveAvatar:", error);
    alert("Error al guardar el avatar: " + error.message);
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
  document.querySelector(".main-content").style.display = "none";
  document.querySelector(".sidebar").style.display = "none";
}

// Ocultar mensaje de redirección
function hideRedirectMessage() {
  const redirectElement = document.getElementById("redirect-message");
  redirectElement.style.display = "none";

  // Mostrar el contenido principal
  document.querySelector(".main-content").style.display = "block";
  document.querySelector(".sidebar").style.display = "block";
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
  const userAvatar = document.getElementById("user-avatar-img");
  const userName = document.getElementById("user-name");
  const userRole = document.getElementById("user-role");

  // Usar el nombre real del usuario desde el backend
  const displayName = currentUser.nombre || currentUser.username || "Usuario";
  const userRoleText =
    currentUser.role === "admin"
      ? "Administrador"
      : currentUser.role === "user"
      ? "Usuario"
      : currentUser.role || "Usuario";

  // Avatar - usar siempre la URL del servidor
  userAvatar.src = currentUser.avatar || "/img/default-avatar.png";
  userAvatar.alt = `Avatar de ${displayName}`;
  userAvatar.onerror = function () {
    this.src = "/img/default-avatar.png";
  };

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
                  <i class="fas fa-chevron-down chevron"></i>
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

// Función para mostrar/ocultar el panel de carga de avatar
function toggleAvatarUpload() {
  const avatarUpload = document.getElementById("avatar-upload");
  avatarUpload.classList.toggle("show");

  // Cerrar otros menús abiertos
  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    menu.classList.remove("show");
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });
  });
}

// Función para cerrar sesión
function logout() {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    // Redirigir al endpoint de logout del backend
    window.location.href = "/logout";
  }
}

// Funciones existentes para interactividad
function toggleDropdown(id) {
  event.preventDefault();
  const dropdown = document.getElementById(id);
  const navLink = event.currentTarget;

  // Toggle active class
  navLink.classList.toggle("active");

  // Toggle dropdown
  dropdown.classList.toggle("show");

  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    if (menu.id !== id && menu.classList.contains("show")) {
      menu.classList.remove("show");
      // Remove active class from other nav links
      const otherNavLink = document.querySelector(
        `.nav-link[onclick="toggleDropdown('${menu.id}')"]`
      );
      if (otherNavLink) {
        otherNavLink.classList.remove("active");
      }
    }
  });

  // Cerrar el panel de avatar si está abierto
  document.getElementById("avatar-upload").classList.remove("show");
}

function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("active");
}

document.addEventListener("click", function (event) {
  if (
    !event.target.matches(".nav-link") &&
    !event.target.closest(".nav-link") &&
    !event.target.matches(".user-info") &&
    !event.target.closest(".user-info")
  ) {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.classList.remove("show");
      // Remove active class from all nav links
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
      });
    });

    // Cerrar el panel de avatar
    document.getElementById("avatar-upload").classList.remove("show");
  }
});
