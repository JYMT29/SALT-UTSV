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
      cargarSolicitudes();
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

  // Función para formatear el texto de la celda (materia,maestro,grupo)
  const formatearTextoCelda = (materia, maestro, grupo) => {
    const partes = [];
    if (materia) partes.push(materia.trim());
    if (maestro) partes.push(maestro.trim());
    if (grupo) partes.push(`Grupo: ${grupo.trim()}`);
    return partes.join(", ");
  };

  // Función para parsear el texto de la celda (materia,maestro,grupo)
  const parsearTextoCelda = (texto) => {
    const partes = texto.split(",").map((parte) => parte.trim());
    let materia = "";
    let maestro = "";
    let grupo = "";

    if (partes.length >= 1) materia = partes[0];
    if (partes.length >= 2) maestro = partes[1];
    if (partes.length >= 3) {
      // Extraer grupo (puede venir como "Grupo: X" o simplemente "X")
      const grupoParte = partes[2];
      grupo = grupoParte.replace(/^grupo:\s*/i, "");
    }

    return { materia, maestro, grupo };
  };

  // Función para transformar el formato al esperado por el backend
  const transformarHorarios = (horarios) => {
    return horarios.map((horario) => {
      const [hora_inicio, hora_fin] = horario.hora
        .split("-")
        .map((h) => h.trim());

      const { materia, maestro, grupo } = parsearTextoCelda(
        horario.contenido || ""
      );

      return {
        hora_inicio: hora_inicio.length === 4 ? `0${hora_inicio}` : hora_inicio,
        hora_fin: hora_fin.length === 4 ? `0${hora_fin}` : hora_fin,
        materia: materia || "",
        maestro: maestro || "",
        grupo: grupo || "",
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
        const grupo = item.grupo || "";

        if (DIAS_NORMALIZADOS.includes(dia) && horariosPorHora[hora]) {
          horariosPorHora[hora][dia] = formatearTextoCelda(
            materia,
            maestro,
            grupo
          );
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

      const response = await fetch(
        "https://salt-utsv-production.up.railway.app/api/solicitudes"
      );

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
              `https://salt-utsv-production.up.railway.app/api/solicitudes/${e.target.dataset.id}`,
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
    input.placeholder = "materia, maestro, grupo";

    cell.textContent = "";
    cell.appendChild(input);
    input.focus();

    const finalizarEdicion = () => {
      const nuevoValor = input.value.trim();
      cell.textContent = nuevoValor;
      cell.classList.remove("editando", "p-0");

      // Guardar los datos parseados en atributos data
      const { materia, maestro, grupo } = parsearTextoCelda(nuevoValor);
      cell.setAttribute("data-materia", materia);
      cell.setAttribute("data-maestro", maestro);
      cell.setAttribute("data-grupo", grupo);
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
            horarios.push({
              hora,
              dia,
              contenido: contenido, // Guardamos el contenido completo para parsearlo después
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

  // 5. Función para solicitar cambio de horario (para usuarios)
  const solicitarCambioHorario = async (event) => {
    event.preventDefault();

    // Obtener valores del formulario
    const dia = document.getElementById("requestDay").value;
    const horaActual = document
      .getElementById("currentSchedule")
      .value.split("-")[0]
      .trim();
    const horaNueva = document
      .getElementById("newSchedule")
      .value.split("-")[0]
      .trim();
    const motivo = document.getElementById("requestMessage").value.trim();

    if (!dia || !horaActual || !horaNueva || !motivo) {
      alert("Por favor complete todos los campos");
      return;
    }

    const requestData = {
      laboratorio,
      usuarioId: userId,
      dia,
      hora_actual: horaActual,
      hora_nueva: horaNueva,
      motivo,
      estado: "pendiente",
    };

    console.log("Datos a enviar:", requestData);

    try {
      const response = await fetch(
        "https://salt-utsv-production.up.railway.app/api/solicitudes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

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

  // Función para cargar horarios en el modal de solicitud
  const cargarHorariosParaSolicitud = async () => {
    try {
      const response = await fetch(
        `https://salt-utsv-production.up.railway.app/api/horarios?lab=${laboratorio}`
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
    daySelect.addEventListener("change", async (e) => {
      const diaSeleccionado = e.target.value;
      const horasDia = horarios
        .filter((h) => h.dia.toLowerCase() === diaSeleccionado)
        .map((h) => h.hora);

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
