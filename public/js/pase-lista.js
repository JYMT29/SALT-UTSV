// Configuración de la API
const API_BASE_URL = "https://salt-utsv-production.up.railway.app";

// Estado global
let alumnos = [];
let estudiantes = []; // Para comparar con la tabla estudiantes
let horarios = []; // Para obtener materia y hora
let carrerasUnicas = new Set();
let gruposUnicos = new Set();
let materiasUnicas = new Set(); // Nuevo filtro por materia
let usuarioLogueado = null;

// Elementos del DOM
const alumnosContainer = document.getElementById("alumnos-container");
const messageContainer = document.getElementById("message-container");
const laboratorioFilter = document.getElementById("laboratorio-filter");
const carreraFilter = document.getElementById("carrera-filter");
const totalAlumnosEl = document.getElementById("total-alumnos");
const totalLab1El = document.getElementById("total-lab1");
const totalLab2El = document.getElementById("total-lab2");
const totalRegistrosEl = document.getElementById("total-registros");
const fechaActualizacionEl = document.getElementById("fecha-actualizacion");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logout-btn");

// Función para verificar sesión
async function verificarSesion() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/verify-session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      usuarioLogueado = data.usuario;
      return true;
    } else {
      localStorage.removeItem("authToken");
      return false;
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    localStorage.removeItem("authToken");
    return false;
  }
}

// Función para mostrar/ocultar interfaz según autenticación
function toggleInterfaz(autenticado) {
  const elementosProtegidos = document.querySelectorAll(".protegido");
  const loginSection = document.getElementById("login-section");

  if (autenticado) {
    elementosProtegidos.forEach((el) => (el.style.display = ""));
    if (loginSection) loginSection.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";

    // Mostrar información del usuario
    const userInfo = document.getElementById("user-info");
    if (userInfo && usuarioLogueado) {
      userInfo.textContent = `Bienvenido, ${
        usuarioLogueado.nombre || usuarioLogueado.email
      }`;
      userInfo.style.display = "block";
    }
  } else {
    elementosProtegidos.forEach((el) => (el.style.display = "none"));
    if (loginSection) loginSection.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";

    const userInfo = document.getElementById("user-info");
    if (userInfo) userInfo.style.display = "none";

    // Mostrar modal de login automáticamente
    if (loginModal) {
      const modal = new bootstrap.Modal(loginModal);
      modal.show();
    }
  }
}

// Función de login
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("authToken", data.token);
      usuarioLogueado = data.usuario;

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(loginModal);
      modal.hide();

      // Mostrar interfaz principal
      toggleInterfaz(true);

      // Cargar datos
      Promise.all([fetchHorarios(), fetchEstudiantes()]).then(() => {
        fetchAlumnos();
      });

      showMessage("Inicio de sesión exitoso", "success");
      return true;
    } else {
      showMessage(data.error || "Error en el inicio de sesión", "error");
      return false;
    }
  } catch (error) {
    console.error("Error en login:", error);
    showMessage("Error de conexión al servidor", "error");
    return false;
  }
}

// Función de logout
function logout() {
  localStorage.removeItem("authToken");
  usuarioLogueado = null;
  toggleInterfaz(false);
  showMessage("Sesión cerrada correctamente", "success");
}

// Función para convertir fecha a hora de CDMX (GMT-6)
function toCDMXTime(dateString) {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    // Aplicar offset manual para GMT-6
    const offset = -6 * 60; // GMT-6 en minutos
    const localDate = new Date(
      date.getTime() + (offset - date.getTimezoneOffset()) * 60000
    );

    return localDate.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    console.error("Error al convertir a hora CDMX:", error);
    return "Fecha inválida";
  }
}

// Función para obtener fecha y hora separadas en CDMX (GMT-6)
function getCDMXDateTimeSeparated(dateString) {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    // Aplicar offset manual para GMT-6
    const offset = -6 * 60; // GMT-6 en minutos
    const localDate = new Date(
      date.getTime() + (offset - date.getTimezoneOffset()) * 60000
    );

    const fechaFormateada = localDate.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const horaFormateada = localDate.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      fecha: fechaFormateada,
      hora: horaFormateada,
      dateObj: localDate, // Usar la fecha ajustada
    };
  } catch (error) {
    console.error("Error al formatear fecha CDMX:", error);
    return {
      fecha: "Fecha inválida",
      hora: "--:--",
      dateObj: new Date(),
    };
  }
}

