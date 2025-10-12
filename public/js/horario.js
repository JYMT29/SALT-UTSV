// Inicializar jsPDF
const { jsPDF } = window.jspdf;

// Función para exportar el horario a PDF ocupando toda la hoja
async function exportarHorarioPDF() {
  const elementosOcultos = document.querySelectorAll(".no-pdf");

  // Ocultar elementos que no deben aparecer en el PDF
  elementosOcultos.forEach((elemento) => {
    elemento.style.visibility = "hidden";
    elemento.style.position = "absolute";
  });

  try {
    // Forzar un pequeño delay para asegurar que los elementos estén ocultos
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Capturar la tabla completa con html2canvas
    const tabla = document.getElementById("horarioTable");

    const canvas = await html2canvas(tabla, {
      scale: 2, // Buena calidad
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Crear PDF en orientación horizontal
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Dimensiones de la página A4 en horizontal
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    // Calcular dimensiones para ocupar toda la página
    const margin = 5; // Márgenes mínimos
    const availableWidth = pdfWidth - margin * 2;
    const availableHeight = pdfHeight - margin * 2;

    // Calcular ratio de escala
    const widthRatio = availableWidth / canvas.width;
    const heightRatio = availableHeight / canvas.height;
    const ratio = Math.min(widthRatio, heightRatio);

    // Calcular dimensiones finales
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    // Centrar en la página
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    // Agregar imagen al PDF ocupando toda la página
    doc.addImage(canvas, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST");

    // Pie de página discreto
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-ES")} - SALT-UTSV`,
      pdfWidth / 2,
      pdfHeight - 5,
      { align: "center" }
    );

    // Guardar el PDF
    const laboratorio = obtenerLaboratorioDesdeUrl();
    const fileName = `horario_${laboratorio}_${new Date()
      .toLocaleDateString("es-ES")
      .replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  } finally {
    // Siempre restaurar la visibilidad de los elementos
    elementosOcultos.forEach((elemento) => {
      elemento.style.visibility = "visible";
      elemento.style.position = "";
    });
  }
}

// Función para obtener el laboratorio desde la URL
function obtenerLaboratorioDesdeUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("lab") || "laboratorio";
}

// Función para manejar el botón de regreso sin desloguear
function manejarRegreso() {
  window.location.replace("inicio.html");
}

// Event listener para el botón de exportar PDF
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("exportPdf")
    .addEventListener("click", exportarHorarioPDF);

  // Prevenir el comportamiento por defecto del botón de regreso
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", function (e) {
      e.preventDefault();
      manejarRegreso();
    });
  }
});

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

// Inicializar la página
document.addEventListener("DOMContentLoaded", async function () {
  // Obtener información del usuario
  const userInfo = await getUserInfo();
  userRole = userInfo.role;
  userId = userInfo.id;

  // Ajustar la interfaz según el rol
  adjustUIForRole(userRole);

  // Cargar el resto de la funcionalidad desde horario.js
  // pero usando nuestro sistema de roles
  initializeHorarioFunctions();
});

// Función para inicializar todas las funciones de horario.js
// pero adaptadas a nuestro sistema de roles
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

  // Función para transformar el formato al esperado por el backend - CORREGIDA
  const transformarHorarios = (horarios) => {
    return horarios.map((horario) => {
      const [hora_inicio, hora_fin] = horario.hora
        .split("-")
        .map((h) => h.trim());

      return {
        hora_inicio: hora_inicio.length === 4 ? `0${hora_inicio}` : hora_inicio,
        hora_fin: hora_fin.length === 4 ? `0${hora_fin}` : hora_fin,
        materia: horario.materia || "",
        // Siempre vacío ahora
        grupo: horario.grupo || "",
        dia:
          horario.dia.charAt(0).toUpperCase() +
          horario.dia.slice(1).toLowerCase(),
      };
    });
  };

  // 1. Función mejorada para cargar horarios - CORREGIDA
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

      // Llenar con datos reales - VERSIÓN MÁS ROBUSTA
      data.horarios.forEach((item) => {
        const hora = item.hora || "";
        const dia = item.dia
          .toLowerCase()
          .replace("miércoles", "miercoles")
          .replace("sábado", "sabado");

        // Usar display_text si existe, si no construir manualmente
        let contenido = "";
        if (item.display_text) {
          contenido = item.display_text;
        } else if (item.materia && item.grupo) {
          contenido = `${item.materia} / ${item.grupo}`;
        } else if (item.materia) {
          contenido = item.materia;
        }

        if (DIAS_NORMALIZADOS.includes(dia) && horariosPorHora[hora]) {
          horariosPorHora[hora][dia] = contenido;
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

  // 2. Función para editar celdas (solo para admin) - ACTUALIZADA PARA FORMATO materia/grupo
  const editarCelda = (cell) => {
    if (userRole === "user") return;

    if (cell.classList.contains("editando")) return;
    cell.classList.add("editando", "p-0");

    const currentText = cell.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "form-control rounded-0 h-100 border-0";
    input.placeholder = "materia / grupo"; // Solo materia/grupo

    cell.textContent = "";
    cell.appendChild(input);
    input.focus();

    const finalizarEdicion = () => {
      const nuevoValor = input.value.trim();
      cell.textContent = nuevoValor;
      cell.classList.remove("editando", "p-0");

      // Parsear el formato: materia / grupo
      const partes = nuevoValor.split("/").map((s) => s.trim());
      const materia = partes[0] || "";
      const grupo = partes[1] || "";

      if (materia) {
        cell.setAttribute("data-materia", materia);
        cell.setAttribute("data-grupo", grupo);
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

  // 3. Función para guardar horarios (solo para admin) - CORREGIDA
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
            // Parsear el formato: materia / grupo
            const partes = contenido.split("/").map((s) => s.trim());
            const materia = partes[0] || "";
            const grupo = partes[1] || "";

            horarios.push({
              hora,
              dia,
              materia: materia,
              // Siempre vacío ahora
              grupo: grupo,
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
        const errorText = await response.text();
        console.error("Error del servidor:", errorText);
        throw new Error(
          `Error ${response.status}: ${response.statusText} - ${errorText}`
        );
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
  // 4. Función para agregar nueva fila (solo para admin) - ACTUALIZADA
  const agregarFila = () => {
    if (userRole === "user") {
      alert("No tienes permisos para agregar filas");
      return;
    }

    // Obtener todas las filas existentes
    const rows = horarioBody.querySelectorAll("tr");
    let nuevaHora = "07:00-07:50"; // Hora por defecto si no hay filas

    if (rows.length > 0) {
      // Obtener la última fila
      const ultimaFila = rows[rows.length - 1];
      const ultimaHoraCell = ultimaFila.querySelector("td.hora-cell");

      if (ultimaHoraCell) {
        const ultimoHorario = ultimaHoraCell.textContent.trim();

        if (ultimoHorario && ultimoHorario.includes("-")) {
          try {
            // Extraer la hora de fin del último horario
            const partes = ultimoHorario.split("-");
            const horaInicioAnterior = partes[0].trim();
            const horaFinAnterior = partes[1].trim();

            // Convertir la hora final a minutos desde medianoche
            const [horasFin, minutosFin] = horaFinAnterior
              .split(":")
              .map(Number);
            const totalMinutosFin = horasFin * 60 + minutosFin;

            // Sumar 50 minutos a la hora final
            const nuevaHoraFinMinutos = totalMinutosFin + 50;

            // Calcular nueva hora de fin
            const nuevaHoraFin = minutosATiempo(nuevaHoraFinMinutos);

            // Mantener la misma hora de inicio que la última fila
            nuevaHora = `${horaInicioAnterior}-${nuevaHoraFin}`;
          } catch (error) {
            console.error("Error al calcular nueva hora:", error);
            // En caso de error, usar la hora por defecto
          }
        }
      }
    }

    const row = document.createElement("tr");

    // Celda de hora (editable)
    const horaCell = document.createElement("td");
    horaCell.textContent = nuevaHora;
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

    // Hacer scroll hasta la nueva fila
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Función auxiliar para convertir minutos a formato de tiempo (HH:MM)
  function minutosATiempo(minutosTotales) {
    const horas = Math.floor(minutosTotales / 60) % 24; // Asegurar que no pase de 23
    const minutos = minutosTotales % 60;

    // Formatear a 2 dígitos
    const horasStr = horas.toString().padStart(2, "0");
    const minutosStr = minutos.toString().padStart(2, "0");

    return `${horasStr}:${minutosStr}`;
  }

  // Event listeners para admin
  if (userRole === "admin") {
    saveButton.addEventListener("click", guardarHorario);
    addRowButton.addEventListener("click", agregarFila);
  }

  // Cargar horarios al iniciar
  cargarHorarios();
}
