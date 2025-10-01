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

  // Variables específicas del escáner
  let inputBuffer = "";
  let inputTimeout = null;
  let datosParciales = {};
  let timeoutRegistro = null;
  let escaneoActivo = false;

  // Inicializar la interfaz
  async function init() {
    await loadGrupos();
    loadStudents();
    setupEventListeners();
    renderGroupCards();
    updateCurrentGroupDisplay();
    setupScanner();
    updateFechaGeneracion();
  }

  function updateFechaGeneracion() {
    const fechaElement = document.getElementById("fecha-generacion");
    if (fechaElement) {
      const ahora = new Date();
      fechaElement.textContent = ahora.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  // Configurar el escáner físico
  function setupScanner() {
    scannerContainer.addEventListener("click", () => {
      scannerInput.focus();
    });

    scannerInput.addEventListener("focus", () => {
      console.log("Escáner listo para recibir datos...");
    });

    console.log("Escáner físico configurado. Listo para recibir datos.");
  }

  // FUNCIONES DEL ESCÁNER
  function destacarBotonRegistro() {
    const btn = document.getElementById("registrar-btn");
    if (btn) {
      btn.classList.add("btn-pulse");
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

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

  function actualizarFormulario(datos) {
    if (matriculaInput) matriculaInput.value = datos.matricula || "";
    if (nombreInput) nombreInput.value = datos.nombre || "";
    if (carreraNombreInput) carreraNombreInput.value = datos.carrera || "";
    if (selectedGroup) {
      grupoInput.value = selectedGroup;
    }
  }

  function validarDatosCompletos(datos) {
    const camposRequeridos = ["matricula", "nombre", "carrera"];
    return camposRequeridos.every(
      (campo) => datos[campo] && datos[campo].trim() !== ""
    );
  }

  function obtenerCamposFaltantes(datos) {
    const requeridos = ["matricula", "nombre", "carrera"];
    return requeridos.filter(
      (campo) => !datos[campo] || datos[campo].trim() === ""
    );
  }

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
    document.addEventListener("keypress", handleQRInput);

    registrarBtn.addEventListener("click", () => {
      if (currentStudentData) {
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
      const response = await fetch(`${API_BASE_URL}/estudiantes`);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
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

          if (gruposDeEstudiantes.length > 0) {
            grupos = gruposDeEstudiantes.sort();
            localStorage.setItem("grupos", JSON.stringify(grupos));
            console.log("Grupos cargados desde la base de datos:", grupos);
            return;
          }
        }
      }

      const savedGrupos = localStorage.getItem("grupos");
      if (savedGrupos) {
        grupos = JSON.parse(savedGrupos);
        console.log("Grupos cargados desde localStorage:", grupos);
      } else {
        grupos = ["701", "702", "703", "801", "802", "803"];
        localStorage.setItem("grupos", JSON.stringify(grupos));
        console.log("Grupos por defecto cargados:", grupos);
      }
    } catch (error) {
      console.error("Error cargando grupos:", error);
      const savedGrupos = localStorage.getItem("grupos");
      grupos = savedGrupos
        ? JSON.parse(savedGrupos)
        : ["701", "702", "703", "801", "802", "803"];
      console.log("Usando grupos de respaldo por error:", grupos);
    }
  }

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
    modal.className = "modal fade";
    modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle me-2"></i>Eliminar Grupo
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>¿Estás seguro de que quieres eliminar el grupo <strong>"${grupo}"</strong>?</p>
                        <p class="text-muted"><small>Esta acción afectará a los estudiantes asignados a este grupo.</small></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirm-delete">Eliminar</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    document.getElementById("confirm-delete").onclick = () => {
      modalInstance.hide();
      deleteGroup(grupo);
    };

    modal.addEventListener("hidden.bs.modal", () => {
      document.body.removeChild(modal);
    });
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
    modal.className = "modal fade";
    modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-broom me-2"></i>Limpiar Grupos Duplicados
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Se encontraron <strong>${
                          duplicados.length
                        }</strong> grupos duplicados:</p>
                        <div class="bg-light p-3 rounded" style="max-height: 150px; overflow-y: auto;">
                            ${duplicados
                              .map((grupo) => `<div>• ${grupo}</div>`)
                              .join("")}
                        </div>
                        <p class="mt-3">¿Quieres eliminarlos automáticamente?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="confirm-cleanup">Limpiar</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    document.getElementById("confirm-cleanup").onclick = () => {
      modalInstance.hide();
      grupos.length = 0;
      grupos.push(...gruposUnicos);
      saveGrupos();
      renderGroupCards();
      showAlert(
        `✅ Se eliminaron ${duplicados.length} grupos duplicados`,
        "success"
      );
    };

    modal.addEventListener("hidden.bs.modal", () => {
      document.body.removeChild(modal);
    });
  }

  // Gestión de grupos
  function showGroupsManagement() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-cog me-2"></i>Gestión Avanzada de Grupos
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-4">Opciones de gestión para todos los grupos:</p>
                        <div class="d-flex flex-column gap-3">
                            <button class="btn btn-success btn-lg py-3" id="merge-groups-btn">
                                <i class="fas fa-object-group me-2"></i> Unificar Grupos Similares
                            </button>
                            <button class="btn btn-warning btn-lg py-3" id="export-groups-btn">
                                <i class="fas fa-file-export me-2"></i> Exportar Lista de Grupos
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener("hidden.bs.modal", () => {
      document.body.removeChild(modal);
    });
  }

  // FUNCIONES DEL FILTRO CORREGIDAS
  function toggleFilter() {
    if (filteredGroup) {
      if (
        confirm(
          `¿Quieres remover el filtro actual (${getFilterDisplayName(
            filteredGroup
          )})?`
        )
      ) {
        clearFilter();
      }
    } else {
      showFilterModal();
    }
  }

  function showFilterModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-filter me-2"></i>Filtrar por Grupo
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-4">Selecciona el grupo que deseas visualizar en la tabla de estudiantes:</p>
                        
                        <div class="filter-options-container" style="max-height: 400px; overflow-y: auto;">
                            ${getFilterOptionsHTML()}
                        </div>
                        
                        <div class="mt-4 p-3 bg-light rounded">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                Se mostrarán solo los estudiantes del grupo seleccionado. Puedes cambiar el filtro en cualquier momento.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-outline-primary" id="clear-filter-btn">
                            <i class="fas fa-broom me-1"></i>Limpiar Filtro
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Agregar event listeners a las opciones de filtro
    const options = modal.querySelectorAll(".filter-option");
    options.forEach((option) => {
      option.addEventListener("click", () => {
        const selectedValue = option.getAttribute("data-value");
        applyFilter(selectedValue);
        modalInstance.hide();
      });
    });

    // Botón para limpiar filtro
    document
      .getElementById("clear-filter-btn")
      .addEventListener("click", () => {
        clearFilter();
        modalInstance.hide();
      });

    modal.addEventListener("hidden.bs.modal", () => {
      document.body.removeChild(modal);
    });
  }

  function getFilterOptionsHTML() {
    const opcionesGrupos = [
      {
        valor: "todos",
        texto: "Todos los estudiantes",
        icono: "fas fa-users",
        descripcion: "Mostrar todos los estudiantes registrados",
      },
      {
        valor: "sin-grupo",
        texto: "Sin grupo asignado",
        icono: "fas fa-question-circle",
        descripcion: "Estudiantes que no tienen grupo asignado",
      },
      ...grupos.map((grupo) => ({
        valor: grupo,
        texto: `Grupo ${grupo}`,
        icono: "fas fa-user-friends",
        descripcion: `Estudiantes del grupo ${grupo}`,
      })),
    ];

    return opcionesGrupos
      .map(
        (opcion) => `
            <div class="filter-option card mb-3 border-0 shadow-sm" 
                 data-value="${opcion.valor}" 
                 style="cursor: pointer; transition: all 0.3s ease;">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0 me-3">
                            <i class="${opcion.icono} fa-2x text-primary"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-1 fw-bold">${opcion.texto}</h6>
                            <p class="card-text text-muted small mb-0">${opcion.descripcion}</p>
                        </div>
                        <div class="flex-shrink-0">
                            <i class="fas fa-chevron-right text-muted"></i>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  function applyFilter(grupoFiltro) {
    filteredGroup = grupoFiltro;

    const filterInfo = getFilterDisplayInfo(grupoFiltro);
    filterGroupBtn.innerHTML = `<i class="${filterInfo.icono}"></i> ${filterInfo.texto}`;
    filterGroupBtn.classList.remove("btn-warning-custom");
    filterGroupBtn.classList.add("btn-primary", "filter-active");

    loadStudents();
    showAlert(`Filtrando: ${filterInfo.texto}`, "success");
  }

  function clearFilter() {
    filteredGroup = "";
    filterGroupBtn.innerHTML =
      '<i class="fas fa-filter"></i> Filtrar por Grupo';
    filterGroupBtn.classList.remove("btn-primary", "filter-active");
    filterGroupBtn.classList.add("btn-warning-custom");
    loadStudents();
    showAlert("Filtro removido", "info");
  }

  function getFilterDisplayInfo(filtro) {
    switch (filtro) {
      case "todos":
        return { texto: "Todos", icono: "fas fa-users" };
      case "sin-grupo":
        return { texto: "Sin grupo", icono: "fas fa-question" };
      default:
        return { texto: `Grupo ${filtro}`, icono: "fas fa-user-friends" };
    }
  }

  function getFilterDisplayName(filtro) {
    return getFilterDisplayInfo(filtro).texto;
  }

  // Función para exportar a JSON
  function exportToJSON() {
    try {
      const rows = studentsTableBody.querySelectorAll("tr");
      const students = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (
          cells.length >= 4 &&
          cells[0].textContent !== "No hay alumnos registrados"
        ) {
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
  async function loadStudents() {
    try {
      let url = `${API_BASE_URL}/estudiantes`;

      if (filteredGroup && filteredGroup !== "todos") {
        if (filteredGroup === "sin-grupo") {
          url += `?sin_grupo=true`;
        } else {
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

        studentsTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-5">
                            <div class="empty-state">
                                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                                <p class="text-muted">${mensaje}</p>
                            </div>
                        </td>
                    </tr>
                `;
        document.getElementById("total-registros").textContent = "0";
        return;
      }

      data.data.forEach((student) => addStudentToTable(student));
      document.getElementById("total-registros").textContent = data.count;

      showResultCount(data.count, filteredGroup);
    } catch (error) {
      showAlert(`Error al cargar estudiantes: ${error.message}`, "danger");
    }
  }

  function addStudentToTable(student) {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${student.matricula}</td>
            <td>${student.nombre}</td>
            <td>${student.carrera || ""}</td>
            <td>${
              student.grupo || '<span class="text-muted">Sin grupo</span>'
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
    console.log(mensaje);
  }

  // Función para registrar estudiante
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
        loadStudents();
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
