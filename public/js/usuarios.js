// Variable para controlar si estamos en modo demo
let demoMode = false;
let users = []; // Almacenamiento local de usuarios

document.addEventListener("DOMContentLoaded", function () {
  // Intentar cargar usuarios de la API
  loadUsers();

  // Manejar el envío del formulario
  document.getElementById("userForm").addEventListener("submit", function (e) {
    e.preventDefault();
    registerUser();
  });
});

function registerUser() {
  const matricula = document.getElementById("matricula").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  const rol = document.getElementById("rol").value;

  // Validación básica
  if (!nombre || !contrasena) {
    showAlert("Por favor, complete todos los campos obligatorios", "danger");
    return;
  }

  // Validar que la matrícula no esté duplicada (si se proporcionó)
  if (matricula) {
    if (isMatriculaDuplicate(matricula)) {
      showAlert("La matrícula ya está registrada en el sistema", "danger");
      return;
    }
  }

  const userData = {
    matricula: matricula || null,
    nombre: nombre,
    contrasena: contrasena,
    rol: rol,
  };

  // Mostrar indicador de carga
  const submitBtn = document.querySelector('#userForm button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin me-2"></i>Registrando...';
  submitBtn.disabled = true;

  // Si estamos en modo demo, usar almacenamiento local
  if (demoMode) {
    // Simular una llamada a la API con un retraso
    setTimeout(() => {
      // Crear un nuevo usuario con ID único
      const newUser = {
        idusuario:
          users.length > 0 ? Math.max(...users.map((u) => u.idusuario)) + 1 : 1,
        ...userData,
      };

      // Agregar a la lista local
      users.push(newUser);

      // Actualizar la interfaz
      showAlert("Usuario registrado correctamente (modo demo)", "success");
      document.getElementById("userForm").reset();
      renderUsers(users);

      // Restaurar el botón
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }, 1000);
    return;
  }

  // Intentar conectar con la API real (LOCAL)
  fetch("https://salt-utsv-production.up.railway.app/api/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        // Si falla, activar modo demo
        if (response.status === 404) {
          throw new Error("API no disponible. Activando modo demo.");
        }
        return response.json().then((err) => {
          throw new Error(err.error || "Error en la respuesta del servidor");
        });
      }
      return response.json();
    })
    .then((data) => {
      showAlert("Usuario registrado correctamente", "success");
      document.getElementById("userForm").reset();
      loadUsers(); // Recargar la lista de usuarios
    })
    .catch((error) => {
      console.error("Error:", error);

      // Si es un error 404, activar modo demo
      if (
        error.message.includes("404") ||
        error.message.includes("no disponible") ||
        error.message.includes("Failed to fetch")
      ) {
        activateDemoMode();
        showAlert(
          "API no disponible. Se ha activado el modo demo. Los datos se almacenarán localmente.",
          "warning"
        );

        // Registrar el usuario en modo demo
        const newUser = {
          idusuario:
            users.length > 0
              ? Math.max(...users.map((u) => u.idusuario)) + 1
              : 1,
          ...userData,
        };
        users.push(newUser);
        renderUsers(users);
      } else {
        showAlert("Error al registrar el usuario: " + error.message, "danger");
      }
    })
    .finally(() => {
      // Restaurar el botón
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    });
}

function isMatriculaDuplicate(matricula) {
  // Verificar si la matrícula ya existe en los usuarios actuales
  if (demoMode) {
    // En modo demo, verificar en el array local
    return users.some(
      (user) =>
        user.matricula &&
        user.matricula.toString().toLowerCase() === matricula.toLowerCase()
    );
  } else {
    // En modo normal, verificar en la lista renderizada
    const currentUsers = getCurrentUsersFromTable();
    return currentUsers.some(
      (user) =>
        user.matricula &&
        user.matricula.toString().toLowerCase() === matricula.toLowerCase()
    );
  }
}

function getCurrentUsersFromTable() {
  // Obtener usuarios actuales de la tabla (para validación en tiempo real)
  const tableRows = document.querySelectorAll("#usersTableBody tr");
  const currentUsers = [];

  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 4) {
      currentUsers.push({
        idusuario: parseInt(cells[0].textContent),
        matricula: cells[1].textContent !== "N/A" ? cells[1].textContent : null,
        nombre: cells[2].textContent,
        rol: cells[3].querySelector(".badge").textContent.toLowerCase(),
      });
    }
  });

  return currentUsers;
}

