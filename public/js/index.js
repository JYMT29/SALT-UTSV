// Estilos CSS unificados para el laboratorio
const labStyles = `
  <style>
    /* Estilos generales del laboratorio */
    .lab-theater {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 100%;
      overflow: auto;
      padding: 20px;
      background-color: #f5f7fa;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .lab-screen {
      background: linear-gradient(135deg, #6e8efb, #a777e3);
      color: white;
      text-align: center;
      padding: 15px;
      margin: 0 auto 30px;
      width: 80%;
      border-radius: 5px;
      font-weight: bold;
      font-size: 1.2em;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      position: relative;
    }
    
    .lab-screen:after {
      content: "Pantalla del profesor";
      position: absolute;
      bottom: -25px;
      left: 0;
      right: 0;
      font-size: 0.8em;
      color: #666;
    }
    
    .lab-grid {
      display: grid;
      gap: 12px;
      margin: 0 auto;
      justify-content: center;
    }
    
    /* Estilos para los equipos (asientos) - Unificado para selector y editor */
    .lab-seat {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: bold;
      position: relative;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      border: 2px solid transparent;
      user-select: none;
    }
    
    /* Estado de los equipos */
    .lab-seat.pc {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    
    .lab-seat.available {
      background-color: #c8e6c9;
      color: #2e7d32;
    }
    
    .lab-seat.available:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .lab-seat.occupied {
      background-color: #ffcdd2;
      color: #c62828;
    }
    
    .lab-seat.maintenance {
      background-color: #fff9c4;
      color: #f9a825;
    }
    
    .lab-seat.laptop {
      background-color: #d1c4e9;
      color: #5e35b1;
    }
    
    .lab-seat.selected {
      transform: scale(1.1);
      box-shadow: 0 0 0 3px #2196f3, 0 4px 8px rgba(33,150,243,0.3);
      border-color: #2196f3;
      z-index: 10;
    }
    
    .lab-seat.empty {
      background-color: #f5f5f5;
      color: #999;
      border: 2px dashed #ccc;
    }
    
    /* Estilos para el editor */
    .editor-container {
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .editor-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .editor-btn {
      padding: 8px 15px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .editor-btn i {
      font-size: 0.9em;
    }
    
    .editor-btn.add-pc {
      background-color: #42a5f5;
      color: white;
    }
    
    .editor-btn.add-laptop {
      background-color: #7e57c2;
      color: white;
    }
    
    .editor-btn.save {
      background-color: #66bb6a;
      color: white;
    }
    
    .editor-btn.cancel {
      background-color: #ef5350;
      color: white;
    }
    
    .editor-btn:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
    
    .layout-config {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
    }
    
    .layout-config input {
      width: 50px;
      padding: 5px;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
    }
    
    .editor-legend {
      display: flex;
      gap: 15px;
      margin-top: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.9em;
    }
    
    .legend-color {
      width: 15px;
      height: 15px;
      border-radius: 3px;
      border: 1px solid rgba(0,0,0,0.1);
    }
    
    /* Efectos especiales */
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .lab-seat.pulse {
      animation: pulse 1.5s infinite;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .lab-seat {
        width: 50px;
        height: 50px;
        font-size: 0.8em;
      }
      
      .editor-controls {
        flex-direction: column;
      }
      
      .layout-config {
        margin-left: 0;
        justify-content: flex-start;
      }
    }
    
    /* Resumen y mensajes */
    .lab-summary {
      margin-top: 20px;
      padding: 15px;
      background-color: #e3f2fd;
      border-radius: 8px;
      text-align: center;
      font-size: 1.1em;
    }
    
    .lab-error {
      padding: 20px;
      background: #ffebee;
      border-radius: 5px;
      color: #c62828;
      text-align: center;
      margin: 20px 0;
    }
    
    /* Tooltip para equipos */
    .lab-seat[data-tooltip]:hover:after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.8em;
      white-space: nowrap;
      z-index: 100;
    }
  </style>
`;

