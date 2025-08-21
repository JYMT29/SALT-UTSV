document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const video = document.getElementById("qr-video");
  const canvas = document.getElementById("qr-canvas");
  const qrResult = document.getElementById("qr-result");
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const registrarBtn = document.getElementById("registrar-btn");

  const matriculaInput = document.getElementById("matricula");
  const nombreInput = document.getElementById("nombre");
  const carreraTipoInput = document.getElementById("carrera-tipo");
  const carreraNombreInput = document.getElementById("carrera-nombre");

  const studentsTableBody = document.getElementById("students-table-body");

  // Variables de estado
  let scannerActive = false;
  let stream = null;
  let currentStudentData = null;

  // Inicializar la base de datos
  const dbName = "EscuelaDB";
  const dbVersion = 1;
  const storeName = "registro_educativo";

  let db;
  const request = indexedDB.open(dbName, dbVersion);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
      const store = db.createObjectStore(storeName, { keyPath: "matricula" });
      store.createIndex("nombre", "nombre", { unique: false });
      store.createIndex("carrera", ["carreraTipo", "carreraNombre"], {
        unique: false,
      });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    loadStudents();
  };

  request.onerror = (event) => {
    console.error("Error al abrir la base de datos:", event.target.error);
  };

  // Cargar estudiantes desde la base de datos
  function loadStudents() {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      studentsTableBody.innerHTML = "";
      request.result.forEach((student) => {
        addStudentToTable(student);
      });
    };

    request.onerror = () => {
      console.error("Error al cargar estudiantes");
    };
  }

  // Añadir estudiante a la tabla
  function addStudentToTable(student) {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${student.matricula}</td>
            <td>${student.nombre}</td>
            <td>${student.carreraTipo}</td>
            <td>${student.carreraNombre}</td>
        `;

    studentsTableBody.appendChild(row);
  }

  // Registrar estudiante en la base de datos
  function registerStudent(studentData) {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    const request = store.add(studentData);

    request.onsuccess = () => {
      addStudentToTable(studentData);
      alert("Estudiante registrado con éxito");
      resetForm();
    };

    request.onerror = (event) => {
      if (event.target.error.name === "ConstraintError") {
        alert("Error: Ya existe un estudiante con esta matrícula");
      } else {
        console.error("Error al registrar estudiante:", event.target.error);
        alert("Error al registrar estudiante");
      }
    };
  }

  // Resetear el formulario
  function resetForm() {
    matriculaInput.value = "";
    nombreInput.value = "";
    carreraTipoInput.value = "";
    carreraNombreInput.value = "";
    qrResult.hidden = true;
    currentStudentData = null;
  }

  // Procesar el código QR
  function processQRCode(data) {
    try {
      const studentData = {};

      // Detectar el formato (los primeros 8 dígitos son la matrícula)
      if (!/^\d{8}/.test(data)) {
        throw new Error(
          "El código QR no comienza con una matrícula válida (8 dígitos)"
        );
      }

      // Extraer matrícula (siempre los primeros 8 dígitos)
      studentData.matricula = data.substring(0, 8);

      // Procesamiento diferente según el formato
      if (data.includes("Nombre:")) {
        // SEGUNDO FORMATO: "24190391 Nombre: NOMBRE COMPLETO Carrera: TSU NOMBRE CARRERA ..."

        // Extraer nombre completo (después de "Nombre:" hasta "Carrera:")
        const nombreStart = data.indexOf("Nombre:") + 7;
        const nombreEnd = data.indexOf("Carrera:");
        if (nombreStart < 0 || nombreEnd < 0) {
          throw new Error("Formato de QR inválido - faltan campos requeridos");
        }
        studentData.nombre = data.substring(nombreStart, nombreEnd).trim();

        // Extraer carrera completa (después de "Carrera:" hasta "Campus:")
        const carreraStart = data.indexOf("Carrera:") + 8;
        const carreraEnd = data.indexOf("Campus:");
        if (carreraStart < 0 || carreraEnd < 0) {
          throw new Error("Formato de QR inválido - faltan campos de carrera");
        }
        studentData.carrera = data.substring(carreraStart, carreraEnd).trim();
      } else {
        // PRIMER FORMATO: "23190091 NOMBRE COMPLETO TSU NOMBRE CARRERA - DSM"
        const parts = data.split(/\s+/);

        // Extraer nombre (todo hasta antes de TSU o ING)
        let nameParts = [];
        let i = 1;
        while (i < parts.length && parts[i] !== "TSU" && parts[i] !== "ING") {
          nameParts.push(parts[i]);
          i++;
        }
        studentData.nombre = nameParts.join(" ");

        // Extraer carrera (TSU/ING + nombre carrera hasta antes de "- DSM")
        if (i < parts.length) {
          const carreraParts = [];
          while (i < parts.length && !parts[i].startsWith("-")) {
            carreraParts.push(parts[i]);
            i++;
          }
          studentData.carrera = carreraParts.join(" ").replace(/\s*-\s*$/, "");
        }
      }

      // Validaciones
      if (!/^\d{8}$/.test(studentData.matricula)) {
        throw new Error("Matrícula inválida (deben ser 8 dígitos)");
      }
      if (!studentData.nombre || studentData.nombre.trim() === "") {
        throw new Error("Nombre no encontrado en el QR");
      }
      if (!studentData.carrera || studentData.carrera.trim() === "") {
        throw new Error("Carrera no encontrada en el QR");
      }

      return studentData;
    } catch (error) {
      console.error("Error al procesar QR:", error);
      alert(`Error al leer QR: ${error.message}`);
      return null;
    }
  }
  // Escanear el código QR
  function scanQRCode() {
    if (!scannerActive) return;

    const canvasElement = canvas;
    const canvasContext = canvasElement.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvasContext.drawImage(
        video,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      const imageData = canvasContext.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        const studentData = processQRCode(code.data);
        if (studentData) {
          currentStudentData = studentData;

          // Mostrar los datos en el formulario
          matriculaInput.value = studentData.matricula;
          nombreInput.value = studentData.nombre;
          carreraTipoInput.value = studentData.carreraTipo;
          carreraNombreInput.value = studentData.carreraNombre;

          qrResult.hidden = false;
          stopScanner();
        }
      }
    }

    if (scannerActive) {
      requestAnimationFrame(scanQRCode);
    }
  }

  // Iniciar el escáner
  function startScanner() {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(function (s) {
        stream = s;
        video.srcObject = stream;
        video.play();

        startBtn.disabled = true;
        stopBtn.disabled = false;
        scannerActive = true;

        requestAnimationFrame(scanQRCode);
      })
      .catch(function (err) {
        console.error("Error al acceder a la cámara:", err);
        alert(
          "No se pudo acceder a la cámara. Asegúrate de permitir el acceso."
        );
      });
  }

  // Detener el escáner
  function stopScanner() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    scannerActive = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  // Event listeners
  startBtn.addEventListener("click", startScanner);
  stopBtn.addEventListener("click", stopScanner);

  registrarBtn.addEventListener("click", () => {
    if (currentStudentData) {
      registerStudent(currentStudentData);
    } else {
      alert("No hay datos de estudiante para registrar");
    }
  });

  // Manejar cierre de la página
  window.addEventListener("beforeunload", () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });
});