function loadUsers() {
  // Mostrar indicador de carga en la tabla
  const tableBody = document.getElementById("usersTableBody");
  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Cargando usuarios...</td></tr>';

  // Primero intentar cargar desde la API LOCAL
  fetch("https://salt-utsv-production.up.railway.app/api/usuarios")
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("API no disponible");
        }
        throw new Error("Error al cargar los usuarios");
      }
      return response.json();
    })
    .then((data) => {
      // Ocultar el modo demo si estaba activo
      document.getElementById("connectionStatus").style.display = "none";
      demoMode = false;

      // Asegúrate de que data.data es el array de usuarios
      const apiUsers = data.data || data;
      renderUsers(apiUsers);
    })
    .catch((error) => {
      console.error("Error cargando desde API:", error);

      // Activar modo demo
      activateDemoMode();

      // Cargar datos de ejemplo para demostración
      if (users.length === 0) {
        users = [
          {
            idusuario: 1,
            matricula: "2021001",
            nombre: "Juan Pérez",
            rol: "admin",
          },
          {
            idusuario: 2,
            matricula: "2021002",
            nombre: "María García",
            rol: "user",
          },
          {
            idusuario: 3,
            matricula: null,
            nombre: "Carlos López",
            rol: "user",
          },
        ];
      }

      renderUsers(users);
      showAlert(
        "No se pudo conectar con el servidor. Mostrando datos de ejemplo (modo demo).",
        "warning"
      );
    });
}

function renderUsers(userList) {
  const tableBody = document.getElementById("usersTableBody");
  tableBody.innerHTML = "";

  if (userList.length === 0) {
    tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            <i class="fas fa-users"></i>
                            <h4>No hay usuarios registrados</h4>
                            <p>Comienza agregando el primer usuario usando el formulario superior.</p>
                        </td>
                    </tr>`;
    updateStats(userList);
    return;
  }

  userList.forEach((user) => {
    const row = document.createElement("tr");

    row.innerHTML = `
                    <td>${user.idusuario}</td>
                    <td>${user.matricula || "N/A"}</td>
                    <td>${user.nombre || "N/A"}</td>
                    <td><span class="badge ${
                      user.rol === "admin" ? "badge-admin" : "badge-user"
                    }">${user.rol}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${
                          user.idusuario
                        })">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;

    tableBody.appendChild(row);
  });

  updateStats(userList);
}

function deleteUser(userId) {
  if (!confirm("¿Está seguro de que desea eliminar este usuario?")) {
    return;
  }

  if (demoMode) {
    // Si estamos en modo demo
    users = users.filter((user) => user.idusuario !== userId);
    renderUsers(users);
    showAlert("Usuario eliminado correctamente (modo demo)", "success");
    return;
  }

  // Conexión real a la API LOCAL
  fetch(`https://salt-utsv-production.up.railway.app/api/usuarios/${userId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al eliminar usuario");
      }
      return response.json();
    })
    .then((data) => {
      showAlert("Usuario eliminado correctamente", "success");
      loadUsers(); // Recargar la lista
    })
    .catch((error) => {
      console.error("Error:", error);

      // Si falla la API, activar modo demo
      if (error.message.includes("Failed to fetch")) {
        activateDemoMode();
        showAlert(
          "Error de conexión. Activando modo demo. Los cambios serán locales.",
          "warning"
        );
        users = users.filter((user) => user.idusuario !== userId);
        renderUsers(users);
      } else {
        showAlert("Error al eliminar el usuario: " + error.message, "danger");
      }
    });
}

function activateDemoMode() {
  demoMode = true;
  const statusElement = document.getElementById("connectionStatus");
  statusElement.className = "connection-status demo-mode";
  statusElement.innerHTML =
    '<i class="fas fa-info-circle me-1"></i>Modo Demo Activado';
  statusElement.style.display = "block";
}

function updateStats(users) {
  document.getElementById("totalUsers").textContent = users.length;
  document.getElementById("adminUsers").textContent = users.filter(
    (user) => user.rol === "admin"
  ).length;
  document.getElementById("normalUsers").textContent = users.filter(
    (user) => user.rol === "user"
  ).length;
}

function showAlert(message, type) {
  const alertDiv = document.getElementById("alert");
  alertDiv.innerHTML = `
                <i class="fas fa-${
                  type === "success"
                    ? "check-circle"
                    : type === "warning"
                    ? "exclamation-triangle"
                    : "exclamation-circle"
                } me-2"></i>
                ${message}
            `;
  alertDiv.className = `alert alert-${type}`;
  alertDiv.style.display = "block";

  // Ocultar la alerta después de 5 segundos
  setTimeout(() => {
    alertDiv.style.display = "none";
  }, 5000);
}

// Validación en tiempo real de matrícula duplicada
document.addEventListener("DOMContentLoaded", function () {
  const matriculaInput = document.getElementById("matricula");
  if (matriculaInput) {
    matriculaInput.addEventListener("blur", function () {
      const matricula = this.value.trim();
      if (matricula && isMatriculaDuplicate(matricula)) {
        showAlert("Esta matrícula ya está registrada en el sistema", "danger");
        this.focus();
      }
    });
  }
});