// Función para obtener el laboratorio desde la URL
function obtenerLaboratorioDesdeUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const laboratorio = urlParams.get("lab");

  if (laboratorio && (laboratorio === "lab1" || laboratorio === "lab2")) {
    return laboratorio;
  }
  return null;
}

// Función para obtener la configuración del laboratorio
// Función para obtener la configuración del laboratorio desde la BD
async function obtenerConfiguracionLab(lab) {
  try {
    const response = await fetch(`http://localhost:3001/api/equipos/${lab}`);
    if (!response.ok) {
      throw new Error("No se pudo cargar la configuración de equipos");
    }
    const data = await response.json();

    // Determinar filas y columnas máximas para el layout
    let maxRow = 0;
    let maxCol = 0;

    data.equipos.forEach((equipo) => {
      if (equipo.posicion_row > maxRow) maxRow = equipo.posicion_row;
      if (equipo.posicion_col > maxCol) maxCol = equipo.posicion_col;
    });

    // Asegurar un mínimo de 6 filas y 8 columnas
    const rows = Math.max(maxRow + 1, 6);
    const cols = Math.max(maxCol + 1, 8);

    // Convertir la respuesta de la BD al formato esperado
    const config = {
      layout: { rows, cols },
      pcs: [],
      laptopAreas: [],
    };

    data.equipos.forEach((equipo) => {
      const item = {
        number: equipo.numero,
        position: {
          row: equipo.posicion_row,
          col: equipo.posicion_col,
        },
      };

      if (equipo.tipo === "PC") {
        item.status = equipo.estado || "available";
        config.pcs.push(item);
      } else if (equipo.tipo === "LAP") {
        config.laptopAreas.push(item);
      }
    });

    return config;
  } catch (error) {
    console.error("Error al cargar configuración:", error);
    return null;
  }
}

// Función para guardar la configuración en la BD
async function guardarConfiguracionDesdeEditor(laboratorio) {
  // Validación defensiva: evitar error si los elementos no existen
  const rowsInput = document.getElementById("rows-input");
  const colsInput = document.getElementById("cols-input");

  const rows = rowsInput ? parseInt(rowsInput.value) || 6 : 6;
  const cols = colsInput ? parseInt(colsInput.value) || 8 : 8;

  const pcs = [];
  const laptopAreas = [];

  document.querySelectorAll(".lab-seat").forEach((seat) => {
    const row = parseInt(seat.dataset.row);
    const col = parseInt(seat.dataset.col);
    const numero = seat.dataset.numero;

    if (seat.classList.contains("pc")) {
      const status = seat.classList.contains("available")
        ? "available"
        : seat.classList.contains("occupied")
        ? "occupied"
        : "maintenance";

      pcs.push({
        number: parseInt(numero),
        status: status,
        position: { row, col },
      });
    } else if (seat.classList.contains("laptop")) {
      laptopAreas.push({
        number: parseInt(numero),
        position: { row, col },
      });
    }
  });

  const config = {
    layout: { rows, cols },
    pcs,
    laptopAreas,
  };

  try {
    const response = await fetch("http://localhost:3001/api/lab-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lab: laboratorio, config }),
    });

    if (!response.ok) {
      throw new Error("Error al guardar");
    }

    return true;
  } catch (error) {
    console.error("Error al guardar:", error);
    Swal.showValidationMessage("Error al guardar la configuración");
    return false;
  }
}

