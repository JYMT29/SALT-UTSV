// Inicializar jsPDF
const { jsPDF } = window.jspdf;

// Variable global para almacenar el rol del usuario
let userRole = "user"; // Valor por defecto
let userId = ""; // Almacenar ID del usuario

// Función para obtener el rol del usuario desde el servidor
async function getUserInfo() {
  try {
    const response = await fetch("/api/user-info", {
      method: "GET",
      credentials: "same-origin",
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    }
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
  }
  return { role: "user", id: "anon" }; // Valores por defecto en caso de error
}

// Función para ajustar la interfaz según el rol
function adjustUIForRole(role) {
  userRole = role;

  // Mostrar elementos solo para administradores
  if (role === "admin") {
    document.querySelectorAll(".admin-only").forEach((element) => {
      element.style.display = "inline-block";
    });
  } else {
    document.querySelectorAll(".admin-only").forEach((element) => {
      element.style.display = "none";
    });
  }
}

// Función para cargar imágenes como Base64 para el PDF
function cargarImagenComoBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = function () {
      console.error("Error al cargar la imagen:", url);
      reject(new Error("Error al cargar la imagen: " + url));
    };
    img.src = url;
  });
}

// Función para exportar el horario a PDF
async function exportarHorarioPDF() {
  try {
    const doc = new jsPDF();
    const laboratorio = obtenerLaboratorioDesdeUrl();

    // Cargar logos
    const [logo1Base64, logo2Base64] = await Promise.all([
      cargarImagenComoBase64("img/utsv.png").catch(() => null),
      cargarImagenComoBase64("img/TI_Logo2.png").catch(() => null),
    ]);

    // Configuración de colores
    const primaryColor = [26, 60, 110]; // #1a3c6e
    const primaryLight = [42, 92, 160]; // #2a5ca0

    // Encabezado con logos
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, "F");

    // Agregar logos
    if (logo1Base64) {
      doc.addImage(logo1Base64, "PNG", 10, 5, 30, 15);
    }

    if (logo2Base64) {
      doc.addImage(logo2Base64, "PNG", 170, 5, 30, 15);
    }

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Horario Laboratorio", 105, 12, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const ubicacion = document.getElementById("ubicacion").textContent;
    doc.text(ubicacion, 105, 18, { align: "center" });

    // Preparar datos de la tabla
    const tableData = [];
    const rows = document.querySelectorAll("#horarioBody tr");

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length === 7) {
        // Hora + 6 días
        const rowData = [
          cells[0].textContent.trim(), // Hora
          cells[1].textContent.trim(), // Lunes
          cells[2].textContent.trim(), // Martes
          cells[3].textContent.trim(), // Miércoles
          cells[4].textContent.trim(), // Jueves
          cells[5].textContent.trim(), // Viernes
          cells[6].textContent.trim(), // Sábado
        ];
        tableData.push(rowData);
      }
    });

    // Configurar y generar la tabla
    doc.autoTable({
      startY: 30,
      head: [
        ["Hora", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
      ],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
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
      margin: {
        top: 30,
        left: 10,
        right: 10,
      },
      tableWidth: "auto",
    });

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString(
          "es-ES"
        )}`,
        105,
        285,
        { align: "center" }
      );
    }

    // Guardar el PDF
    const fileName = `horario_${laboratorio}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  }
}

// Función para obtener el laboratorio desde la URL
function obtenerLaboratorioDesdeUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("lab") || "laboratorio";
}

// Inicializar la página
document.addEventListener("DOMContentLoaded", async function () {
  // Obtener información del usuario
  const userInfo = await getUserInfo();
  userRole = userInfo.role;
  userId = userInfo.id;

  // Ajustar la interfaz según el rol
  adjustUIForRole(userRole);

  // Event listener para el botón de exportar PDF
  document
    .getElementById("exportPdf")
    .addEventListener("click", exportarHorarioPDF);

  // Cargar el resto de la funcionalidad
  initializeHorarioFunctions();
});

