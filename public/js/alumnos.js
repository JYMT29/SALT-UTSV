// URL base de tu backend
const API_BASE_URL = "https://salt-utsv-production.up.railway.app/api";

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const qrResult = document.getElementById("qr-result");
  const registrarBtn = document.getElementById("registrar-btn");
  const exportBtn = document.getElementById("export-btn");
  const filterGroupBtn = document.getElementById("filter-group-btn");
  const matriculaInput = document.getElementById("matricula");
  const nombreInput = document.getElementById("nombre");
  const carreraNombreInput = document.getElementById("carrera-nombre");
  const grupoInput = document.getElementById("grupo");
  const studentsTableBody = document.getElementById("students-table-body");
  const groupsGrid = document.getElementById("groups-grid");
  const customGroupInput = document.getElementById("custom-group");
  const addGroupBtn = document.getElementById("add-group-btn");
  const currentGroupValue = document.getElementById("current-group-value");
  const editGroupBtn = document.getElementById("edit-group-btn");
  const clearGroupBtn = document.getElementById("clear-group-btn");
  const cleanupBtn = document.getElementById("cleanup-btn");
  const manageGroupsBtn = document.getElementById("manage-groups-btn");
  const scannerInput = document.getElementById("scanner-input");
  const scannerContainer = document.querySelector(".scanner-container");

  // Variables de estado
  let currentStudentData = null;
  let selectedGroup = "";
  let grupos = ["701", "702", "703", "801", "802", "803"];
  let filteredGroup = "";

  // Variables específicas del escáner (de tu código que funciona)
  let inputBuffer = "";
  let inputTimeout = null;
  let datosParciales = {};
  let timeoutRegistro = null;
  let escaneoActivo = false;

  // Inicializar la interfaz
  async function init() {
    // ← Agregar async aquí
    await loadGrupos();
    loadStudents();
    setupEventListeners();
    renderGroupCards();
    updateCurrentGroupDisplay();
    setupScanner();
  }

  // Configurar el escáner físico (USANDO TU CÓDIGO QUE FUNCIONA)
  function setupScanner() {
    // Hacer que el área del escáner sea clickeable para enfocar el input
    scannerContainer.addEventListener("click", () => {
      scannerInput.focus();
    });

    // Configurar el campo de escáner
    scannerInput.addEventListener("focus", () => {
      console.log("Escáner listo para recibir datos...");
    });

    console.log("Escáner físico configurado. Listo para recibir datos.");
  }

  // FUNCIONES DEL ESCÁNER DE TU CÓDIGO QUE SÍ FUNCIONA
  function destacarBotonRegistro() {
    const btn = document.getElementById("registrar-btn");
    if (btn) {
      btn.classList.add("btn-pulse");
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Función para procesar el código QR (DE TU CÓDIGO)
  function processQRCode(qrData) {
    try {
      console.log("Datos QR recibidos:", qrData);

      if (qrData.includes(" Ñ ") || qrData.includes("Ñ")) {
        const separador = qrData.includes(" Ñ ") ? " Ñ " : "Ñ";
        const partes = qrData.split(separador);

        if (partes.length === 2) {
          const campo = partes[0].trim();
          const valor = partes[1].trim();

          const camposEstandar = {
            Nombre: "nombre",
            Carrera: "carrera",
            "Tipo de Sangre": "tipoSangre",
            "Tel. Tutor": "telefonoTutor",
            Tutor: "tutor",
            Campus: "campus",
          };

          const campoEstandarizado =
            camposEstandar[campo] || campo.toLowerCase();
          return { [campoEstandarizado]: valor };
        }
      }

      if (/^\d{8,10}$/.test(qrData.trim())) {
        return { matricula: qrData.trim() };
      }

      if (qrData.includes("NombreÑ") && qrData.includes("CarreraÑ")) {
        const datos = {};
        const partes = qrData.split("Ñ");

        const matriculaMatch = qrData.match(/^(\d{8,10})/);
        if (matriculaMatch) datos.matricula = matriculaMatch[1];

        for (let i = 0; i < partes.length; i++) {
          if (partes[i].includes("Nombre") && partes[i + 1]) {
            datos.nombre = partes[i + 1].trim();
          }
          if (partes[i].includes("Carrera") && partes[i + 1]) {
            datos.carrera = partes[i + 1].trim();
          }
          if (partes[i].includes("Campus") && partes[i + 1]) {
            datos.campus = partes[i + 1].trim();
          }
        }

        if (!datos.matricula)
          throw new Error("Falta matrícula en formato consolidado");
        if (!datos.nombre)
          throw new Error("Falta nombre en formato consolidado");

        return datos;
      }

      const formatoLegacy = qrData
        .replace(/TADEOTSU/g, "TADEO TSU")
        .replace(/^(\d{8})/, "$1 ")
        .replace(/\s+/g, " ")
        .replace(/\s*'\s*/, "' ")
        .trim();

      const regexLegacy =
        /^(\d{8})\s(.+?)(?:\s(TSU\sTECNOLOGIAS\sDE\sLA\sINFORMACION\s'?\sDSM))?$/i;
      const matchLegacy = formatoLegacy.match(regexLegacy);

      if (matchLegacy) {
        return {
          matricula: matchLegacy[1],
          nombre: matchLegacy[2].trim(),
          carrera: matchLegacy[3] || "TSU TECNOLOGIAS DE LA INFORMACION ' DSM",
        };
      }

      throw new Error("Formato no reconocido");
    } catch (error) {
      console.error("Error procesando QR:", error);
      throw new Error(`Error: ${error.message}\n\nDatos recibidos: ${qrData}`);
    }
  }

  // Función para actualizar el formulario
  function actualizarFormulario(datos) {
    if (matriculaInput) matriculaInput.value = datos.matricula || "";
    if (nombreInput) nombreInput.value = datos.nombre || "";
    if (carreraNombreInput) carreraNombreInput.value = datos.carrera || "";
    // Agregar el grupo seleccionado si existe
    if (selectedGroup) {
      grupoInput.value = selectedGroup;
    }
  }

  // Función para validar datos completos
  function validarDatosCompletos(datos) {
    const camposRequeridos = ["matricula", "nombre", "carrera"];
    return camposRequeridos.every(
      (campo) => datos[campo] && datos[campo].trim() !== ""
    );
  }

  // Función para obtener campos faltantes
  function obtenerCamposFaltantes(datos) {
    const requeridos = ["matricula", "nombre", "carrera"];
    return requeridos.filter(
      (campo) => !datos[campo] || datos[campo].trim() === ""
    );
  }

  // Manejar entrada del lector QR físico (DE TU CÓDIGO QUE FUNCIONA)
  function handleQRInput(event) {
    if (escaneoActivo) return;
    if (event.key.length > 1 && event.key !== "Enter") return;

    if (event.key === "Enter") {
      escaneoActivo = true;

      try {
        const datosQR = inputBuffer
          .replace(/[¡¿]/g, "")
          .replace(/([a-zA-Z])(Ñ)/g, "$1 $2")
          .trim();

        const datosProcesados = processQRCode(datosQR);
        Object.assign(datosParciales, datosProcesados);

        actualizarFormulario(datosParciales);

        if (validarDatosCompletos(datosParciales)) {
          currentStudentData = { ...datosParciales };
          // Agregar el grupo seleccionado al objeto de datos
          if (selectedGroup) {
            currentStudentData.grupo = selectedGroup;
          }
          showAlert(
            "¡Estudiante completo! Revise los datos y haga clic en Registrar",
            "success"
          );
          destacarBotonRegistro();
          clearTimeout(timeoutRegistro);
        } else {
          const faltantes = obtenerCamposFaltantes(datosParciales);
          showAlert(
            `Faltan campos: ${faltantes.join(", ")}. Escanee el siguiente QR`,
            "warning"
          );
        }
      } catch (error) {
        console.error("Error:", error);
        showAlert(error.message.split("\n")[0], "danger");
      } finally {
        inputBuffer = "";
        escaneoActivo = false;
        clearTimeout(inputTimeout);
      }
    } else {
      inputBuffer += event.key;
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(() => {
        inputBuffer = "";
        escaneoActivo = false;
      }, 200);
    }
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Event listener del escáner (tu código que funciona)
    document.addEventListener("keypress", handleQRInput);

    registrarBtn.addEventListener("click", () => {
      if (currentStudentData) {
        // Asegurarse de que el grupo seleccionado se incluya
        if (selectedGroup) {
          currentStudentData.grupo = selectedGroup;
        }
        registerStudent(currentStudentData);
        currentStudentData = null;
        datosParciales = {};
        resetForm();
        const btn = document.getElementById("registrar-btn");
        if (btn) btn.classList.remove("btn-pulse");
      } else {
        showAlert("No hay datos para registrar.", "danger");
      }
    });

    exportBtn.addEventListener("click", exportToJSON);
    filterGroupBtn.addEventListener("click", toggleFilter);
    addGroupBtn.addEventListener("click", addNewGroup);
    editGroupBtn.addEventListener("click", () => {
      if (!selectedGroup)
        return showAlert("Primero selecciona un grupo", "warning");
      editGroup(selectedGroup);
    });
    clearGroupBtn.addEventListener("click", clearGroupSelection);
    cleanupBtn.addEventListener("click", limpiarGruposDuplicados);
    manageGroupsBtn.addEventListener("click", showGroupsManagement);

    customGroupInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addNewGroup();
    });
  }

  // Cargar grupos desde los estudiantes existentes
  async function loadGrupos() {
    try {
      // 1. Primero intentar cargar grupos desde los estudiantes en la base de datos
      const response = await fetch(`${API_BASE_URL}/estudiantes`);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          // Extraer todos los grupos únicos de los estudiantes
          const gruposDeEstudiantes = [
            ...new Set(
              data.data
                .map((student) => student.grupo)
                .filter(
                  (grupo) =>
                    grupo && grupo.trim() !== "" && grupo !== "Sin grupo"
                )
            ),
          ];

          // 2. Si encontramos grupos en la base de datos, usarlos
          if (gruposDeEstudiantes.length > 0) {
            grupos = gruposDeEstudiantes.sort();
            // Actualizar el localStorage con los grupos del servidor
            localStorage.setItem("grupos", JSON.stringify(grupos));
            console.log("Grupos cargados desde la base de datos:", grupos);
            return;
          }
        }
      }

      // 3. Si no hay grupos en la BD, usar localStorage como respaldo
      const savedGrupos = localStorage.getItem("grupos");
      if (savedGrupos) {
        grupos = JSON.parse(savedGrupos);
        console.log("Grupos cargados desde localStorage:", grupos);
      } else {
        // 4. Si no hay nada, usar grupos por defecto
        grupos = ["701", "702", "703", "801", "802", "803"];
        localStorage.setItem("grupos", JSON.stringify(grupos));
        console.log("Grupos por defecto cargados:", grupos);
      }
    } catch (error) {
      console.error("Error cargando grupos:", error);

      // En caso de error, usar localStorage o grupos por defecto
      const savedGrupos = localStorage.getItem("grupos");
      grupos = savedGrupos
        ? JSON.parse(savedGrupos)
        : ["701", "702", "703", "801", "802", "803"];
      console.log("Usando grupos de respaldo por error:", grupos);
    }
  }

  // Eliminar saveGrupos() ya que no podemos guardar grupos separadamente

  // Guardar grupos en localStorage
  function saveGrupos() {
    localStorage.setItem("grupos", JSON.stringify(grupos));
  }

  // Renderizar grupos como tarjetas
  function renderGroupCards() {
    groupsGrid.innerHTML = "";

    const gruposOrdenados = [...grupos].sort((a, b) => a.localeCompare(b));

    if (gruposOrdenados.length === 0) {
      groupsGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                            <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px;"></i>
                            <p>No hay grupos creados</p>
                        </div>
                    `;
      return;
    }

    gruposOrdenados.forEach(async (grupo) => {
      const groupCard = document.createElement("div");
      groupCard.className = `group-card ${
        selectedGroup === grupo ? "active" : ""
      }`;

      const stats = await getGroupStats(grupo);

      groupCard.innerHTML = `
                        <div class="group-card-header">
                            <span class="group-name">${grupo}</span>
                            <div class="group-actions">
                                <button class="group-action-btn group-edit-btn" title="Editar grupo">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="group-action-btn group-delete-btn" title="Eliminar grupo">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="group-stats">
                            <span>${stats} estudiantes</span>
                            <span><i class="fas fa-users"></i></span>
                        </div>
                    `;

      groupCard.addEventListener("click", (e) => {
        if (!e.target.closest(".group-actions")) {
          selectGroup(grupo);
        }
      });

      const editBtn = groupCard.querySelector(".group-edit-btn");
      const deleteBtn = groupCard.querySelector(".group-delete-btn");

      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editGroup(grupo);
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showDeleteConfirmation(grupo);
      });

      groupsGrid.appendChild(groupCard);
    });
  }

  // Obtener estadísticas de un grupo
  async function getGroupStats(grupo) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/estudiantes/grupo/${grupo}`
      );
      const data = await response.json();
      return data.success ? data.count : 0;
    } catch (error) {
      return 0;
    }
  }

  // Seleccionar grupo
  function selectGroup(grupo) {
    selectedGroup = grupo;
    updateCurrentGroupDisplay();
    renderGroupCards();
    showAlert(`Grupo "${grupo}" seleccionado`, "success");

    // Actualizar el grupo en el formulario si hay datos actuales
    if (currentStudentData) {
      currentStudentData.grupo = grupo;
      grupoInput.value = grupo;
    }
  }

  // Actualizar display del grupo actual
  function updateCurrentGroupDisplay() {
    currentGroupValue.textContent = selectedGroup || "Ninguno";
    grupoInput.value = selectedGroup || "";
  }

  // Limpiar selección de grupo
  function clearGroupSelection() {
    selectedGroup = "";
    updateCurrentGroupDisplay();
    renderGroupCards();
    showAlert("Selección de grupo limpiada", "info");
  }

  // Agregar nuevo grupo
  function addNewGroup() {
    const newGroup = customGroupInput.value.trim();

    if (!newGroup) {
      showAlert("Por favor ingresa un nombre para el grupo", "warning");
      return;
    }

    if (newGroup.toLowerCase() === "sin grupo") {
      showAlert('"Sin grupo" es un valor reservado', "warning");
      return;
    }

    const grupoExistente = grupos.find(
      (g) => g.toLowerCase() === newGroup.toLowerCase()
    );

    if (grupoExistente) {
      if (grupoExistente === newGroup) {
        showAlert("Este grupo ya existe", "warning");
        return;
      }

      if (
        confirm(
          `El grupo "${grupoExistente}" ya existe. ¿Quieres unificar "${newGroup}" con "${grupoExistente}"?`
        )
      ) {
        unificarGrupos(grupoExistente, newGroup);
      }
      return;
    }

    grupos.push(newGroup);
    saveGrupos();
    renderGroupCards();
    customGroupInput.value = "";
    showAlert(`Grupo "${newGroup}" agregado`, "success");
  }

  // Unificar grupos
  async function unificarGrupos(grupoMantener, grupoEliminar) {
    try {
      showAlert(
        `Unificando grupos "${grupoEliminar}" en "${grupoMantener}"...`,
        "warning"
      );

      const response = await fetch(`${API_BASE_URL}/estudiantes/grupo/masivo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupo_anterior: grupoEliminar,
          grupo_nuevo: grupoMantener,
        }),
      });

      if (!response.ok) throw new Error("Error al unificar grupos");

      const index = grupos.indexOf(grupoEliminar);
      if (index !== -1) {
        grupos.splice(index, 1);
        saveGrupos();
        renderGroupCards();
      }

      if (selectedGroup === grupoEliminar) {
        selectedGroup = grupoMantener;
        updateCurrentGroupDisplay();
      }

      showAlert(`Grupos unificados correctamente`, "success");
      loadStudents();
    } catch (error) {
      showAlert(`Error al unificar grupos: ${error.message}`, "danger");
    }
  }

  // Editar grupo
  function editGroup(grupo) {
    const newGroupName = prompt("Nuevo nombre del grupo:", grupo);
    if (
      newGroupName &&
      newGroupName.trim() !== "" &&
      newGroupName.trim() !== grupo
    ) {
      updateGroupForAllStudents(grupo, newGroupName.trim());
    }
  }

  // Modal de confirmación para eliminar grupo
  function showDeleteConfirmation(grupo) {
    const modal = document.createElement("div");
    modal.className = "confirmation-modal";
    modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3 class="modal-title">Eliminar Grupo</h3>
                        </div>
                        <div class="modal-body">
                            <p>¿Estás seguro de que quieres eliminar el grupo <strong>"${grupo}"</strong>?</p>
                            <p><small>Esta acción afectará a los estudiantes asignados a este grupo.</small></p>
                        </div>
                        <div class="modal-actions">
                            <button class="modal-btn modal-btn-cancel" id="cancel-delete">Cancelar</button>
                            <button class="modal-btn modal-btn-confirm" id="confirm-delete">Eliminar</button>
                        </div>
                    </div>
                `;

    document.body.appendChild(modal);

    document.getElementById("cancel-delete").onclick = () => {
      document.body.removeChild(modal);
    };

    document.getElementById("confirm-delete").onclick = () => {
      document.body.removeChild(modal);
      deleteGroup(grupo);
    };

    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
  }

  // Eliminar grupo
  async function deleteGroup(groupToDelete) {
    if (!groupToDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/estudiantes/grupo/${groupToDelete}`
      );
      const data = await response.json();

      let nuevoGrupo = "Sin grupo";

      if (data.success && data.count > 0) {
        const opcion = prompt(
          `Hay ${data.count} estudiantes en el grupo "${groupToDelete}". ¿Qué deseas hacer?\n\n1. Dejar como "Sin grupo"\n2. Mover a otro grupo existente\n\nEscribe "1" o "2", o el nombre del nuevo grupo:`,
          "1"
        );

        if (opcion === null) return;

        if (opcion === "2") {
          const grupoDestino = prompt(
            "¿A qué grupo quieres mover los estudiantes?"
          );
          if (grupoDestino && grupoDestino.trim())
            nuevoGrupo = grupoDestino.trim();
          else return showAlert("Operación cancelada", "warning");
        } else if (opcion && opcion.trim() !== "1" && opcion.trim() !== "2") {
          nuevoGrupo = opcion.trim();
        }

        await fetch(`${API_BASE_URL}/estudiantes/grupo/masivo`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grupo_anterior: groupToDelete,
            grupo_nuevo: nuevoGrupo,
          }),
        });
      }

      const index = grupos.indexOf(groupToDelete);
      if (index !== -1) {
        grupos.splice(index, 1);
        saveGrupos();
        renderGroupCards();
      }

      if (selectedGroup === groupToDelete) clearGroupSelection();

      showAlert(
        `Grupo "${groupToDelete}" eliminado. Estudiantes movidos a "${nuevoGrupo}"`,
        "success"
      );
      loadStudents();
    } catch (error) {
      showAlert(`Error al eliminar grupo: ${error.message}`, "danger");
    }
  }

  // Actualizar grupo para todos los estudiantes
  async function updateGroupForAllStudents(oldGroup, newGroup) {
    try {
      showAlert(`Actualizando estudiantes del grupo ${oldGroup}...`, "warning");

      const response = await fetch(`${API_BASE_URL}/estudiantes/grupo/masivo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupo_anterior: oldGroup,
          grupo_nuevo: newGroup,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar grupo");

      const result = await response.json();

      if (result.success) {
        selectedGroup = newGroup;
        updateCurrentGroupDisplay();

        const index = grupos.indexOf(oldGroup);
        if (index !== -1) {
          grupos[index] = newGroup;
          saveGrupos();
          renderGroupCards();
        }

        showAlert(
          `Grupo actualizado: ${result.affected || result.message}`,
          "success"
        );
        loadStudents();
      }
    } catch (error) {
      showAlert(`Error al actualizar grupo: ${error.message}`, "danger");
    }
  }

  // Limpiar duplicados
  function limpiarGruposDuplicados() {
    const gruposUnicos = [];
    const gruposLowerCase = new Set();
    const duplicados = [];

    grupos.forEach((grupo) => {
      const lowerCase = grupo.toLowerCase();
      if (gruposLowerCase.has(lowerCase)) duplicados.push(grupo);
      else {
        gruposLowerCase.add(lowerCase);
        gruposUnicos.push(grupo);
      }
    });

    if (duplicados.length === 0)
      return showAlert("✅ No se encontraron grupos duplicados", "success");

    const modal = document.createElement("div");
    modal.className = "confirmation-modal";
    modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <i class="fas fa-broom"></i>
                            <h3 class="modal-title">Limpiar Grupos Duplicados</h3>
                        </div>
                        <div class="modal-body">
                            <p>Se encontraron <strong>${
                              duplicados.length
                            }</strong> grupos duplicados:</p>
                            <div style="max-height: 150px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
                                ${duplicados
                                  .map((grupo) => `<div>• ${grupo}</div>`)
                                  .join("")}
                            </div>
                            <p>¿Quieres eliminarlos automáticamente?</p>
                        </div>
                        <div class="modal-actions">
                            <button class="modal-btn modal-btn-cancel" id="cancel-cleanup">Cancelar</button>
                            <button class="modal-btn modal-btn-confirm" id="confirm-cleanup">Limpiar</button>
                        </div>
                    </div>
                `;

    document.body.appendChild(modal);

    document.getElementById("cancel-cleanup").onclick = () => {
      document.body.removeChild(modal);
      showAlert("Limpieza cancelada", "info");
    };

    document.getElementById("confirm-cleanup").onclick = () => {
      document.body.removeChild(modal);
      grupos.length = 0;
      grupos.push(...gruposUnicos);
      saveGrupos();
      renderGroupCards();
      showAlert(
        `✅ Se eliminaron ${duplicados.length} grupos duplicados`,
        "success"
      );
    };

    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
  }

  // Gestión de grupos
  function showGroupsManagement() {
    const modal = document.createElement("div");
    modal.className = "confirmation-modal";
    modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <i class="fas fa-cog"></i>
                            <h3 class="modal-title">Gestión Avanzada de Grupos</h3>
                        </div>
                        <div class="modal-body">
                            <p>Opciones de gestión para todos los grupos:</p>
                            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                                <button class="modal-btn" style="background: #28a745; color: white;" id="merge-groups-btn">
                                    <i class="fas fa-object-group"></i> Unificar Grupos Similares
                                </button>
                                <button class="modal-btn" style="background: #c9a227; color: white;" id="export-groups-btn">
                                    <i class="fas fa-file-export"></i> Exportar Lista de Grupos
                                </button>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="modal-btn modal-btn-cancel" id="close-management">Cerrar</button>
                        </div>
                    </div>
                `;

    document.body.appendChild(modal);

    document.getElementById("close-management").onclick = () =>
      document.body.removeChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
  }

  // Función para exportar a JSON
  function exportToJSON() {
    try {
      // Obtener datos de estudiantes
      const rows = studentsTableBody.querySelectorAll("tr");
      const students = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 4) {
          students.push({
            matricula: cells[0].textContent,
            nombre: cells[1].textContent,
            carrera: cells[2].textContent,
            grupo: cells[3].textContent,
          });
        }
      });

      if (students.length === 0) {
        showAlert("No hay datos para exportar", "warning");
        return;
      }

      // Crear y descargar archivo JSON
      const dataStr = JSON.stringify(students, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `alumnos_${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      showAlert("Datos exportados correctamente", "success");
    } catch (error) {
      showAlert(`Error al exportar datos: ${error.message}`, "danger");
    }
  }

  // Cargar estudiantes
  // Cargar estudiantes
  async function loadStudents() {
    try {
      let url = `${API_BASE_URL}/estudiantes`;

      // Manejar diferentes tipos de filtro
      if (filteredGroup && filteredGroup !== "todos") {
        if (filteredGroup === "sin-grupo") {
          // Filtrar estudiantes sin grupo
          url += `?sin_grupo=true`;
        } else {
          // Filtrar por grupo específico
          url += `?grupo=${encodeURIComponent(filteredGroup)}`;
        }
      }

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Error HTTP! estado: ${response.status}`);

      const data = await response.json();
      studentsTableBody.innerHTML = "";

      if (!data.success || data.count === 0) {
        let mensaje = "No hay alumnos registrados";
        if (filteredGroup === "sin-grupo") {
          mensaje = "No hay estudiantes sin grupo asignado";
        } else if (filteredGroup && filteredGroup !== "todos") {
          mensaje = `No hay estudiantes en el grupo "${filteredGroup}"`;
        }

        studentsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">${mensaje}</td></tr>`;
        return;
      }

      data.data.forEach((student) => addStudentToTable(student));

      // Mostrar contador de resultados
      showResultCount(data.count, filteredGroup);
    } catch (error) {
      showAlert(`Error al cargar estudiantes: ${error.message}`, "danger");
    }
  }

  // Mostrar contador de resultados
  function showResultCount(count, filtro) {
    let mensaje = "";
    switch (filtro) {
      case "todos":
        mensaje = `Mostrando todos los estudiantes (${count})`;
        break;
      case "sin-grupo":
        mensaje = `Estudiantes sin grupo asignado (${count})`;
        break;
      default:
        mensaje = `Estudiantes del grupo ${filtro} (${count})`;
    }

    // Puedes mostrar este mensaje en un elemento o en la consola
    console.log(mensaje);
  }
  function addStudentToTable(student) {
    const row = document.createElement("tr");
    row.innerHTML = `
                    <td>${student.matricula}</td>
                    <td>${student.nombre}</td>
                    <td>${student.carrera || ""}</td>
                    <td>${
                      student.grupo ||
                      '<span style="color: #999;">Sin grupo</span>'
                    }</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editStudent('${
                          student.matricula
                        }')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${
                          student.matricula
                        }')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
    studentsTableBody.appendChild(row);
  }

  function toggleFilter() {
    if (filteredGroup) {
      // Si ya hay un filtro activo, removerlo
      filteredGroup = "";
      filterGroupBtn.innerHTML =
        '<i class="fas fa-filter"></i> Filtrar por Grupo';
      filterGroupBtn.classList.remove("btn-primary");
      loadStudents();
      showAlert("Filtro removido", "success");
    } else {
      // Mostrar modal con opciones de grupos disponibles
      showFilterModal();
    }
  }

  // Mostrar modal de filtro con grupos disponibles
  function showFilterModal() {
    const modal = document.createElement("div");
    modal.className = "confirmation-modal";

    // Crear opciones de grupos (incluyendo "Todos" y "Sin grupo")
    const opcionesGrupos = [
      {
        valor: "todos",
        texto: "📋 Todos los estudiantes",
        icono: "fas fa-users",
      },
      {
        valor: "sin-grupo",
        texto: "❓ Sin grupo asignado",
        icono: "fas fa-question",
      },
      ...grupos.map((grupo) => ({
        valor: grupo,
        texto: `👥 Grupo ${grupo}`,
        icono: "fas fa-user-friends",
      })),
    ];

    modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <i class="fas fa-filter"></i>
        <h3 class="modal-title">Filtrar por Grupo</h3>
      </div>
      <div class="modal-body">
        <p>Selecciona el grupo que deseas visualizar:</p>
        <div class="filter-options" style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
          ${opcionesGrupos
            .map(
              (opcion) => `
            <div class="filter-option" data-value="${opcion.valor}" 
                 style="padding: 12px 15px; margin: 8px 0; border: 2px solid #e0e0e0; border-radius: var(--border-radius); 
                        cursor: pointer; transition: all 0.3s ease; background: white;">
              <i class="${opcion.icono}" style="margin-right: 10px; color: var(--university-blue);"></i>
              <span style="font-weight: 500;">${opcion.texto}</span>
            </div>
          `
            )
            .join("")}
        </div>
        <p><small>Se mostrarán solo los estudiantes del grupo seleccionado.</small></p>
      </div>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel" id="cancel-filter">Cancelar</button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    // Agregar estilos para hover y selección
    const options = modal.querySelectorAll(".filter-option");
    options.forEach((option) => {
      option.addEventListener("mouseenter", () => {
        option.style.borderColor = "var(--university-blue)";
        option.style.backgroundColor = "#f0f5ff";
      });

      option.addEventListener("mouseleave", () => {
        option.style.borderColor = "#e0e0e0";
        option.style.backgroundColor = "white";
      });

      option.addEventListener("click", () => {
        const selectedValue = option.getAttribute("data-value");
        applyFilter(selectedValue);
        document.body.removeChild(modal);
      });
    });

    document.getElementById("cancel-filter").onclick = () => {
      document.body.removeChild(modal);
    };

    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
  }

  // Aplicar el filtro seleccionado
  function applyFilter(grupoFiltro) {
    filteredGroup = grupoFiltro;

    // Actualizar texto del botón según la selección
    let textoBoton = "";
    switch (grupoFiltro) {
      case "todos":
        textoBoton = "Todos los estudiantes";
        break;
      case "sin-grupo":
        textoBoton = "Sin grupo";
        break;
      default:
        textoBoton = `Grupo ${grupoFiltro}`;
    }

    filterGroupBtn.innerHTML = `<i class="fas fa-filter"></i> ${textoBoton}`;
    filterGroupBtn.classList.add("btn-primary");

    loadStudents();
    showAlert(`Filtrando: ${textoBoton}`, "success");
  }

  // Función para registrar estudiante (MODIFICADA PARA INCLUIR GRUPO)
  async function registerStudent(studentData) {
    try {
      if (!studentData.matricula || !studentData.nombre) {
        throw new Error("Datos incompletos para registrar");
      }

      const payload = {
        matricula: studentData.matricula,
        nombre: studentData.nombre,
        carrera: studentData.carrera || "",
        grupo: studentData.grupo || selectedGroup || null,
      };

      const response = await fetch(`${API_BASE_URL}/estudiantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error HTTP! estado: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success) {
        loadStudents(); // Recargar la tabla completa
        showAlert("Estudiante registrado con éxito", "success");
        resetForm();
        datosParciales = {};
      } else {
        showAlert(result.error || "Error al registrar estudiante", "danger");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      showAlert(error.message, "danger");
    }
  }

  function showAlert(message, type) {
    qrResult.className = `alert alert-${type}`;
    qrResult.innerHTML = `<i class="fas fa-${
      type === "success" ? "check" : "exclamation"
    }-circle"></i> ${message}`;
    qrResult.style.display = "block";
    setTimeout(() => {
      qrResult.style.display = "none";
    }, 5000);
  }

  function resetForm() {
    matriculaInput.value = "";
    nombreInput.value = "";
    carreraNombreInput.value = "";
    // No resetear el grupo input para mantener la selección
  }

  // Funciones globales
  window.editStudent = async function (matricula) {
    const nuevoGrupo = prompt("Nuevo grupo para el estudiante:");
    if (nuevoGrupo) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/estudiantes/${matricula}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grupo: nuevoGrupo.trim() }),
          }
        );

        if (response.ok) {
          showAlert("Grupo actualizado correctamente", "success");
          loadStudents();
        } else throw new Error("Error al actualizar grupo");
      } catch (error) {
        showAlert(`Error al actualizar grupo: ${error.message}`, "danger");
      }
    }
  };

  window.deleteStudent = async function (matricula) {
    if (confirm("¿Estás seguro de eliminar este estudiante?")) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/estudiantes/${matricula}`,
          { method: "DELETE" }
        );
        if (response.ok) {
          showAlert("Estudiante eliminado correctamente", "success");
          loadStudents();
        } else throw new Error("Error al eliminar estudiante");
      } catch (error) {
        showAlert(`Error al eliminar estudiante: ${error.message}`, "danger");
      }
    }
  };

  // Inicializar la aplicación
  init().catch((error) => {
    console.error("Error inicializando la aplicación:", error);
  });
});
