// Variable global para almacenar los datos del horario
let horarioData = [];

// Cargar horarios al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  const savedHorario = localStorage.getItem("horarioData");
  if (savedHorario) {
    horarioData = JSON.parse(savedHorario);
  } else {
    const laboratorio = obtenerLaboratorioDesdeUrl(); // Obtener el laboratorio desde la URL
    fetch(`https://salt-utsv-production.up.railway.app/horarios/${laboratorio}`) // Incluir el laboratorio en la URL
      .then((response) => response.json())
      .then((data) => {
        horarioData = data;
        localStorage.setItem("horarioData", JSON.stringify(data));
      })
      .catch((error) =>
        console.error("Error al cargar los datos de los horarios:", error)
      );
  }
});

// Función para obtener el laboratorio desde la URL
const obtenerLaboratorioDesdeUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const laboratorio = urlParams.get("lab"); // Obtenemos el valor del parámetro 'lab'
  console.log("Valor del laboratorio:", laboratorio);
  return laboratorio;
};

// Función para cargar los datos en la tabla de alumnos con filtros
document.getElementById("load-data").addEventListener("click", function () {
  const fechaFiltro = document.getElementById("fecha").value;
  const laboratorio = obtenerLaboratorioDesdeUrl(); // Obtener el laboratorio

  fetch("https://salt-utsv-production.up.railway.app/alumnos")
    .then((response) => response.json())
    .then((data) => {
      const filteredData = filterAlumnos(data, fechaFiltro, laboratorio);
      loadTableData(filteredData);
    })
    .catch((error) => {
      console.error("Error al cargar los datos de los alumnos:", error);
    });
});

// Función para filtrar los alumnos por fecha y laboratorio
function filterAlumnos(data, fechaFiltro, laboratorio) {
  return data.filter((alumno) => {
    const alumnoFecha = new Date(alumno.fecha).toISOString().split("T")[0];
    const alumnoLab = alumno.laboratorio || "";
    return (
      (fechaFiltro ? alumnoFecha === fechaFiltro : true) &&
      (laboratorio ? alumnoLab === laboratorio : true)
    );
  });
}

// Función para cargar los datos en la tabla de alumnos
function loadTableData(data) {
  const tableBody = document.querySelector("#alumno-table tbody");
  tableBody.innerHTML = "";

  if (!Array.isArray(data)) {
    console.error("El formato de los datos de alumnos no es correcto.");
    return;
  }

  data.forEach((alumno) => {
    const newRow = document.createElement("tr");

    const crearCelda = (contenido) => {
      const celda = document.createElement("td");
      celda.textContent = contenido || "No disponible";
      return celda;
    };

    // Extraer solo el nombre del campo nombre (que contiene nombre + carrera)
    const nombreCompleto = extraerSoloNombre(alumno.nombre);

    newRow.appendChild(crearCelda(alumno.matricula));
    newRow.appendChild(crearCelda(nombreCompleto));
    newRow.appendChild(crearCelda(alumno.carrera));
    newRow.appendChild(crearCelda(alumno.tipo_equipo || "No definido"));
    newRow.appendChild(crearCelda(alumno.numero_equipo || "No definido"));
    newRow.appendChild(crearCelda(alumno.maestro || "Sin asignar"));
    const fechaLocal = convertirFechaLocal(alumno.fecha);
    newRow.appendChild(crearCelda(fechaLocal));

    tableBody.appendChild(newRow);
  });
}

// Función para extraer solo el nombre del campo combinado
function extraerSoloNombre(textoCompleto) {
  if (!textoCompleto) return "No disponible";

  // Eliminar la parte de la carrera (todo lo que viene después de "TSU" o similar)
  const nombre = textoCompleto.split(/(TSU|TECNOLOGIAS|DSM)/i)[0].trim();

  // Opcional: Limpiar espacios adicionales
  return nombre.replace(/\s+/g, " ").trim();
}

// Función para obtener el maestro y la hora según la fecha del alumno
// Función para obtener el maestro y la hora actual según el día y la hora de la PC
function getMaestroYHoraPorFecha() {
  let maestro = "Sin asignar";
  let hora = "Sin hora";

  // Obtener la fecha y hora actual
  const ahora = new Date();

  // Formatear día de la semana en español
  const opciones = { weekday: "long", timeZone: "America/Mexico_City" };
  let diaActual = ahora
    .toLocaleDateString("es-ES", opciones)
    .toLowerCase()
    .trim();

  // Obtener la hora en formato HH:MM
  const horaActual =
    ahora.getHours().toString().padStart(2, "0") +
    ":" +
    ahora.getMinutes().toString().padStart(2, "0");

  console.log(`Día actual: ${diaActual}, Hora actual: ${horaActual}`);

  // Verificar si `horarioData` está disponible
  if (!horarioData || horarioData.length === 0) {
    console.warn("horarioData está vacío o no se ha cargado correctamente.");
    return { maestro, hora };
  }

  // Buscar un horario que coincida con el día actual
  const horarioEncontrado = horarioData.find((horario) => {
    const diaHorario = (horario.dia || "").toLowerCase().trim();
    return diaHorario === diaActual;
  });

  if (horarioEncontrado) {
    const intervaloHorario = horarioEncontrado.hora; // Ejemplo: "08:00 - 10:00"
    const maestroAsignado = horarioEncontrado.maestro || "Sin asignar";

    if (intervaloHorario) {
      const [horaInicio, horaFin] = intervaloHorario.split(" - ");

      // Comparar si la hora actual está dentro del intervalo
      if (horaActual >= horaInicio && horaActual <= horaFin) {
        maestro = maestroAsignado;
        hora = intervaloHorario;
      } else {
        console.warn(
          `La hora actual (${horaActual}) no está dentro del horario (${intervaloHorario}).`
        );
      }
    }
  } else {
    console.warn(`No se encontró horario para el día: ${diaActual}`);
  }

  console.log(`Horario asignado: ${hora} - Maestro: ${maestro}`);
  return { maestro, hora };
}

// Función para convertir la fecha en formato 'YYYY-MM-DD HH:MM:SS'
function convertirFechaLocal(fecha) {
  const fechaLocal = new Date(fecha);
  return isNaN(fechaLocal.getTime())
    ? "Fecha inválida"
    : fechaLocal.toISOString().replace("T", " ").substring(0, 19);
}

// Evento para imprimir el informe
document.getElementById("print-button").addEventListener("click", function () {
  window.print();
});
