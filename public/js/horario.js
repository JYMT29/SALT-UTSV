document.addEventListener("DOMContentLoaded", () => {
  // Obtener laboratorio de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const laboratorio = urlParams.get("lab");

  // Obtener el rol del usuario
  const userRole = localStorage.getItem("userRole") || "user";
  const userId = localStorage.getItem("userId") || "anon"; // Identificador del usuario

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
    requestChangeBtn: document.getElementById("requestChangeBtn"),
    requestModal: document.getElementById("requestModal"),
    requestForm: document.getElementById("requestForm"),
    requestMessage: document.getElementById("requestMessage"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    requestListBtn: document.getElementById("requestListBtn"),
    requestListModal: document.getElementById("requestListModal"),
    requestListBody: document.getElementById("requestListBody"),
    closeListModalBtn: document.getElementById("closeListModalBtn"),
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
  const {
    horarioBody,
    saveButton,
    addRowButton,
    ubicacionTitle,
    requestChangeBtn,
    requestModal,
    requestForm,
    requestMessage,
    closeModalBtn,
    requestListBtn,
    requestListModal,
    requestListBody,
    closeListModalBtn,
  } = elements;

  // Mostrar la ubicación del laboratorio
  ubicacionTitle.textContent = `Laboratorio ${laboratorio.toUpperCase()}`;

  // Configurar visibilidad según el rol
  if (userRole === "user") {
    saveButton.style.display = "none";
    addRowButton.style.display = "none";
    requestChangeBtn.style.display = "block";
    requestListBtn.style.display = "none";
  } else {
    saveButton.style.display = "block";
    addRowButton.style.display = "block";
    requestChangeBtn.style.display = "none";
    requestListBtn.style.display = "block";
    requestListBtn.addEventListener("click", () => {
      requestListModal.style.display = "block";
      cargarSolicitudes(); // Ahora la función está definida
    });
  }

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
        `http://localhost:3001/api/horarios?lab=${laboratorio}`
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

  // Función para cargar y mostrar solicitudes (para administradores)
  const cargarSolicitudes = async () => {
    try {
      elements.requestListBody.innerHTML =
        '<tr><td colspan="5" class="text-center">Cargando solicitudes...</td></tr>';

      const response = await fetch("http://localhost:3001/api/solicitudes");

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.solicitudes || data.solicitudes.length === 0) {
        elements.requestListBody.innerHTML =
          '<tr><td colspan="5" class="text-center">No hay solicitudes pendientes</td></tr>';
        return;
      }

      elements.requestListBody.innerHTML = "";
      data.solicitudes.forEach((solicitud) => {
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${solicitud.laboratorio}</td>
        <td>${new Date(solicitud.fecha).toLocaleString()}</td>
        <td>${solicitud.usuarioId}</td>
        <td>${solicitud.motivo}</td>
        <td>
          <select class="form-control estado-select" data-id="${solicitud.id}">
            <option value="pendiente" ${
              solicitud.estado === "pendiente" ? "selected" : ""
            }>Pendiente</option>
            <option value="aprobado" ${
              solicitud.estado === "aprobado" ? "selected" : ""
            }>Aprobado</option>
            <option value="rechazado" ${
              solicitud.estado === "rechazado" ? "selected" : ""
            }>Rechazado</option>
          </select>
        </td>
      `;

        elements.requestListBody.appendChild(row);
      });

      // Agregar event listeners a los selects de estado
      document.querySelectorAll(".estado-select").forEach((select) => {
        select.addEventListener("change", async (e) => {
          try {
            const response = await fetch(
              `http://localhost:3001/api/solicitudes/${e.target.dataset.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  estado: e.target.value,
                }),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Error ${response.status}: ${response.statusText}`
              );
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.message || "Error al actualizar estado");
            }

            alert("Estado actualizado correctamente");
          } catch (error) {
            console.error("Error al actualizar estado:", error);
            alert(`Error al actualizar estado: ${error.message}`);
          }
        });
      });
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
      elements.requestListBody.innerHTML = `<tr><td colspan="5" class="text-center">Error al cargar solicitudes: ${error.message}</td></tr>`;
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
        `http://localhost:3001/api/horarios?lab=${laboratorio}`,
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

  // ... (código anterior se mantiene igual hasta la función solicitarCambioHorario)

  // 5. Función para solicitar cambio de horario (para usuarios)
  const solicitarCambioHorario = async (event) => {
    event.preventDefault();

    // Obtener valores del formulario
    const dia = document.getElementById("requestDay").value;
    const horaActual = document
      .getElementById("currentSchedule")
      .value.split("-")[0]
      .trim(); // Toma solo la hora de inicio
    const horaNueva = document
      .getElementById("newSchedule")
      .value.split("-")[0]
      .trim(); // Toma solo la hora de inicio
    const motivo = document.getElementById("requestMessage").value.trim();

    if (!dia || !horaActual || !horaNueva || !motivo) {
      alert("Por favor complete todos los campos");
      return;
    }

    const requestData = {
      laboratorio,
      usuarioId: userId,
      dia,
      hora_actual: horaActual, // Ahora en formato "HH:MM"
      hora_nueva: horaNueva, // Ahora en formato "HH:MM"
      motivo,
      estado: "pendiente",
    };

    console.log("Datos a enviar:", requestData);

    try {
      const response = await fetch("http://localhost:3001/api/solicitudes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({}));
        throw new Error(
          `Error ${response.status}: ${response.statusText}. ${
            errorDetails.message || ""
          }`
        );
      }

      const result = await response.json();
      alert("Solicitud enviada correctamente");
      elements.requestForm.reset();
      elements.requestModal.style.display = "none";
    } catch (error) {
      console.error("Error completo:", {
        error: error.message,
        requestData,
        stack: error.stack,
      });
      alert(`Error al enviar: ${error.message}`);
    }
  };
  // Función para notificar al administrador
  const notificarAdministrador = async (data) => {
    try {
      const response = await fetch("http://localhost:3001/api/notificaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "solicitud_cambio",
          mensaje: `Nueva solicitud de cambio en ${data.laboratorio}`,
          datos: data,
          leido: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al notificar:", error);
      // Puedes agregar aquí un fallback como enviar un email o registrar en un log
    }
  };

  // Función para cargar horarios en el modal de solicitud
  const cargarHorariosParaSolicitud = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/horarios?lab=${laboratorio}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.horarios) {
        throw new Error("No se pudieron cargar los horarios para la solicitud");
      }

      return data.horarios;
    } catch (error) {
      console.error("Error al cargar horarios para solicitud:", error);
      return [];
    }
  };

  // Evento para abrir el modal de solicitud
  requestChangeBtn.addEventListener("click", async () => {
    requestModal.style.display = "block";

    // Cargar y mostrar los horarios actuales
    const horarios = await cargarHorariosParaSolicitud();

    // Llenar el select de días
    const daySelect = document.getElementById("requestDay");
    daySelect.innerHTML = DIAS_SEMANA.map(
      (dia) =>
        `<option value="${dia
          .toLowerCase()
          .replace("miércoles", "miercoles")
          .replace("sábado", "sabado")}">${
          dia.charAt(0).toUpperCase() + dia.slice(1)
        }</option>`
    ).join("");

    // Actualizar horarios cuando se selecciona un día
    // En la función que llena los selects de horarios:
    daySelect.addEventListener("change", async (e) => {
      const diaSeleccionado = e.target.value;
      const horasDia = horarios
        .filter((h) => h.dia.toLowerCase() === diaSeleccionado)
        .map((h) => h.hora); // ["07:00-07:50", "08:00-08:50", ...]

      const currentScheduleSelect = document.getElementById("currentSchedule");
      currentScheduleSelect.innerHTML = horasDia
        .map((hora) => `<option value="${hora}">${hora}</option>`)
        .join("");

      const newScheduleSelect = document.getElementById("newSchedule");
      newScheduleSelect.innerHTML = horasDia
        .map((hora) => `<option value="${hora}">${hora}</option>`)
        .join("");
    });

    // Disparar el evento change para cargar inicialmente
    if (daySelect.value) {
      daySelect.dispatchEvent(new Event("change"));
    }
  });

  // ... (el resto del código se mantiene igual)
  // Event listeners
  if (userRole !== "user") {
    saveButton.addEventListener("click", guardarHorario);
    addRowButton.addEventListener("click", agregarFila);
    requestListBtn.addEventListener("click", () => {
      requestListModal.style.display = "block";
      cargarSolicitudes();
    });
  } else {
    requestChangeBtn.addEventListener("click", () => {
      requestModal.style.display = "block";
    });
  }

  // Event listeners para modales
  closeModalBtn.addEventListener("click", () => {
    requestModal.style.display = "none";
  });

  closeListModalBtn.addEventListener("click", () => {
    requestListModal.style.display = "none";
  });

  // Cerrar modales al hacer clic fuera de ellos
  window.addEventListener("click", (event) => {
    if (event.target === requestModal) {
      requestModal.style.display = "none";
    }
    if (event.target === requestListModal) {
      requestListModal.style.display = "none";
    }
  });

  // Formulario de solicitud
  requestForm.addEventListener("submit", solicitarCambioHorario);

  // Cargar horarios al iniciar
  cargarHorarios();
});