// Función para generar el layout del laboratorio con verificación de horario
async function generarLayoutLab(laboratorio, isEditor = false) {
  try {
    // Verificar si estamos en horario de clase
    const horarioResponse = await fetch(
      `http://localhost:3001/api/horario-actual?lab=${laboratorio}`
    );
    const { horario } = await horarioResponse.json();
    const enHorarioClase = !!horario;

    const config = await obtenerConfiguracionLab(laboratorio);
    if (!config) {
      throw new Error("No se pudo cargar la configuración");
    }

    if (!config) {
      return `${labStyles}<div class="lab-error">No hay configuración disponible para este laboratorio</div>`;
    }

    let html = `
      ${labStyles}
      <div class="lab-theater">
        <div class="lab-screen">Laboratorio ${laboratorio.toUpperCase()}</div>
        
        <div class="lab-grid" style="
          grid-template-rows: repeat(${config.layout.rows}, 1fr);
          grid-template-columns: repeat(${config.layout.cols}, 1fr);
        ">
    `;

    for (let row = 0; row < config.layout.rows; row++) {
      for (let col = 0; col < config.layout.cols; col++) {
        const cellType = determinarTipoCelda(config, row, col);
        const numero = obtenerNumeroEquipo(config, row, col);

        // Determinar disponibilidad basada en horario
        let isAvailable = false;
        if (isEditor) {
          isAvailable = true; // En editor todos son editables
        } else if (cellType.includes("maintenance")) {
          isAvailable = false; // En mantenimiento nunca disponible
        } else if (enHorarioClase) {
          // Durante clase: disponibles todos excepto mantenimiento
          isAvailable =
            !cellType.includes("maintenance") && !cellType.includes("occupied");
        } else {
          // Fuera de horario: solo disponibles los marcados como available
          isAvailable = cellType.includes("available");
        }

        const selectable = isAvailable ? "selectable" : "disabled";
        const tooltipText = isEditor
          ? "Haz clic para cambiar estado"
          : isAvailable
          ? "Disponible para selección"
          : cellType.includes("occupied")
          ? "Ocupado"
          : cellType.includes("maintenance")
          ? "En mantenimiento"
          : "No disponible fuera de horario";

        html += `
          <div class="lab-seat ${cellType} ${selectable}" 
               data-row="${row}" 
               data-col="${col}" 
               data-numero="${numero}"
               data-tooltip="${tooltipText}">
            ${cellType.includes("pc") ? `PC-${numero}` : `LAP-${numero}`}
          </div>
        `;
      }
    }

    html += `
        </div>
        <div id="lab-summary" class="lab-summary">
          ${
            isEditor
              ? "Modo edición - Haz clic en los equipos para cambiar su estado"
              : enHorarioClase
              ? "Selecciona un lugar disponible"
              : "Fuera de horario de clase - Solo lugares marcados como disponibles pueden seleccionarse"
          }
        </div>
      </div>
    `;

    return html;
  } catch (error) {
    console.error("Error al generar layout:", error);
    return `
      ${labStyles}
      <div class="lab-error">Error al cargar la configuración del laboratorio</div>
    `;
  }
}

// Función auxiliar para determinar el tipo de celda
function determinarTipoCelda(config, row, col) {
  const pc = config.pcs?.find(
    (pc) => pc.position.row === row && pc.position.col === col
  );
  if (pc) {
    return `pc ${pc.status || "available"}`;
  }

  const laptop = config.laptopAreas?.find(
    (area) => area.position.row === row && area.position.col === col
  );
  if (laptop) {
    return "laptop available";
  }

  return "empty";
}

// Función auxiliar para obtener el número de equipo
function obtenerNumeroEquipo(config, row, col) {
  const pc = config.pcs?.find(
    (pc) => pc.position.row === row && pc.position.col === col
  );
  if (pc) return pc.number;

  const laptop = config.laptopAreas?.find(
    (area) => area.position.row === row && area.position.col === col
  );
  if (laptop) return laptop.number;

  return "";
}

