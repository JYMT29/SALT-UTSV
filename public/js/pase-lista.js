// Configuración de la API
const API_BASE_URL = "https://salt-utsv-production.up.railway.app";

// Estado global
let alumnos = [];
let carrerasUnicas = new Set();

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

// Función para obtener alumnos desde la API
async function fetchAlumnos() {
  try {
    alumnosContainer.innerHTML = `
            <tr>
              <td colspan="3" class="text-center py-4">
                <div class="loading">Cargando lista de alumnos...</div>
              </td>
            </tr>
          `;

    const response = await fetch(`${API_BASE_URL}/alumnos`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const alumnosData = await response.json();

    // Procesar datos - obtener solo nombre, carrera y laboratorio
    alumnos = alumnosData.map((alumno) => ({
      nombre: alumno.nombre || "Sin nombre",
      carrera: alumno.carrera || "Sin carrera",
      laboratorio: alumno.laboratorio || "lab1",
    }));

    // Extraer carreras únicas para el filtro
    carrerasUnicas = new Set(alumnos.map((a) => a.carrera).filter(Boolean));
    updateCarreraFilter();

    renderAlumnos();
    updateStats();

    // Actualizar fecha
    const now = new Date();
    fechaActualizacionEl.textContent = now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    showMessage(
      `Datos cargados correctamente: ${alumnos.length} alumnos encontrados`,
      "success"
    );
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    alumnosContainer.innerHTML = `
            <tr>
              <td colspan="3" class="text-center py-4">
                <div class="error">Error al cargar los datos: ${error.message}</div>
              </td>
            </tr>
          `;
    showMessage("Error al conectar con el servidor", "error");
  }
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

// Función para renderizar la lista de alumnos CORREGIDA
function renderAlumnos() {
  const laboratorioSeleccionado = laboratorioFilter.value;
  const carreraSeleccionada = carreraFilter.value;

  // Filtrar alumnos
  const alumnosFiltrados = alumnos.filter((alumno) => {
    const coincideLaboratorio =
      laboratorioSeleccionado === "all" ||
      alumno.laboratorio === laboratorioSeleccionado;
    const coincideCarrera =
      carreraSeleccionada === "all" || alumno.carrera === carreraSeleccionada;
    return coincideLaboratorio && coincideCarrera;
  });

  // Actualizar estadísticas
  updateStats(alumnosFiltrados);

  // Renderizar lista CORREGIDA - usando tabla HTML
  if (alumnosFiltrados.length === 0) {
    alumnosContainer.innerHTML = `
            <tr>
              <td colspan="3" class="text-center py-4">
                <div class="empty-state">
                  <i class="bi bi-search"></i>
                  <p>No hay alumnos que coincidan con los filtros seleccionados</p>
                </div>
              </td>
            </tr>
          `;
    return;
  }

  // Usar tabla HTML tradicional en lugar de grid
  alumnosContainer.innerHTML = alumnosFiltrados
    .map(
      (alumno, index) => `
          <tr>
            <td>${alumno.nombre}</td>
            <td>${alumno.carrera}</td>
            <td>
              <span class="badge ${
                alumno.laboratorio === "lab1" ? "badge-lab1" : "badge-lab2"
              }">
                ${alumno.laboratorio.toUpperCase()}
              </span>
            </td>
          </tr>
        `
    )
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

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", function () {
  // Cargar datos al iniciar
  fetchAlumnos();

  // Event listeners para filtros
  laboratorioFilter.addEventListener("change", renderAlumnos);
  carreraFilter.addEventListener("change", renderAlumnos);

  // Event listener para botón de actualizar
  document
    .getElementById("refresh-btn")
    .addEventListener("click", fetchAlumnos);
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