// Función para formatear la fecha separada en hora CDMX
function formatFechaSeparada(fechaString) {
  const { fecha, hora } = getCDMXDateTimeSeparated(fechaString);
  return `
    <span class="fecha">${fecha}</span>
    <span class="hora">${hora}</span>
  `;
}

// Función para mostrar mensajes
function showMessage(message, type = "error") {
  const alertClass =
    type === "success"
      ? "alert-success"
      : type === "warning"
      ? "alert-warning"
      : "alert-danger";
  messageContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
  setTimeout(() => {
    messageContainer.innerHTML = "";
  }, 5000);
}

// Función para obtener horarios desde la API
async function fetchHorarios() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No autenticado");
    }

    // Obtener horarios de ambos laboratorios
    const [responseLab1, responseLab2] = await Promise.all([
      fetch(`${API_BASE_URL}/api/horarios?lab=lab1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${API_BASE_URL}/api/horarios?lab=lab2`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    if (!responseLab1.ok || !responseLab2.ok) {
      if (responseLab1.status === 401 || responseLab2.status === 401) {
        logout();
        throw new Error("Sesión expirada");
      }
      throw new Error(`Error HTTP al obtener horarios`);
    }

    const horariosLab1 = await responseLab1.json();
    const horariosLab2 = await responseLab2.json();

    // Combinar todos los horarios
    horarios = [
      ...(horariosLab1.success ? horariosLab1.horarios : []),
      ...(horariosLab2.success ? horariosLab2.horarios : []),
    ];

    // Extraer materias únicas para el filtro
    materiasUnicas = new Set(horarios.map((h) => h.materia).filter(Boolean));
    updateMateriaFilter();
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    if (error.message === "Sesión expirada") {
      showMessage(
        "Sesión expirada. Por favor inicie sesión nuevamente.",
        "error"
      );
    } else {
      showMessage("Error al obtener horarios", "warning");
    }
  }
}

// Función para obtener estudiantes desde la API
async function fetchEstudiantes() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No autenticado");
    }

    const response = await fetch(`${API_BASE_URL}/api/estudiantes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Sesión expirada");
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const estudiantesData = await response.json();

    if (estudiantesData.success) {
      estudiantes = estudiantesData.data;
      updateGrupoFilter();
    } else {
      console.error("Error al obtener estudiantes:", estudiantesData.error);
      showMessage("Error al obtener la lista de estudiantes", "error");
    }
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    if (error.message === "Sesión expirada") {
      showMessage(
        "Sesión expirada. Por favor inicie sesión nuevamente.",
        "error"
      );
    } else {
      showMessage(
        "Error al conectar con el servidor para obtener estudiantes",
        "error"
      );
    }
  }
}

// Función para encontrar la materia y horario basado en la fecha de registro
function encontrarMateriaYHorario(alumno) {
  if (!alumno.fecha || !alumno.laboratorio) {
    return {
      materia: "No disponible",
      horario: "No disponible",
      grupoHorario: "",
    };
  }

  try {
    // Convertir la fecha usando nuestra función corregida
    const fechaOriginal = new Date(alumno.fecha);
    const { dateObj: fechaCDMX, hora: horaCDMX } =
      getCDMXDateTimeSeparated(fechaOriginal);

    const diaSemana = fechaCDMX.getDay();

    // Mapear día numérico a texto
    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const diaTexto = dias[diaSemana];

    console.log(`Procesando alumno: ${alumno.nombre}`);
    console.log(`Fecha original: ${alumno.fecha}`);
    console.log(`Fecha CDMX (GMT-6): ${toCDMXTime(fechaOriginal)}`);
    console.log(`Día: ${diaTexto}, Hora: ${horaCDMX}`);

    // Buscar horario que coincida
    const horarioCoincidente = horarios.find((horario) => {
      // Verificar laboratorio y día
      if (
        horario.laboratorio !== alumno.laboratorio ||
        horario.dia !== diaTexto
      ) {
        return false;
      }

      // Verificar si la hora de registro está dentro del rango del horario
      const [horaInicio, horaFin] = horario.hora
        .split("-")
        .map((h) => h.trim());

      console.log(
        `Comparando con horario: ${horario.hora}, Materia: ${horario.materia}`
      );
      console.log(
        `Hora registro (GMT-6): ${horaCDMX}, Hora inicio: ${horaInicio}, Hora fin: ${horaFin}`
      );

      // Convertir horas a minutos para comparación
      const horaToMinutes = (horaStr) => {
        const [horas, minutos] = horaStr.split(":").map(Number);
        return horas * 60 + (minutos || 0);
      };

      const registroMinutos = horaToMinutes(horaCDMX);
      const inicioMinutos = horaToMinutes(horaInicio);
      const finMinutos = horaToMinutes(horaFin);

      return registroMinutos >= inicioMinutos && registroMinutos <= finMinutos;
    });

    if (horarioCoincidente) {
      console.log(`✅ Coincidencia encontrada: ${horarioCoincidente.materia}`);
      return {
        materia: horarioCoincidente.materia || "Sin materia",
        horario: horarioCoincidente.hora || "Sin horario",
        grupoHorario: horarioCoincidente.grupo || "",
      };
    } else {
      console.log(`❌ Fuera de horario`);
      return {
        materia: "Fuera de horario",
        horario: `${diaTexto} ${horaCDMX}`,
        grupoHorario: "",
      };
    }
  } catch (error) {
    console.error("Error al procesar fecha del alumno:", error, alumno);
    return { materia: "Error en fecha", horario: "Error", grupoHorario: "" };
  }
}

// Función para obtener alumnos desde la API
async function fetchAlumnos() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No autenticado");
    }

    alumnosContainer.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="loading">Cargando lista de alumnos...</div>
        </td>
      </tr>
    `;

    const response = await fetch(`${API_BASE_URL}/alumnos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Sesión expirada");
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const alumnosData = await response.json();

    // Procesar datos - obtener nombre, carrera, laboratorio, fecha y grupo
    alumnos = alumnosData.map((alumno) => {
      // Buscar el estudiante correspondiente para obtener el grupo
      const estudiante = estudiantes.find(
        (est) => est.matricula === alumno.matricula
      );

      // Encontrar materia y horario basado en la fecha de registro
      const infoHorario = encontrarMateriaYHorario(alumno);

      return {
        nombre: alumno.nombre || "Sin nombre",
        carrera: alumno.carrera || "Sin carrera",
        laboratorio: alumno.laboratorio || "lab1",
        fecha: alumno.fecha || new Date().toISOString(),
        grupo: estudiante ? estudiante.grupo || "Sin grupo" : "Sin grupo",
        matricula: alumno.matricula, // Necesario para la comparación
        materia: infoHorario.materia,
        horario: infoHorario.horario,
        grupoHorario: infoHorario.grupo,
        // Guardar también la fecha formateada en CDMX para mostrar
        fechaCDMX: toCDMXTime(alumno.fecha),
      };
    });

    // Extraer carreras únicas para el filtro
    carrerasUnicas = new Set(alumnos.map((a) => a.carrera).filter(Boolean));
    updateCarreraFilter();

    // Extraer grupos únicos para el filtro
    gruposUnicos = new Set(alumnos.map((a) => a.grupo).filter(Boolean));
    updateGrupoFilter();

    // Extraer materias únicas para el filtro (de los horarios encontrados)
    const materiasAlumnos = new Set(
      alumnos.map((a) => a.materia).filter(Boolean)
    );
    updateMateriaFilter(materiasAlumnos);

    renderAlumnos();
    updateStats();

    // Actualizar fecha con hora actual de CDMX
    const now = new Date();
    fechaActualizacionEl.textContent = toCDMXTime(now);

    showMessage(
      `Datos cargados correctamente: ${alumnos.length} alumnos encontrados`,
      "success"
    );
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    if (error.message === "Sesión expirada") {
      alumnosContainer.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="error">Sesión expirada. Por favor inicie sesión nuevamente.</div>
          </td>
        </tr>
      `;
    } else {
      alumnosContainer.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="error">Error al cargar los datos: ${error.message}</div>
          </td>
        </tr>
      `;
    }
    showMessage("Error al conectar con el servidor", "error");
  }
}

// Función para actualizar el filtro de materias
function updateMateriaFilter(materiasAlumnos = null) {
  // Crear el filtro de materias si no existe
  let materiaFilter = document.getElementById("materia-filter");

  if (!materiaFilter) {
    // Agregar el filtro de materias al HTML
    const controlsContainer = document.querySelector(
      ".controls-container .row"
    );
    const materiaFilterHTML = `
      <div class="col-md-4 mb-3">
        <div class="filter-group">
          <label for="materia-filter">
            <i class="bi bi-book me-1"></i>Filtrar por Materia:
          </label>
          <select class="form-select" id="materia-filter">
            <option value="all">Todas las materias</option>
          </select>
        </div>
      </div>
    `;

    // Insertar después del filtro de grupo
    const grupoFilterDiv = document.getElementById("grupo-filter")
      ? document.getElementById("grupo-filter").closest(".col-md-4")
      : controlsContainer.querySelector(".col-md-4:last-child");

    grupoFilterDiv.insertAdjacentHTML("afterend", materiaFilterHTML);

    // Agregar event listener al nuevo filtro
    materiaFilter = document.getElementById("materia-filter");
    materiaFilter.addEventListener("change", renderAlumnos);
  }

  // Actualizar opciones del filtro
  materiaFilter.innerHTML = '<option value="all">Todas las materias</option>';

  const materiasParaFiltrar = materiasAlumnos || materiasUnicas;

  materiasParaFiltrar.forEach((materia) => {
    if (
      materia &&
      materia !== "No disponible" &&
      materia !== "Fuera de horario" &&
      materia !== "Error en fecha"
    ) {
      const option = document.createElement("option");
      option.value = materia;
      option.textContent = materia;
      materiaFilter.appendChild(option);
    }
  });
}

// Función para actualizar el filtro de grupos
function updateGrupoFilter() {
  // Crear el filtro de grupos si no existe
  let grupoFilter = document.getElementById("grupo-filter");

  if (!grupoFilter) {
    // Agregar el filtro de grupos al HTML
    const controlsContainer = document.querySelector(
      ".controls-container .row"
    );
    const grupoFilterHTML = `
      <div class="col-md-4 mb-3">
        <div class="filter-group">
          <label for="grupo-filter">
            <i class="bi bi-people me-1"></i>Filtrar por Grupo:
          </label>
          <select class="form-select" id="grupo-filter">
            <option value="all">Todos los grupos</option>
          </select>
        </div>
      </div>
    `;

    // Insertar después del filtro de carrera
    const carreraFilterDiv = controlsContainer.querySelector(
      ".col-md-4:nth-child(2)"
    );
    carreraFilterDiv.insertAdjacentHTML("afterend", grupoFilterHTML);

    // Agregar event listener al nuevo filtro
    grupoFilter = document.getElementById("grupo-filter");
    grupoFilter.addEventListener("change", renderAlumnos);
  }

  // Actualizar opciones del filtro
  grupoFilter.innerHTML = '<option value="all">Todos los grupos</option>';

  gruposUnicos.forEach((grupo) => {
    if (grupo && grupo !== "Sin grupo") {
      const option = document.createElement("option");
      option.value = grupo;
      option.textContent = grupo;
      grupoFilter.appendChild(option);
    }
  });
}

// Función para actualizar el filtro de carreras
function updateCarreraFilter() {
  carreraFilter.innerHTML = '<option value="all">Todas las carreras</option>';

  carrerasUnicas.forEach((carrera) => {
    if (carrera && carrera !== "Sin carrera") {
      const option = document.createElement("option");
      option.value = carrera;
      option.textContent = carrera;
      carreraFilter.appendChild(option);
    }
  });
}

// Función para renderizar la lista de alumnos
function renderAlumnos() {
  const laboratorioSeleccionado = laboratorioFilter.value;
  const carreraSeleccionada = carreraFilter.value;
  const grupoSeleccionado = document.getElementById("grupo-filter")
    ? document.getElementById("grupo-filter").value
    : "all";
  const materiaSeleccionada = document.getElementById("materia-filter")
    ? document.getElementById("materia-filter").value
    : "all";

  // Filtrar alumnos
  const alumnosFiltrados = alumnos.filter((alumno) => {
    const coincideLaboratorio =
      laboratorioSeleccionado === "all" ||
      alumno.laboratorio === laboratorioSeleccionado;
    const coincideCarrera =
      carreraSeleccionada === "all" || alumno.carrera === carreraSeleccionada;
    const coincideGrupo =
      grupoSeleccionado === "all" || alumno.grupo === grupoSeleccionado;
    const coincideMateria =
      materiaSeleccionada === "all" || alumno.materia === materiaSeleccionada;

    return (
      coincideLaboratorio && coincideCarrera && coincideGrupo && coincideMateria
    );
  });

  // Actualizar estadísticas
  updateStats(alumnosFiltrados);

  // Renderizar lista
  if (alumnosFiltrados.length === 0) {
    alumnosContainer.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="empty-state">
            <i class="bi bi-search"></i>
            <p>No hay alumnos que coincidan con los filtros seleccionados</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Usar tabla HTML con diseño mejorado
  alumnosContainer.innerHTML = alumnosFiltrados
    .map((alumno, index) => {
      // Determinar el estilo según si está en horario o fuera de horario
      const esFueraDeHorario =
        alumno.materia === "Fuera de horario" ||
        alumno.materia === "No disponible";
      const claseMateria = esFueraDeHorario
        ? "clase-info fuera-de-horario"
        : "clase-info";

      return `
        <tr>
          <td>
            <div class="alumno-info">
              <span class="nombre">${alumno.nombre}</span>
              <span class="carrera-mobile d-md-none">${alumno.carrera}</span>
            </div>
          </td>
          <td class="d-none d-md-table-cell">${alumno.carrera}</td>
          <td>
            <span class="badge ${
              alumno.laboratorio === "lab1" ? "badge-lab1" : "badge-lab2"
            }">
              ${alumno.laboratorio.toUpperCase()}
            </span>
          </td>
          <td>
            <span class="badge ${
              alumno.grupo === "Sin grupo" ? "badge-secondary" : "badge-primary"
            }">
              ${alumno.grupo}
            </span>
          </td>
          <td>
            <div class="${claseMateria}">
              ${
                esFueraDeHorario
                  ? `<span class="materia fuera">${alumno.materia}</span>
                 <span class="horario">${alumno.horario}</span>`
                  : `<span class="materia">${alumno.materia}</span>
                 <span class="horario">${alumno.horario}</span>
                 ${
                   alumno.grupoHorario && alumno.grupoHorario !== "Sin grupo"
                     ? `<span class="grupo-horario">Grupo: ${alumno.grupoHorario}</span>`
                     : ""
                 }`
              }
            </div>
          </td>
          <td>
            <div class="fecha-registro">
              ${formatFechaSeparada(alumno.fecha)}
              <small class="text-muted d-block">CDMX (GMT-6)</small>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Función para actualizar estadísticas