// Función para mostrar el editor de laboratorio con diseño unificado
async function mostrarEditorLab() {
  const laboratorio = obtenerLaboratorioDesdeUrl();
  if (!laboratorio) {
    Swal.fire("Error", "No se pudo determinar el laboratorio", "error");
    return;
  }

  let config = await obtenerConfiguracionLab(laboratorio);

  if (!config || !config.layout) {
    config = {
      pcs: [],
      laptopAreas: [],
      layout: {
        rows: 6,
        cols: 8,
      },
    };
  }

  const { value: formValues } = await Swal.fire({
    title: `Editor de Laboratorio ${laboratorio.toUpperCase()}`,
    html: `
      <div class="editor-container">
        <div class="editor-controls">
          <button type="button" id="btn-add-pc" class="editor-btn add-pc">
            <i class="fas fa-desktop"></i> Añadir PC
          </button>
          <button type="button" id="btn-add-laptop" class="editor-btn add-laptop">
            <i class="fas fa-laptop"></i> Añadir Área Laptop
          </button>
          
          <div class="layout-config">
            <label>Filas:</label>
            <input type="number" id="rows-input" min="4" max="12" value="${
              config.layout.rows
            }">
            <label>Columnas:</label>
            <input type="number" id="cols-input" min="4" max="12" value="${
              config.layout.cols
            }">
          </div>
        </div>
        
        ${await generarLayoutLab(laboratorio, true)}
        
        <div class="editor-legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: #e3f2fd;"></span>
            <span>PC Nueva</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #c8e6c9;"></span>
            <span>Disponible</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #ffcdd2;"></span>
            <span>Ocupado</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #fff9c4;"></span>
            <span>Mantenimiento</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #d1c4e9;"></span>
            <span>Área Laptop</span>
          </div>
        </div>
      </div>
    `,
    width: "90%",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Guardar Configuración",
    showConfirmButton: true,
    focusConfirm: false,
    allowOutsideClick: false,
    preConfirm: () => {
      return guardarConfiguracionDesdeEditor(laboratorio);
    },
    didOpen: () => {
      // Configurar eventos para los botones de añadir
      document.getElementById("btn-add-pc").addEventListener("click", () => {
        agregarEquipoAlEditor("pc");
      });

      document
        .getElementById("btn-add-laptop")
        .addEventListener("click", () => {
          agregarEquipoAlEditor("laptop");
        });

      // Configurar eventos para cambiar el layout
      document
        .getElementById("rows-input")
        .addEventListener("change", actualizarTamañoEditor);
      document
        .getElementById("cols-input")
        .addEventListener("change", actualizarTamañoEditor);

      // Configurar eventos para los asientos en el editor
      document.querySelectorAll(".lab-seat").forEach((seat) => {
        seat.addEventListener("click", manejarClicEnEditor);
      });
    },
  });
}

// Función para manejar clics en el editor
function manejarClicEnEditor(e) {
  const seat = e.currentTarget;

  if (seat.classList.contains("empty")) {
    return; // No hacer nada con celdas vacías
  }

  // Rotar entre estados para PCs
  if (seat.classList.contains("pc")) {
    const estados = ["available", "occupied", "maintenance"];
    const estadoActual =
      estados.find((e) => seat.classList.contains(e)) || "available";
    const siguienteEstado =
      estados[(estados.indexOf(estadoActual) + 1) % estados.length];

    seat.classList.remove(estadoActual);
    seat.classList.add(siguienteEstado);

    // Actualizar tooltip
    seat.setAttribute(
      "data-tooltip",
      `Estado: ${
        siguienteEstado === "available"
          ? "Disponible"
          : siguienteEstado === "occupied"
          ? "Ocupado"
          : "Mantenimiento"
      }`
    );
  }
  // Eliminar área de laptop (se eliminará al guardar)
  else if (seat.classList.contains("laptop")) {
    if (confirm("¿Eliminar esta área de laptop?")) {
      seat.className = "lab-seat empty";
      seat.innerHTML = "";
      seat.removeAttribute("data-numero");
      seat.setAttribute("data-tooltip", "Espacio vacío");
    }
  }
}

