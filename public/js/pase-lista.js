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

// Función para mostrar mensajes
function showMessage(message, type = "error") {
  messageContainer.innerHTML = `<div class="${type}">${message}</div>`;
  setTimeout(() => {
    messageContainer.innerHTML = "";
  }, 5000);
}

// Función para obtener alumnos desde la API
async function fetchAlumnos() {
  try {
    alumnosContainer.innerHTML =
      '<div class="loading">Cargando lista de alumnos...</div>';

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

    showMessage(
      `Datos cargados correctamente: ${alumnos.length} alumnos encontrados`,
      "success"
    );
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    alumnosContainer.innerHTML = `<div class="error">Error al cargar los datos: ${error.message}</div>`;
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

// Función para renderizar la lista de alumnos
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

  // Renderizar lista
  if (alumnosFiltrados.length === 0) {
    alumnosContainer.innerHTML =
      '<div class="loading">No hay alumnos que coincidan con los filtros seleccionados</div>';
    return;
  }

  alumnosContainer.innerHTML = "";

  alumnosFiltrados.forEach((alumno, index) => {
    const alumnoRow = document.createElement("div");
    alumnoRow.className = "student-row";

    alumnoRow.innerHTML = `
                    <div>${alumno.nombre}</div>
                    <div>${alumno.carrera}</div>
                    <div>${alumno.laboratorio.toUpperCase()}</div>
                `;

    alumnosContainer.appendChild(alumnoRow);
  });
}

// Función para actualizar estadísticas
function updateStats(alumnosFiltrados = null) {
  const datos = alumnosFiltrados || alumnos;

  totalAlumnosEl.textContent = datos.length;

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