// Función para inicializar todas las funciones de horario
function initializeHorarioFunctions() {
  // Obtener laboratorio de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const laboratorio = urlParams.get("lab");

  // Validación del laboratorio
  if (!laboratorio || !["lab1", "lab2", "lab3", "lab4"].includes(laboratorio)) {
    const errorMsg =
      "Error: Laboratorio no especificado o inválido. Use ?lab=lab1, lab2, lab3 o lab4";
    console.error(errorMsg);
    alert(errorMsg);
    return;
  }

  // Elementos del DOM con validación mejorada
  const elements = {
    horarioBody: document.getElementById("horarioBody"),
    saveButton: document.getElementById("saveHorario"),
    addRowButton: document.getElementById("addRow"),
    ubicacionTitle: document.getElementById("ubicacion"),
  };

  const missingElements = Object.entries(elements)
    .filter(([_, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error(
      `Error: Elementos del DOM no encontrados - ${missingElements.join(", ")}`
    );
    alert(
      `Error: No se encontraron elementos necesarios (${missingElements.join(
        ", "
      )})`
    );
    return;
  }

  // Si llegamos aquí, todos los elementos existen
  const { horarioBody, saveButton, addRowButton, ubicacionTitle } = elements;

  // Mostrar la ubicación del laboratorio
  ubicacionTitle.textContent = `Laboratorio ${laboratorio.toUpperCase()}`;

  // Mapeo de días para consistencia
  const DIAS_SEMANA = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const DIAS_NORMALIZADOS = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];

  // Función para transformar el formato al esperado por el backend
  const transformarHorarios = (horarios) => {
    return horarios.map((horario) => {
      const [hora_inicio, hora_fin] = horario.hora
        .split("-")
        .map((h) => h.trim());
      return {
        hora_inicio: hora_inicio.length === 4 ? `0${hora_inicio}` : hora_inicio,
        hora_fin: hora_fin.length === 4 ? `0${hora_fin}` : hora_fin,
        materia: horario.materia,
        maestro: horario.maestro,
        dia:
          horario.dia.charAt(0).toUpperCase() +
          horario.dia.slice(1).toLowerCase(),
      };
    });
  };

  // 1. Función mejorada para cargar horarios
  const cargarHorarios = async () => {
    try {
      console.log(`Cargando horarios para ${laboratorio}...`);
      horarioBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Cargando horarios...</td></tr>';

      const response = await fetch(
        `https://salt-utsv-production.up.railway.app/api/horarios?lab=${laboratorio}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Datos recibidos del servidor:", data);

      if (!data.success || !data.horarios || data.horarios.length === 0) {
        horarioBody.innerHTML =
          '<tr><td colspan="7" class="text-center">No hay horarios registrados para este laboratorio</td></tr>';
        return;
      }

      // Procesamiento de los datos
      const horasUnicas = [
        ...new Set(data.horarios.map((item) => item.hora)),
      ].sort();
      const horariosPorHora = {};

      // Inicializar estructura para todas las horas
      horasUnicas.forEach((hora) => {
        horariosPorHora[hora] = {};
        DIAS_NORMALIZADOS.forEach((dia) => {
          horariosPorHora[hora][dia] = "";
        });
      });

      // Llenar con datos reales
      data.horarios.forEach((item) => {
        const hora = item.hora || "";
        const dia = item.dia
          .toLowerCase()
          .replace("miércoles", "miercoles")
          .replace("sábado", "sabado");
        const materia = item.materia || "";
        const maestro = item.maestro || "";

        if (DIAS_NORMALIZADOS.includes(dia) && horariosPorHora[hora]) {
          horariosPorHora[hora][dia] = `${materia}${
            maestro ? " / " + maestro : ""
          }`;
        }
      });

      // Construir tabla
      horarioBody.innerHTML = "";
      horasUnicas.forEach((hora) => {
        const row = document.createElement("tr");

        // Celda de hora
        const horaCell = document.createElement("td");
        horaCell.textContent = hora;
        horaCell.className = "hora-cell align-middle";
        horaCell.contentEditable = userRole !== "user";
        row.appendChild(horaCell);

        // Celdas para cada día en orden
        DIAS_NORMALIZADOS.forEach((dia) => {
          const cell = document.createElement("td");
          cell.textContent = horariosPorHora[hora][dia] || "";
          cell.className = "dia-cell align-middle";
          if (userRole !== "user") {
            cell.classList.add("editable");
          }
          cell.setAttribute("data-dia", dia);
          cell.setAttribute("data-hora", hora);
          if (userRole !== "user") {
            cell.addEventListener("dblclick", () => editarCelda(cell));
          }
          row.appendChild(cell);
        });

        horarioBody.appendChild(row);
      });

      console.log("Horarios cargados correctamente para", laboratorio);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      horarioBody.innerHTML = `<tr><td colspan="7" class="text-center">Error al cargar horarios: ${error.message}</td></tr>`;
      alert(`Error al cargar horarios: ${error.message}`);
    }
  };

  // 2. Función para editar celdas (solo para admin)
  const editarCelda = (cell) => {
    if (userRole === "user") return;

    if (cell.classList.contains("editando")) return;
    cell.classList.add("editando", "p-0");

    const currentText = cell.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "form-control rounded-0 h-100 border-0";

    cell.textContent = "";
    cell.appendChild(input);
    input.focus();

    const finalizarEdicion = () => {
      const nuevoValor = input.value.trim();
      cell.textContent = nuevoValor;
      cell.classList.remove("editando", "p-0");

      const [materia, maestro] = nuevoValor.split("/").map((s) => s.trim());
      if (materia) {
        cell.setAttribute("data-materia", materia);
        cell.setAttribute("data-maestro", maestro || "");
      }
    };

    input.addEventListener("blur", finalizarEdicion);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finalizarEdicion();
      if (e.key === "Escape") {
        cell.textContent = currentText;
        cell.classList.remove("editando", "p-0");
      }
    });
  };

  // 3. Función para guardar horarios (solo para admin)
  const guardarHorario = async () => {
    if (userRole === "user") {
      alert("No tienes permisos para guardar horarios");
      return;
    }

    try {
      const rows = horarioBody.querySelectorAll("tr");
      const horarios = [];

      rows.forEach((row) => {
        const horaCell = row.querySelector("td.hora-cell");
        if (!horaCell) return;

        const hora = horaCell.textContent.trim();
        if (!hora) return;

        const diaCells = row.querySelectorAll("td[data-dia]");
        diaCells.forEach((cell) => {
          const dia = cell.getAttribute("data-dia");
          const contenido = cell.textContent.trim();
          if (contenido) {
            const [materia, maestro] = contenido
              .split("/")
              .map((s) => s.trim());
            horarios.push({
              hora,
              dia,
              materia: materia || "",
              maestro: maestro || "",
            });
          }
        });
      });

      if (horarios.length === 0) {
        alert("No hay datos para guardar");
        return;
      }

      const horariosTransformados = transformarHorarios(horarios);

      console.log("Enviando horarios al servidor:", horariosTransformados);

      const response = await fetch(
        `https://salt-utsv-production.up.railway.app/api/horarios?lab=${laboratorio}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            laboratorio,
            horarios: horariosTransformados,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Respuesta del servidor:", result);

      if (result.success) {
        alert("Horario guardado correctamente");
        cargarHorarios();
      } else {
        throw new Error(result.message || "Error al guardar horarios");
      }
    } catch (error) {
      console.error("Error al guardar horarios:", error);
      alert(`Error al guardar horarios: ${error.message}`);
    }
  };

  // 4. Función para agregar nueva fila (solo para admin)
  const agregarFila = () => {
    if (userRole === "user") {
      alert("No tienes permisos para agregar filas");
      return;
    }

    const row = document.createElement("tr");

    // Celda de hora (editable)
    const horaCell = document.createElement("td");
    horaCell.textContent = "07:00-08:00";
    horaCell.className = "hora-cell align-middle editable";
    horaCell.contentEditable = true;
    horaCell.addEventListener("dblclick", () => editarCelda(horaCell));
    row.appendChild(horaCell);

    // Celdas de días
    DIAS_NORMALIZADOS.forEach((dia) => {
      const cell = document.createElement("td");
      cell.className = "dia-cell editable align-middle";
      cell.setAttribute("data-dia", dia);
      cell.addEventListener("dblclick", () => editarCelda(cell));
      row.appendChild(cell);
    });

    horarioBody.appendChild(row);
  };

  // Event listeners para admin
  if (userRole === "admin") {
    saveButton.addEventListener("click", guardarHorario);
    addRowButton.addEventListener("click", agregarFila);
  }

  // Cargar horarios al iniciar
  cargarHorarios();
}