// Función para agregar equipos en el editor
function agregarEquipoAlEditor(tipo) {
  const seats = document.querySelectorAll(".lab-seat.empty");
  if (seats.length === 0) {
    Swal.fire(
      "Error",
      "No hay espacios disponibles para agregar más equipos",
      "error"
    );
    return;
  }

  // Encontrar el próximo número disponible
  const numeros = Array.from(
    document.querySelectorAll(`.lab-seat[data-numero]`)
  ).map((el) => parseInt(el.dataset.numero) || 0);

  // Si es PC, empieza desde 1
  // Si es LAPTOP, empieza desde 100
  const siguienteNumero =
    numeros.length > 0 ? Math.max(...numeros) + 1 : tipo === "pc" ? 1 : 100;

  // Seleccionar el primer asiento vacío
  const seat = seats[0];
  const row = parseInt(seat.dataset.row);
  const col = parseInt(seat.dataset.col);

  if (tipo === "pc") {
    seat.className = "lab-seat pc available pulse";
    seat.innerHTML = `PC-${siguienteNumero}`;
    seat.dataset.numero = siguienteNumero;
    seat.setAttribute("data-tooltip", "Estado: Disponible");
  } else {
    seat.className = "lab-seat laptop available pulse";
    seat.innerHTML = `LAP-${siguienteNumero}`;
    seat.dataset.numero = siguienteNumero;
    seat.setAttribute("data-tooltip", "Área de laptop disponible");
  }

  // Quitar animación después de 2 segundos
  setTimeout(() => {
    seat.classList.remove("pulse");
  }, 2000);
}

// Función para actualizar el tamaño del layout en el editorfunction actualizarTamañoEditor() {
function actualizarTamañoEditor() {
  const rowsInput = document.getElementById("rows-input");
  const colsInput = document.getElementById("cols-input");

  const rows = rowsInput ? parseInt(rowsInput.value) || 6 : 6;
  const cols = colsInput ? parseInt(colsInput.value) || 8 : 8;

  const grid = document.querySelector(".lab-grid");
  if (!grid) {
    console.warn("Grid no encontrado");
    return;
  }

  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  // Mantener equipos existentes en sus posiciones
  document.querySelectorAll(".lab-seat").forEach((seat) => {
    const row = parseInt(seat.dataset.row);
    const col = parseInt(seat.dataset.col);

    // Si la posición está fuera del nuevo grid, marcarla para eliminación
    if (row >= rows || col >= cols) {
      seat.classList.add("out-of-bounds");
    }
  });
}

// Eliminar equipos fuera de los límites al guardar

// Función para guardar la configuración desde el editor
async function guardarConfiguracionDesdeEditor(laboratorio) {
  const rows = parseInt(document.getElementById("rows-input").value) || 6;
  const cols = parseInt(document.getElementById("cols-input").value) || 8;

  const equipos = [];

  document.querySelectorAll(".lab-seat").forEach((seat) => {
    const row = parseInt(seat.dataset.row);
    const col = parseInt(seat.dataset.col);
    const numero = parseInt(seat.dataset.numero);

    if (seat.classList.contains("pc")) {
      const estado = seat.classList.contains("available")
        ? "available"
        : seat.classList.contains("occupied")
        ? "occupied"
        : "maintenance";

      equipos.push({
        numero: numero,
        tipo: "PC",
        estado: estado,
        posicion_row: row,
        posicion_col: col,
      });
    } else if (seat.classList.contains("laptop")) {
      equipos.push({
        numero: numero,
        tipo: "LAP",
        estado: "available", // Las LAPs siempre están disponibles
        posicion_row: row,
        posicion_col: col,
      });
    }
  });

  const payload = {
    lab: laboratorio,
    layout: { rows, cols }, // aunque tu ruta actual no usa 'layout', lo puedes mandar
    equipos,
  };

  try {
    const response = await fetch("http://localhost:3001/api/equipos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Error al guardar");
    }

    return true;
  } catch (error) {
    console.error("Error al guardar:", error);
    Swal.showValidationMessage("Error al guardar la configuración");
    return false;
  }
}