function updateStats(alumnosFiltrados = null) {
  const datos = alumnosFiltrados || alumnos;

  totalAlumnosEl.textContent = datos.length;
  totalRegistrosEl.textContent = datos.length;

  const lab1Count = datos.filter((a) => a.laboratorio === "lab1").length;
  const lab2Count = datos.filter((a) => a.laboratorio === "lab2").length;

  totalLab1El.textContent = lab1Count;
  totalLab2El.textContent = lab2Count;
}

// Función auxiliar para debug de horas
function debugHoras() {
  const ahora = new Date();
  console.log("=== DEBUG HORAS ===");
  console.log("Hora servidor (UTC):", ahora.toISOString());
  console.log("Hora local navegador:", ahora.toLocaleString("es-MX"));
  console.log("Hora CDMX (GMT-6):", toCDMXTime(ahora));
  console.log(
    "Zona horaria navegador:",
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  console.log("===================");
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", async function () {
  // Verificar sesión al cargar
  const autenticado = await verificarSesion();
  toggleInterfaz(autenticado);

  if (autenticado) {
    // Debug de horas al inicio
    debugHoras();

    // Cargar horarios, estudiantes y luego alumnos
    Promise.all([fetchHorarios(), fetchEstudiantes()]).then(() => {
      fetchAlumnos();
    });
  }

  // Event listeners para filtros
  laboratorioFilter.addEventListener("change", renderAlumnos);
  carreraFilter.addEventListener("change", renderAlumnos);

  // Event listener para botón de actualizar
  document
    .getElementById("refresh-btn")
    ?.addEventListener("click", function () {
      Promise.all([fetchHorarios(), fetchEstudiantes()]).then(() => {
        fetchAlumnos();
      });
    });

  // Event listener para login form
  loginForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    await login(email, password);
  });

  // Event listener para logout
  logoutBtn?.addEventListener("click", logout);
});

// Función para probar la conexión
async function testConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hello`);
    const data = await response.json();
    console.log("Conexión exitosa:", data);
  } catch (error) {
    console.error("Error de conexión:", error);
  }
}

// Probar conexión al cargar
testConnection();
