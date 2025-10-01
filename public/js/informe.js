// Variable global para almacenar los datos del horario
let horarioData = [];
let currentAlumnosData = []; // Variable para almacenar los datos actuales

// Inicializar jsPDF
const { jsPDF } = window.jspdf;

// Cargar horarios al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  // Actualizar fecha de generación
  const now = new Date();
  document.getElementById("fecha-generacion").textContent =
    now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
      currentAlumnosData = filterAlumnos(data, fechaFiltro, laboratorio);
      loadTableData(currentAlumnosData);
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

  // Actualizar contador de registros
  document.getElementById("total-registros").textContent = data.length;
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

// Evento para generar PDF
document.getElementById("pdf-button").addEventListener("click", function () {
  generarPDF();
});

// Función para cargar imágenes como Base64 para el PDF
function cargarImagenComoBase64(url, callback) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = function () {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const dataURL = canvas.toDataURL("image/png");
    callback(dataURL);
  };
  img.onerror = function () {
    console.error("Error al cargar la imagen:", url);
    callback(null);
  };
  img.src = url;
}

// Función para generar PDF con diseño profesional, tabla centrada y 2 logos
function generarPDF() {
  if (currentAlumnosData.length === 0) {
    alert("No hay datos para exportar. Por favor, carga los datos primero.");
    return;
  }

  const doc = new jsPDF();
  const laboratorio = obtenerLaboratorioDesdeUrl();
  const fechaFiltro = document.getElementById("fecha").value;

  // Configuración de colores
  const primaryColor = [26, 60, 110]; // #1a3c6e
  const secondaryColor = [212, 175, 55]; // #d4af37
  const lightGray = [245, 247, 250];

  // URLs de los logos - REEMPLAZA ESTAS URLS CON LAS DE TUS LOGOS
  const logo1Url = "img/logo ut-Photoroom.png"; // Primer logo
  const logo2Url = "img/logo-salt.png"; // Segundo logo - cambia por tu segundo logo

  // Cargar ambas imágenes antes de generar el PDF
  Promise.all([
    new Promise((resolve) => cargarImagenComoBase64(logo1Url, resolve)),
    new Promise((resolve) => cargarImagenComoBase64(logo2Url, resolve)),
  ])
    .then(([logo1Base64, logo2Base64]) => {
      // Encabezado del PDF con logos
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 50, "F");

      // Agregar logos al encabezado
      const logoWidth = 25;
      const logoHeight = 25;
      const logoY = 12;

      // Logo izquierdo
      if (logo1Base64) {
        doc.addImage(logo1Base64, "PNG", 15, logoY, logoWidth, logoHeight);
      }

      // Logo derecho
      if (logo2Base64) {
        doc.addImage(logo2Base64, "PNG", 170, logoY, logoWidth, logoHeight);
      }

      // Título centrado entre los logos
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("SALT-UTSV", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Sistema Avanzado de Laboratorios", 105, 27, {
        align: "center",
      });
      doc.text("Informe de Alumnos", 105, 34, { align: "center" });

      // Información del reporte
      doc.setFillColor(...lightGray);
      doc.rect(10, 55, 190, 20, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);

      const fechaActual = new Date().toLocaleDateString("es-ES");
      const labText = laboratorio
        ? `Laboratorio: ${laboratorio.toUpperCase()}`
        : "Laboratorio: Todos";
      const fechaText = fechaFiltro ? `Fecha: ${fechaFiltro}` : "Fecha: Todas";

      doc.text(`Generado el: ${fechaActual}`, 15, 64);
      doc.text(labText, 15, 70);
      doc.text(fechaText, 105, 64);
      doc.text(`Total de registros: ${currentAlumnosData.length}`, 105, 70);

      // Preparar datos para la tabla
      const tableData = currentAlumnosData.map((alumno) => [
        alumno.matricula || "N/A",
        extraerSoloNombre(alumno.nombre),
        alumno.carrera || "N/A",
        alumno.tipo_equipo || "N/A",
        alumno.numero_equipo || "N/A",
        alumno.maestro || "Sin asignar",
        convertirFechaLocal(alumno.fecha),
      ]);

      // Configurar y generar la tabla CENTRADA
      doc.autoTable({
        startY: 80,
        head: [
          [
            "Matrícula",
            "Nombre",
            "Carrera",
            "Tipo",
            "Número",
            "Maestro",
            "Fecha",
          ],
        ],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          halign: "center",
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        margin: {
          top: 80,
          left: 10,
          right: 10,
        },
        tableWidth: "auto",
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: "auto" },
          2: { cellWidth: "auto" },
          3: { cellWidth: "auto" },
          4: { cellWidth: "auto" },
          5: { cellWidth: "auto" },
          6: { cellWidth: "auto" },
        },
      });

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Página ${i} de ${pageCount} - SALT-UTSV`, 105, 285, {
          align: "center",
        });
      }

      // Guardar el PDF
      const fileName = `informe_alumnos_${laboratorio || "todos"}_${
        fechaFiltro || "todas"
      }_${new Date().getTime()}.pdf`;
      doc.save(fileName);
    })
    .catch((error) => {
      console.error("Error al cargar las imágenes:", error);
      alert("Error al cargar los logos. Generando PDF sin logos...");
      // Aquí podrías llamar a una versión alternativa sin logos
    });
}

// Función para probar la conexión
async function testConnection() {
  try {
    const response = await fetch(
      `https://salt-utsv-production.up.railway.app/api/hello`
    );
    const data = await response.json();
    console.log("Conexión exitosa:", data);
  } catch (error) {
    console.error("Error de conexión:", error);
  }
}

// Probar conexión al cargar
testConnection();