// Función para enviar datos a un endpoint
const enviarDatos = async (datos) => {
  try {
    const laboratorio = obtenerLaboratorioDesdeUrl();

    if (!laboratorio) {
      throw new Error("Laboratorio no encontrado en la URL");
    }

    const response = await fetch(
      `http://localhost:3001/alumnos?lab=${laboratorio}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      }
    );

    if (!response.ok) {
      throw new Error("Error en la solicitud");
    }

    const data = await response.json();
    console.log("Datos enviados correctamente:", data);
    return data;
  } catch (error) {
    console.error("Error al enviar datos:", error);
    throw error;
  }
};

// Callback del QR modificado con verificación de horario

let lecturaActiva = true;
let ultimoQRLeido = "";
let tiempoUltimoQR = 0;
let bufferQR = "";
let timeoutQR = null;

// Función principal para procesar QR
// Función principal para procesar QR
qrcode.callback = async function (respuesta) {
  try {
    // Pausar lectura al procesar (para lector físico)
    if (typeof pausarLectura === "function") {
      pausarLectura(true);
    }

    console.log("Contenido del QR recibido:", respuesta);

    if (!respuesta) {
      throw new Error("No se pudo procesar el contenido del QR");
    }

    // Función para detectar y formatear ambos tipos de QR
    function procesarContenidoQR(texto) {
      // Intento con formato nuevo primero (más específico)
      if (texto.includes("NombreÑ") && texto.includes("CarreraÑ")) {
        const matricula = texto.substring(0, 8);
        const nombreStart = texto.indexOf("NombreÑ") + "NombreÑ".length;
        const carreraStart = texto.indexOf("CarreraÑ");
        const nombre = texto.substring(nombreStart, carreraStart).trim();
        const campusStart = texto.indexOf("CampusÑ");
        const carrera = texto
          .substring(carreraStart + "CarreraÑ".length, campusStart)
          .trim();

        return {
          matricula,
          nombre,
          carrera,
          formato: "nuevo",
        };
      }

      // Formato original (legacy)
      const qrFormateado = texto
        .replace(/TADEOTSU/g, "TADEO TSU")
        .replace(/^(\d{8})/, "$1 ")
        .replace(/\s+/g, " ")
        .replace(/\s*'\s*/, "' ")
        .trim();

      const regex =
        /^(\d{8})\s(.+?)(?:\s(TSU\sTECNOLOGIAS\sDE\sLA\sINFORMACION\s'?\sDSM))?$/i;
      const match = qrFormateado.match(regex);

      if (match) {
        return {
          matricula: match[1],
          nombre: match[2].trim(),
          carrera: match[3] || "TSU TECNOLOGIAS DE LA INFORMACION ' DSM",
          formato: "original",
        };
      }

      throw new Error("Formato de QR no reconocido");
    }

    // Procesar el contenido del QR
    const { matricula, nombre, carrera, formato } =
      procesarContenidoQR(respuesta);
    console.log(`QR procesado (formato ${formato}):`, {
      matricula,
      nombre,
      carrera,
    });

    // Verificación en la base de datos
    const verificacion = await verificarAlumnoEnBackend(matricula, nombre);

    if (!verificacion || !verificacion.success || !verificacion.alumno) {
      throw new Error(
        verificacion.message || "Alumno no encontrado en la base de datos"
      );
    }

    console.log("Alumno verificado:", verificacion.alumno);

    // Verificar si ya está registrado
    if (verificacion.yaRegistrado) {
      await Swal.fire({
        icon: "info",
        title: "Ya estás registrado",
        text: `Ya tienes un lugar asignado (${verificacion.lugarAsignado}) para esta clase`,
        footer: "Si crees que es un error, consulta al profesor",
      });
      return;
    }

    // Obtener laboratorio actual
    const laboratorio = obtenerLaboratorioDesdeUrl();

    // Verificar horario
    const horario = await verificarHorarioLaboratorio(laboratorio);
    if (!horario) {
      await Swal.fire(
        "Fuera de horario",
        "No hay clases programadas en este momento. Los lugares no están asignables.",
        "info"
      );
      return;
    } else {
      console.log(`Clase actual: ${horario.materia} con ${horario.maestro}`);
    }

    // Mostrar selección de asientos
    const resultadoSeleccion = await mostrarSeleccionAsientos(laboratorio);
    if (resultadoSeleccion) {
      await registrarAsignacion({
        laboratorio,
        matricula,
        nombre,
        carrera,
        maestro: horario.maestro || "No disponible",
        lugar: resultadoSeleccion.lugar.trim(), // ej. "PC-13"
      });

      console.log("Lugar seleccionado:", resultadoSeleccion);

      console.log("Horario actual:", horario);

      await Swal.fire(
        "Registro exitoso",
        `Has seleccionado el ${resultadoSeleccion.lugar}`,
        "success"
      );
    }
  } catch (error) {
    console.error("Error en callback QR:", error);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "Ocurrió un error al procesar el QR",
      footer: "Verifica que el código escaneado sea válido",
    });
  } finally {
    // Reanudar lectura (para lector físico)
    if (typeof pausarLectura === "function") {
      setTimeout(() => pausarLectura(false), 1000);
    }
  }
};

// Funciones auxiliares mejoradas
async function verificarAlumnoEnBackend(matricula, nombre) {
  const response = await fetch(`http://localhost:3001/verificar-alumno`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      matricula: matricula.trim(),
      nombre: nombre.trim(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Error HTTP: ${response.status}`);
  }

  return data;
}

async function verificarHorarioLaboratorio(laboratorio) {
  const response = await fetch(
    `http://localhost:3001/api/horario-actual?lab=${laboratorio}`
  );
  const { horario } = await response.json();
  return horario;
}
async function mostrarSeleccionAsientos(laboratorio) {
  const layoutHtml = await generarLayoutLab(laboratorio);
  let lugarSeleccionado = null;

  // Obtener información de asientos ocupados
  const response = await fetch(
    `http://localhost:3001/api/asientos-ocupados?lab=${laboratorio}`
  );
  const { asientos } = await response.json(); // Extraemos 'asientos' de la respuesta

  // Obtener información del horario actual
  const horario = await verificarHorarioLaboratorio(laboratorio);

  let horarioInfo = "";
  if (horario) {
    horarioInfo = `
      <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px;">
        <strong>Clase actual:</strong> ${horario.materia}<br>
        <strong>Profesor:</strong> ${horario.maestro || "No especificado"}<br>
      </div>
    `;
  }

  const { value: equipo } = await Swal.fire({
    title: "Selecciona tu lugar",
    html: horarioInfo + layoutHtml,
    width: "90%",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Confirmar lugar",
    focusConfirm: false,
    allowOutsideClick: false,
    didOpen: () => {
      if (typeof pausarLectura === "function") {
        lecturaActiva = false;
      }

      // Marcar asientos ocupados usando 'asientos'
      document.querySelectorAll(".lab-seat").forEach((seat) => {
        const numero = seat.dataset.numero;
        const tipo = seat.classList.contains("pc") ? "PC" : "LAP";
        const lugar = `${tipo}-${numero}`;

        if (asientos.includes(lugar)) {
          seat.classList.add("occupied");
          seat.classList.remove("selectable");
          seat.setAttribute("data-tooltip", "Este lugar ya está ocupado");
        }
      });

      document
        .querySelectorAll(".lab-seat.selectable:not(.occupied)")
        .forEach((seat) => {
          seat.addEventListener("click", function () {
            document.querySelectorAll(".lab-seat").forEach((s) => {
              s.classList.remove("selected");
            });
            this.classList.add("selected");
            lugarSeleccionado = this;
            document.getElementById("lab-summary").innerHTML = `
              <strong>Lugar seleccionado:</strong> ${this.textContent}
              <div style="margin-top: 5px; font-size: 0.9em;">
                (Haz clic en Confirmar para reservar este lugar)
              </div>
            `;
          });
        });
    },
    didClose: () => {
      if (typeof pausarLectura === "function") {
        lecturaActiva = true;
      }
    },
    preConfirm: () => {
      if (!lugarSeleccionado) {
        Swal.showValidationMessage("Debes seleccionar un lugar disponible");
        return false;
      }

      const lugarTexto = lugarSeleccionado.textContent.trim();
      if (!lugarTexto) {
        Swal.showValidationMessage("Lugar no válido");
        return false;
      }

      return {
        lugar: lugarTexto,
        tipo: lugarSeleccionado.classList.contains("pc") ? "PC" : "LAP",
      };
    },
  });

  return equipo;
}
async function registrarAsignacion(datos) {
  if (!datos.lugar || !datos.matricula || !datos.nombre) {
    throw new Error("Faltan datos requeridos para el registro");
  }

  // Extraer tipo y número del lugar: ej. "PC-13" → ["PC", "13"]
  const [tipo_equipo, numero_equipo] = datos.lugar.trim().split("-");
  if (!tipo_equipo || !numero_equipo) {
    throw new Error("El lugar seleccionado no es válido");
  }

  const fecha = new Date();
  const fechaFormateada = fecha.toISOString().slice(0, 19).replace("T", " ");

  const payload = {
    matricula: datos.matricula.trim(),
    nombre: datos.nombre.trim(),
    carrera: datos.carrera?.trim() || "",
    tipo_equipo: tipo_equipo,
    numero_equipo: numero_equipo,
    maestro: datos.maestro?.trim() || "No especificado",
    laboratorio: datos.laboratorio,
    fecha: fechaFormateada,
  };

  const response = await fetch(
    `http://localhost:3001/api/registrar-asignacion`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error en el registro");
  }

  return await response.json();
}

// Manejo del lector QR físico
document.addEventListener("DOMContentLoaded", () => {
  const inputQR = document.getElementById("qr-reader-input");
  const editBtn = document.getElementById("admin-button");

  if (editBtn) {
    editBtn.addEventListener("click", mostrarEditorLab);
  }

  inputQR.addEventListener("input", (e) => {
    const rawValue = e.target.value;
    console.log("Datos crudos del lector:", rawValue);

    if (timeoutQR) {
      clearTimeout(timeoutQR);
    }

    if (rawValue.includes("\n") || rawValue.includes("\r")) {
      procesarQRCompleto(rawValue.replace(/[\n\r]/g, ""));
      inputQR.value = "";
      return;
    }

    bufferQR = rawValue;
    timeoutQR = setTimeout(() => {
      if (bufferQR.length > 0) {
        procesarQRCompleto(bufferQR);
        bufferQR = "";
        inputQR.value = "";
      }
    }, 300);
  });

  function procesarQRCompleto(valorQR) {
    const ahora = Date.now();
    valorQR = valorQR.trim();

    if (valorQR === ultimoQRLeido && ahora - tiempoUltimoQR < 3000) {
      return;
    }

    if (valorQR.length >= 10) {
      ultimoQRLeido = valorQR;
      tiempoUltimoQR = ahora;
      qrcode.callback(valorQR);
    } else {
      console.error("QR incompleto o demasiado corto:", valorQR);
    }
  }

  function manejarEnfoque() {
    const modalAbierto = document.querySelector(".swal2-container") !== null;

    if (!modalAbierto && lecturaActiva) {
      if (document.activeElement !== inputQR) {
        inputQR.focus();
      }
    } else {
      lecturaActiva = false;
    }
  }

  // Eventos para mantener el enfoque
  document.addEventListener("keydown", manejarEnfoque);
  document.addEventListener("click", manejarEnfoque);
  document.addEventListener("focus", manejarEnfoque, true);

  // Intervalo de verificación de enfoque
  setInterval(manejarEnfoque, 500);

  // Función para pausar/reanudar la lectura
  window.pausarLectura = function (pausar) {
    lecturaActiva = !pausar;
    if (!pausar) {
      inputQR.value = "";
      inputQR.focus();
      bufferQR = "";
      if (timeoutQR) {
        clearTimeout(timeoutQR);
        timeoutQR = null;
      }
    }
  };
});
