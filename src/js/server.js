import express from "express";
import mysql from "mysql2";
import cors from "cors";
import fs from "fs";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware setup
app.use(cors());
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear formularios

// Rutas de tu API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

// Sirve los archivos estáticos de la carpeta "public"
app.use(express.static(join(__dirname, "../../public")));

const port = 3001;

// Session configuration
app.use(
  session({
    secret: "clave_super_secreta",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // pon en true si usas HTTPS
  })
);

// Configuración de conexión a MySQL con pool de conexiones
const pool = mysql.createPool({
  host: "mainline.proxy.rlwy.net",
  user: "root",
  password: "bIsttSqVwTLPINIpJSgwkLpEOEyfkBai",
  database: "railway",
  port: 34439,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "-06:00",
});
// Verificar conexión a la base de datos
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    process.exit(1);
  }
  console.log("Conexión a la base de datos establecida.");
  connection.release();
});

// Crear archivo de configuración si no existe
if (!fs.existsSync("lab-config.json")) {
  fs.writeFileSync(
    "lab-config.json",
    JSON.stringify(
      {
        lab1: { equipment: [] },
        lab2: { equipment: [] },
      },
      null,
      2
    )
  );
}

// Motor de plantillas
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// Función para obtener la hora actual de CDMX
function obtenerHoraCDMX() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

// Función para formatear hora en formato HH:MM de CDMX
function formatearHoraCDMX() {
  const horaCDMX = obtenerHoraCDMX();
  return `${String(horaCDMX.getHours()).padStart(2, "0")}:${String(
    horaCDMX.getMinutes()
  ).padStart(2, "0")}`;
}

// Función para formatear fecha completa de CDMX
function formatearFechaHoraCDMX() {
  const horaCDMX = obtenerHoraCDMX();
  return horaCDMX.toISOString().replace("T", " ").substring(0, 19);
}

// -------------------- RUTAS PARA USUARIOS --------------------

// Obtener todos los usuarios
app.get("/api/usuarios", (req, res) => {
  pool.query(
    "SELECT idusuario, matricula, nombre, rol FROM usuarios ORDER BY idusuario",
    (error, results) => {
      if (error) {
        console.error("Error al obtener usuarios:", error);
        return res.status(500).json({
          success: false,
          error: "Error al obtener usuarios",
        });
      }
      res.json({
        success: true,
        data: results,
      });
    }
  );
});

// Crear nuevo usuario
app.post("/api/usuarios", (req, res) => {
  const { matricula, nombre, contrasena, rol } = req.body;

  // Validaciones básicas
  if (!nombre || !contrasena) {
    return res.status(400).json({
      success: false,
      error: "Nombre y contraseña son campos requeridos",
    });
  }

  const query =
    "INSERT INTO usuarios (matricula, nombre, contrasena, rol) VALUES (?, ?, ?, ?)";

  pool.query(
    query,
    [matricula || null, nombre, contrasena, rol || "user"],
    (error, results) => {
      if (error) {
        console.error("Error al crear usuario:", error);

        if (error.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            success: false,
            error: "La matrícula ya existe",
          });
        }

        return res.status(500).json({
          success: false,
          error: "Error al crear usuario",
        });
      }

      // Devolver el usuario creado (sin contraseña)
      pool.query(
        "SELECT idusuario, matricula, nombre, rol FROM usuarios WHERE idusuario = ?",
        [results.insertId],
        (err, userResults) => {
          if (err) {
            return res.json({
              success: true,
              message: "Usuario creado exitosamente",
              id: results.insertId,
            });
          }

          res.json({
            success: true,
            message: "Usuario creado exitosamente",
            data: userResults[0],
          });
        }
      );
    }
  );
});

// Eliminar usuario
app.delete("/api/usuarios/:id", (req, res) => {
  const { id } = req.params;

  pool.query(
    "DELETE FROM usuarios WHERE idusuario = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Error al eliminar usuario:", error);
        return res.status(500).json({
          success: false,
          error: "Error al eliminar usuario",
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Usuario eliminado exitosamente",
      });
    }
  );
});
// -------------------- LOGIN --------------------
app.post("/login", async (req, res) => {
  const { matricula, contrasena } = req.body;
  try {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT idusuario, contrasena, rol, nombre FROM usuarios WHERE matricula = ?",
        [matricula]
      );

    if (rows.length > 0) {
      const user = rows[0];
      if (contrasena === user.contrasena) {
        // Guardar en sesión
        req.session.user_id = user.idusuario;
        req.session.role = user.rol;
        req.session.nombre = user.nombre;

        // ✅ Redirigir a inicio.html
        return res.redirect("/inicio.html");
      }
    }

    // Usuario o contraseña incorrecta
    res.redirect(
      "/index.html?error=" +
        encodeURIComponent("Matrícula o contraseña incorrectos")
    );
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).send("Error en el servidor");
  }
});

// -------------------- OBTENER DATOS DEL USUARIO ACTUAL --------------------
app.get("/api/user-info", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "No autenticado" });
  }

  res.json({
    id: req.session.user_id,
    username: req.session.nombre || "Usuario",
    role: req.session.role || "user",
  });
});
// -------------------- LOGOUT --------------------
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).send("Error al cerrar sesión");
    }
    res.clearCookie("connect.sid");
    res.redirect("/index.html");
  });
});

// -------------------- RUTA PROTEGIDA --------------------
app.get("/inicio", (req, res) => {
  if (!req.session.role) {
    return res.redirect("/index.html");
  }

  // Render the EJS template instead of sending HTML directly
  res.render("inicio", {
    role: req.session.role,
    username: req.session.nombre || "Usuario",
  });
});

// Función auxiliar para agregar horas a una hora dada
function agregarHoras(hora, horas) {
  const [hh, mm] = hora.split(":").map(Number);
  const totalMinutes = hh * 60 + mm + horas * 60;
  const newHH = Math.floor(totalMinutes / 60) % 24;
  const newMM = totalMinutes % 60;
  return `${String(newHH).padStart(2, "0")}:${String(newMM).padStart(2, "0")}`;
}

// Función para verificar horarios activos
// Función para verificar horarios activos - ACTUALIZADA CON GRUPO
// Función para verificar horarios activos - ACTUALIZADA CON HORA CDMX
async function verificarHorario(lab) {
  const horaActualCDMX = formatearHoraCDMX();
  const ahoraCDMX = obtenerHoraCDMX();

  const diaSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ][ahoraCDMX.getDay()];

  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT * FROM horarios 
       WHERE laboratorio = ? 
       AND dia = ?`,
      [lab, diaSemana],
      (err, results) => {
        if (err) return reject(err);

        const horarioActivo = results.find((horario) => {
          const [horaInicio, horaFin] = horario.hora
            .split("-")
            .map((h) => h.trim());
          return horaActualCDMX >= horaInicio && horaActualCDMX <= horaFin;
        });

        resolve({ horario: horarioActivo });
      }
    );
  });
}
// Ruta para obtener asientos ocupados
app.get("/api/asientos-ocupados", (req, res) => {
  const { lab } = req.query;

  if (!lab || !["lab1", "lab2"].includes(lab)) {
    return res
      .status(400)
      .json({ error: "Parámetro 'lab' inválido o faltante" });
  }

  pool.query(
    `SELECT CONCAT(tipo, '-', numero) AS asiento
     FROM equipos
     WHERE laboratorio = ? AND estado = 'occupied'`,
    [lab],
    (error, results) => {
      if (error) {
        console.error("Error en /api/asientos-ocupados:", error);
        return res
          .status(500)
          .json({ error: "Error al obtener asientos ocupados" });
      }

      res.json({
        asientos: results.map((row) => row.asiento),
      });
    }
  );
});

// En tu servidor (app.js o routes.js)
app.post("/verificar-alumno", (req, res) => {
  try {
    const { matricula, nombre } = req.body;

    // Validación básica
    if (!matricula || !nombre) {
      return res.status(400).json({
        success: false,
        message: "Matrícula y nombre son requeridos",
      });
    }

    // Consulta a la base de datos usando callback
    pool.query(
      "SELECT matricula, nombre, carrera FROM estudiantes WHERE matricula = ?",
      [matricula],
      (error, results) => {
        if (error) {
          console.error("Error en la consulta:", error);
          return res.status(500).json({
            success: false,
            message: "Error en la base de datos",
            error: error.message,
          });
        }

        // Verificación de existencia
        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            valido: false,
            message: "Alumno no encontrado en la base de datos",
          });
        }

        const alumno = results[0];

        // Verificación de coincidencia de nombre (no case sensitive)
        if (alumno.nombre.toLowerCase() !== nombre.toLowerCase()) {
          return res.json({
            success: true,
            valido: false,
            message: "El nombre no coincide con la matrícula",
            alumno: null,
          });
        }

        // Respuesta exitosa
        res.json({
          success: true,
          valido: true,
          message: "Alumno verificado correctamente",
          alumno: {
            matricula: alumno.matricula,
            nombre: alumno.nombre,
            carrera: alumno.carrera,
          },
        });
      }
    );
  } catch (error) {
    console.error("Error en verificación:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

// Ruta para obtener horarios por laboratorio
// Ruta para obtener horarios por laboratorio - ACTUALIZADA CON GRUPO
// Ruta para obtener horarios por laboratorio - ACTUALIZADA CON GRUPO
app.get("/api/horarios", (req, res) => {
  const { lab } = req.query;

  if (!lab || !["lab1", "lab2"].includes(lab)) {
    return res.status(400).json({
      error: "Parámetro 'lab' inválido o faltante",
      detalles: "Debe especificar lab=lab1 o lab=lab2",
    });
  }

  pool.query(
    `SELECT 
      id,
      hora,
      materia,
      maestro,
      grupo,
      dia,
      laboratorio
    FROM horarios 
    WHERE laboratorio = ? 
    ORDER BY 
      FIELD(dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'),
      hora ASC`,
    [lab],
    (err, results) => {
      if (err) {
        console.error("Error en la consulta de horarios:", err);
        return res.status(500).json({
          error: "Error al obtener horarios",
          detalles: err.message,
          sqlError: err.sqlMessage,
        });
      }

      try {
        const horariosProcesados = results.map((horario) => {
          const [hora_inicio, hora_fin] = horario.hora
            .split("-")
            .map((h) => h.trim());
          return {
            ...horario,
            hora_inicio,
            hora_fin,
          };
        });

        res.json({
          success: true,
          laboratorio: lab,
          total: horariosProcesados.length,
          horarios: horariosProcesados,
        });
      } catch (error) {
        console.error("Error al procesar horarios:", error);
        res.status(500).json({
          error: "Error al procesar los horarios",
          detalles: error.message,
        });
      }
    }
  );
});

// Ruta para actualizar horarios
// Ruta para actualizar horarios - ACTUALIZADA CON GRUPO
app.put("/api/horarios", async (req, res) => {
  const { laboratorio, horarios } = req.body;

  if (!laboratorio || !["lab1", "lab2"].includes(laboratorio)) {
    return res.status(400).json({
      error: "Laboratorio inválido o no especificado",
      detalles: "Use lab1 o lab2",
    });
  }

  if (!Array.isArray(horarios)) {
    return res.status(400).json({
      error: "Formato de horarios inválido",
      detalles: "Se espera un array de horarios",
    });
  }

  for (const [index, horario] of horarios.entries()) {
    if (
      !horario.hora_inicio ||
      !horario.hora_fin ||
      !horario.dia ||
      !horario.materia
    ) {
      return res.status(400).json({
        error: `Horario incompleto en la posición ${index}`,
        detalles:
          "Cada horario debe tener hora_inicio, hora_fin, dia y materia",
      });
    }

    if (
      !horario.hora_inicio.match(/^\d{2}:\d{2}$/) ||
      !horario.hora_fin.match(/^\d{2}:\d{2}$/)
    ) {
      return res.status(400).json({
        error: `Formato de hora inválido en la posición ${index}`,
        detalles: "Use formato HH:MM para las horas",
      });
    }
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    await connection.query("DELETE FROM horarios WHERE laboratorio = ?", [
      laboratorio,
    ]);

    const inserts = [];
    for (const horario of horarios) {
      const horaCompleta = `${horario.hora_inicio.trim()}-${horario.hora_fin.trim()}`;

      inserts.push(
        connection.query(
          `INSERT INTO horarios (hora, materia, maestro, grupo, dia, laboratorio) VALUES (?, ?, ?, ?, ?, ?)`, // ← AGREGAR GRUPO
          [
            horaCompleta,
            horario.materia.trim(),
            horario.maestro ? horario.maestro.trim() : null,
            horario.grupo ? horario.grupo.trim() : null, // ← NUEVO CAMPO
            horario.dia.trim(),
            laboratorio,
          ]
        )
      );
    }

    await Promise.all(inserts);
    await connection.commit();

    const [horariosActualizados] = await connection.query(
      "SELECT * FROM horarios WHERE laboratorio = ?",
      [laboratorio]
    );

    const horariosFormateados = horariosActualizados.map((h) => {
      const [hora_inicio, hora_fin] = h.hora.split("-");
      return {
        id: h.id,
        hora_inicio,
        hora_fin,
        materia: h.materia,
        maestro: h.maestro,
        grupo: h.grupo, // ← INCLUIR GRUPO EN LA RESPUESTA
        dia: h.dia,
        laboratorio: h.laboratorio,
      };
    });

    res.json({
      success: true,
      message: "Horarios actualizados correctamente",
      laboratorio,
      totalInsertados: horarios.length,
      horarios: horariosFormateados,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error en transacción de horarios:", {
      error: error.message,
      sqlError: error.sqlMessage,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Error al actualizar horarios",
      detalles: error.message,
      sqlError: error.sqlMessage,
    });
  } finally {
    connection.release();
  }
});

// Obtener equipos por laboratorio
app.get("/api/equipos/:lab", (req, res) => {
  const { lab } = req.params;

  pool.query(
    "SELECT * FROM equipos WHERE laboratorio = ? ORDER BY tipo, numero",
    [lab],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Error al obtener equipos" });
      }
      res.json({ equipos: results });
    }
  );
});

// Guardar equipos
app.post("/api/equipos", (req, res) => {
  const { lab, equipos, layout } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al obtener conexión" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error(err);
        return res.status(500).json({ error: "Error al iniciar transacción" });
      }

      // 1. Eliminar equipos existentes
      connection.query(
        "DELETE FROM equipos WHERE laboratorio = ?",
        [lab],
        (error) => {
          if (error) {
            return connection.rollback(() => {
              connection.release();
              console.error(error);
              res.status(500).json({ error: "Error al eliminar equipos" });
            });
          }

          // 2. Insertar nuevos equipos
          const insertPromises = equipos.map((equipo) => {
            return new Promise((resolve, reject) => {
              connection.query(
                `INSERT INTO equipos 
                 (laboratorio, numero, tipo, estado, posicion_row, posicion_col) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  lab,
                  equipo.numero,
                  equipo.tipo,
                  equipo.estado,
                  equipo.posicion_row,
                  equipo.posicion_col,
                ],
                (error) => {
                  if (error) reject(error);
                  else resolve();
                }
              );
            });
          });

          Promise.all(insertPromises)
            .then(() => {
              connection.commit((err) => {
                connection.release();
                if (err) {
                  console.error(err);
                  return res
                    .status(500)
                    .json({ error: "Error al confirmar cambios" });
                }
                res.json({ success: true });
              });
            })
            .catch((error) => {
              connection.rollback(() => {
                connection.release();
                console.error(error);
                res.status(500).json({ error: "Error al insertar equipos" });
              });
            });
        }
      );
    });
  });
});

// Ruta para obtener la configuración del laboratorio
app.get("/api/lab-config/:lab", (req, res) => {
  if (!["lab1", "lab2"].includes(req.params.lab)) {
    return res
      .status(400)
      .json({ error: "Laboratorio inválido. Use lab1 o lab2" });
  }

  try {
    const configData = JSON.parse(fs.readFileSync("lab-config.json"));
    res.json(configData[req.params.lab] || { equipment: [] });
  } catch (error) {
    console.error("Error al leer configuración:", error);
    res.status(500).json({
      error: "Error al leer configuración",
      details: error.message,
    });
  }
});

// Ruta para actualizar estado de equipos
app.post("/api/update-equipment", (req, res) => {
  const { lab, equipment, status } = req.body;

  if (!["lab1", "lab2"].includes(lab)) {
    return res
      .status(400)
      .json({ error: "Laboratorio inválido. Use lab1 o lab2" });
  }

  if (!equipment || typeof status === "undefined") {
    return res.status(400).json({ error: "Datos de equipo incompletos" });
  }

  try {
    const configData = JSON.parse(fs.readFileSync("lab-config.json"));

    if (!configData[lab]) configData[lab] = { equipment: [] };

    let eq = configData[lab].equipment.find((e) => e.number == equipment);

    if (eq) {
      eq.status = status;
      eq.lastUsed = new Date().toISOString();
    } else {
      configData[lab].equipment.push({
        number: equipment,
        status: status,
        lastUsed: new Date().toISOString(),
      });
    }

    fs.writeFileSync("lab-config.json", JSON.stringify(configData, null, 2));
    res.json({ success: true, equipment: eq || { number: equipment, status } });
  } catch (error) {
    console.error("Error al actualizar equipo:", error);
    res.status(500).json({
      error: "Error al actualizar equipo",
      details: error.message,
    });
  }
});

// Ruta para liberar lugares al terminar la clase
app.post("/api/liberar-lugares", async (req, res) => {
  const { lab } = req.body;

  if (!["lab1", "lab2"].includes(lab)) {
    return res
      .status(400)
      .json({ error: "Laboratorio inválido. Use lab1 o lab2" });
  }

  try {
    const [result] = await pool
      .promise()
      .query(
        `UPDATE equipos SET estado = 'available' WHERE laboratorio = ? AND estado = 'occupied'`,
        [lab]
      );

    res.json({
      success: true,
      message: `Se liberaron ${result.affectedRows} equipos en ${lab}`,
    });
  } catch (error) {
    console.error("Error al liberar lugares:", error);
    res.status(500).json({
      error: "Error al liberar lugares",
      details: error.message,
    });
  }
});

app.post("/alumnos", async (req, res) => {
  const { matricula, nombre, carrera, PC } = req.body;
  const laboratorio = req.query.lab;

  if (!laboratorio) {
    return res
      .status(400)
      .json({ error: "El campo 'laboratorio' es obligatorio" });
  }

  try {
    const { horario } = await verificarHorario(laboratorio);
    const maestro = horario?.maestro || "No asignado";

    // Usar fecha y hora de CDMX
    const fechaCDMX = formatearFechaHoraCDMX();

    const query = `
      INSERT INTO alumnos (matricula, nombre, carrera, maestro, PC, fecha, laboratorio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      matricula,
      nombre,
      carrera,
      maestro,
      PC,
      fechaCDMX, // Usar fecha de CDMX
      laboratorio,
    ];

    pool.query(query, values, (err, result) => {
      if (err) {
        console.error("Error al insertar datos:", err);
        return res.status(500).json({
          error: "Error al guardar datos",
          detalles: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: "Alumno registrado correctamente",
        id: result.insertId,
        fechaRegistro: fechaCDMX,
      });
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({
      error: "Error en el servidor",
      detalles: error.message,
    });
  }
});

// Endpoint para verificar la hora del servidor
app.get("/api/hora-servidor", (req, res) => {
  const horaUTC = new Date();
  const horaCDMX = obtenerHoraCDMX();

  res.json({
    hora_utc: horaUTC.toISOString(),
    hora_cdmx: horaCDMX.toISOString(),
    hora_cdmx_formateada: formatearHoraCDMX(),
    fecha_cdmx_formateada: formatearFechaHoraCDMX(),
  });
});
// Ruta para obtener todos los alumnos
app.get("/alumnos", (req, res) => {
  const query = "SELECT * FROM alumnos";

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error al consultar alumnos:", err);
      return res
        .status(500)
        .json({ error: "Error al obtener la lista de alumnos" });
    }
    res.status(200).json(results);
  });
});

// Ruta para añadir un nuevo horario
// Ruta para añadir un nuevo horario - ACTUALIZADA CON GRUPO
app.post("/horarios", (req, res) => {
  const { hora, materia, maestro, grupo, dia, laboratorio } = req.body; // ← AGREGAR GRUPO

  if (!hora || !hora.match(/^\d{2}:\d{2}-\d{2}:\d{2}$/)) {
    return res.status(400).json({
      error: "Formato de hora inválido. Use HH:MM-HH:MM",
    });
  }

  const query = `
    INSERT INTO horarios (hora, materia, maestro, grupo, dia, laboratorio) VALUES (?, ?, ?, ?, ?, ?)  // ← AGREGAR GRUPO
  `;
  const values = [hora, materia, maestro, grupo || null, dia, laboratorio]; // ← AGREGAR GRUPO

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error("Error al insertar horario:", err);
      return res.status(500).json({ error: "Error al guardar horario" });
    }
    res
      .status(201)
      .json({ message: "Horario añadido correctamente", id: result.insertId });
  });
});

// Ruta para eliminar un horario por ID
app.delete("/horarios/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM horarios WHERE id = ?";
  const values = [id];

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error("Error al eliminar horario:", err);
      return res.status(500).json({ error: "Error al eliminar el horario" });
    }
    res.status(200).json({
      message: "Horario eliminado correctamente",
      affectedRows: result.affectedRows,
    });
  });
});

// Liberación automática de lugares - MODIFICADA
setInterval(async () => {
  try {
    const horaActualCDMX = formatearHoraCDMX();
    const ahoraCDMX = obtenerHoraCDMX();

    const diaSemana = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ][ahoraCDMX.getDay()];

    // Obtener solo los horarios del día actual
    const [horarios] = await pool
      .promise()
      .query(`SELECT laboratorio, hora, materia FROM horarios WHERE dia = ?`, [
        diaSemana,
      ]);

    const horariosTerminados = horarios.filter((horario) => {
      const horaFin = horario.hora.split("-")[1].trim();
      // Solo liberar cuando la hora actual sea EXACTAMENTE la hora de fin
      return horaFin === horaActualCDMX;
    });

    console.log(
      `[${horaActualCDMX}] Verificando clases terminadas: ${horariosTerminados.length} encontradas`
    );

    for (const { laboratorio, hora, materia } of horariosTerminados) {
      try {
        console.log(
          `🕒 Liberando lugares: ${laboratorio} - ${materia} (${hora})`
        );

        await fetch(`http://localhost:${port}/api/liberar-lugares`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lab: laboratorio }),
        });

        console.log(`✅ Lugares liberados para ${laboratorio}`);
      } catch (error) {
        console.error(
          `❌ Error al liberar lugares para ${laboratorio}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error en el script de liberación automática:", error);
  }
}, 60000); // Ejecutar cada minuto

// Ruta para verificar si hay un horario activo actualmente en un laboratorio
app.get("/api/horario-actual", async (req, res) => {
  const { lab } = req.query;

  if (!lab || !["lab1", "lab2"].includes(lab)) {
    return res.status(400).json({
      success: false,
      error: "Laboratorio no especificado o inválido",
    });
  }

  try {
    const { horario } = await verificarHorario(lab);
    const horaClase = horario?.hora || "";
    const [horaInicio, horaFin] = horaClase.split("-").map((h) => h.trim());

    if (horario) {
      return res.json({
        success: true,
        disponible: false,
        mensaje: `Laboratorio ${lab} está ocupado`,
        horario,
      });
    } else {
      return res.json({
        success: true,
        disponible: true,
        mensaje: `Laboratorio ${lab} está libre`,
      });
    }
  } catch (error) {
    console.error("Error al verificar horario:", error);
    res.status(500).json({
      success: false,
      error: "Error al verificar horario",
      detalles: error.message,
    });
  }
});

// Ruta para manejar solicitudes de cambio de horario
app.post("/api/solicitudes", async (req, res) => {
  const { laboratorio, usuarioId, dia, hora_actual, hora_nueva, motivo } =
    req.body;

  // Validación detallada con mensajes claros
  const errors = [];
  if (!laboratorio) errors.push("El campo 'laboratorio' es requerido");
  if (!usuarioId) errors.push("El campo 'usuarioId' es requerido");
  if (!dia) errors.push("El campo 'dia' es requerido");
  if (!hora_actual) errors.push("El campo 'hora_actual' es requerido");
  if (!hora_nueva) errors.push("El campo 'hora_nueva' es requerido");
  if (!motivo) errors.push("El campo 'motivo' es requerido");

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validación fallida",
      messages: errors,
      received: req.body,
    });
  }

  // Validar formato del laboratorio
  if (!["lab1", "lab2", "lab3", "lab4"].includes(laboratorio)) {
    return res.status(400).json({
      success: false,
      error: "Laboratorio inválido",
      detalles: "Los laboratorios válidos son: lab1, lab2, lab3, lab4",
    });
  }

  // Validación mejorada para horas
  const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/; // Acepta HH:MM (24h)

  if (!horaRegex.test(hora_actual)) {
    return res.status(400).json({
      success: false,
      error: "Formato de hora inválido",
      message: "hora_actual debe estar en formato HH:MM (ej: 08:30)",
      received: hora_actual,
    });
  }

  if (!horaRegex.test(hora_nueva)) {
    return res.status(400).json({
      success: false,
      error: "Formato de hora inválido",
      message: "hora_nueva debe estar en formato HH:MM (ej: 09:30)",
      received: hora_nueva,
    });
  }

  // Validar día de la semana
  const diasValidos = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  if (!diasValidos.includes(dia.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: "Día inválido",
      detalles:
        "Días válidos: lunes, martes, miercoles, jueves, viernes, sabado",
    });
  }

  try {
    // Insertar la solicitud en la base de datos con fecha actual
    const [result] = await pool.promise().query(
      `INSERT INTO solicitudes 
       (laboratorio, usuario_id, dia, hora_actual, hora_nueva, motivo, estado, fecha) 
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
      [laboratorio, usuarioId, dia, hora_actual, hora_nueva, motivo]
    );

    // Crear notificación para el administrador
    await pool.promise().query(
      `INSERT INTO notificaciones 
       (tipo, mensaje, datos, leido) 
       VALUES ('solicitud_cambio', ?, ?, 0)`,
      [
        `Nueva solicitud de cambio en ${laboratorio}`,
        JSON.stringify({
          laboratorio,
          usuarioId,
          dia,
          hora_actual,
          hora_nueva,
          motivo,
          fecha: new Date().toISOString(),
        }),
      ]
    );

    res.json({
      success: true,
      message: "Solicitud de cambio registrada correctamente",
      solicitudId: result.insertId,
    });
  } catch (error) {
    console.error("Error al procesar solicitud:", {
      error: error.message,
      sqlError: error.sqlMessage,
      stack: error.stack,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: "Error al procesar la solicitud",
      detalles: error.message,
      sqlError: error.sqlMessage,
    });
  }
});

// Ruta para obtener todas las solicitudes (GET)
app.get("/api/solicitudes", async (req, res) => {
  try {
    const [solicitudes] = await pool.promise().query(`
      SELECT 
        s.id,
        s.laboratorio,
        u.nombre as usuarioNombre,
        s.dia,
        s.hora_actual as horaActual,
        s.hora_nueva as horaNueva,
        s.motivo,
        s.estado,
        DATE_FORMAT(s.fecha, '%Y-%m-%d %H:%i:%s') as fechaFormateada
      FROM solicitudes s
      LEFT JOIN usuarios u ON s.usuario_id = u.idusuario
      ORDER BY s.fecha DESC
    `);

    res.json({
      success: true,
      solicitudes: solicitudes,
    });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener solicitudes",
      details: error.message,
    });
  }
});

// Ruta para actualizar el estado de una solicitud (PUT)
app.put("/api/solicitudes/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  // Validar el estado
  if (!["pendiente", "aprobado", "rechazado"].includes(estado)) {
    return res.status(400).json({
      success: false,
      error: "Estado inválido",
      details: "Los estados válidos son: pendiente, aprobado, rechazado",
    });
  }

  try {
    const [result] = await pool
      .promise()
      .query("UPDATE solicitudes SET estado = ? WHERE id = ?", [estado, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
      });
    }

    res.json({
      success: true,
      message: "Estado actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar solicitud",
      details: error.message,
    });
  }
});
// -------------------- ENDPOINTS PARA ESTUDIANTES CON GRUPOS --------------------

// Obtener estudiantes (con filtro por grupo)
app.get("/api/estudiantes", async (req, res) => {
  try {
    const { grupo } = req.query;
    let query = "SELECT * FROM estudiantes";
    let params = [];

    if (grupo && grupo !== "todos") {
      query += " WHERE grupo = ?";
      params.push(grupo);
    }

    query += " ORDER BY matricula";

    const [rows] = await pool.promise().query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registrar nuevo estudiante
app.post("/api/estudiantes", async (req, res) => {
  try {
    const { matricula, nombre, carrera, grupo } = req.body;

    // Verificar si el estudiante ya existe
    const [existing] = await pool
      .promise()
      .query("SELECT * FROM estudiantes WHERE matricula = ?", [matricula]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "La matrícula ya está registrada",
      });
    }

    // Insertar nuevo estudiante
    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO estudiantes (matricula, nombre, carrera, grupo) VALUES (?, ?, ?, ?)",
        [matricula, nombre, carrera, grupo || null]
      );

    res.json({
      success: true,
      message: "Estudiante registrado correctamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error al registrar estudiante:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar grupo de un estudiante específico
app.put("/api/estudiantes/:matricula", async (req, res) => {
  try {
    const { matricula } = req.params;
    const { grupo } = req.body;

    console.log("Actualizando estudiante:", matricula, "Nuevo grupo:", grupo);

    const [result] = await pool
      .promise()
      .query("UPDATE estudiantes SET grupo = ? WHERE matricula = ?", [
        grupo,
        matricula,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Estudiante no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Grupo del estudiante actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar estudiante
app.delete("/api/estudiantes/:matricula", async (req, res) => {
  try {
    const { matricula } = req.params;

    console.log("Eliminando estudiante:", matricula);

    const [result] = await pool
      .promise()
      .query("DELETE FROM estudiantes WHERE matricula = ?", [matricula]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Estudiante no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Estudiante eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualización masiva de grupos (opcional)
// Actualización masiva de grupos - VERSIÓN MEJORADA
// Actualización masiva de grupos - VERSIÓN MEJORADA
app.put("/api/estudiantes/grupo/masivo", async (req, res) => {
  try {
    const { grupo_anterior, grupo_nuevo } = req.body;

    console.log("Actualización masiva solicitada:", {
      grupo_anterior,
      grupo_nuevo,
    });

    // Validaciones
    if (grupo_anterior === undefined || grupo_nuevo === undefined) {
      return res.status(400).json({
        success: false,
        error: "grupo_anterior y grupo_nuevo son requeridos",
      });
    }

    if (grupo_anterior === grupo_nuevo) {
      return res.status(400).json({
        success: false,
        error: "El nuevo grupo no puede ser igual al anterior",
      });
    }

    // Convertir "Sin grupo" a NULL en la base de datos
    const grupoAnteriorDB =
      grupo_anterior === "Sin grupo" ? null : grupo_anterior;
    const grupoNuevoDB = grupo_nuevo === "Sin grupo" ? null : grupo_nuevo;

    // Verificar si hay estudiantes en el grupo anterior
    const query =
      grupoAnteriorDB === null
        ? "SELECT COUNT(*) as count FROM estudiantes WHERE grupo IS NULL"
        : "SELECT COUNT(*) as count FROM estudiantes WHERE grupo = ?";

    const params = grupoAnteriorDB === null ? [] : [grupoAnteriorDB];

    const [studentsInOldGroup] = await pool.promise().query(query, params);

    if (studentsInOldGroup[0].count === 0) {
      return res.status(404).json({
        success: false,
        error: `No hay estudiantes en el grupo ${grupo_anterior}`,
      });
    }

    // Realizar la actualización masiva
    const updateQuery =
      grupoAnteriorDB === null
        ? "UPDATE estudiantes SET grupo = ? WHERE grupo IS NULL"
        : "UPDATE estudiantes SET grupo = ? WHERE grupo = ?";

    const updateParams =
      grupoAnteriorDB === null
        ? [grupoNuevoDB]
        : [grupoNuevoDB, grupoAnteriorDB];

    const [result] = await pool.promise().query(updateQuery, updateParams);

    res.json({
      success: true,
      message: `Grupo actualizado de "${grupo_anterior}" a "${grupo_nuevo}"`,
      affected: result.affectedRows,
    });

    console.log(
      `Actualización completada: ${result.affectedRows} estudiantes actualizados`
    );
  } catch (error) {
    console.error("Error en actualización masiva:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar grupos",
      detalles: error.message,
    });
  }
});
// Obtener estudiantes por grupo específico
// Obtener estudiantes por grupo específico - VERSIÓN MEJORADA
app.get("/api/estudiantes/grupo/:grupo", async (req, res) => {
  try {
    const { grupo } = req.params;

    // Manejar "Sin grupo" (NULL en la base de datos)
    const query =
      grupo === "Sin grupo"
        ? "SELECT * FROM estudiantes WHERE grupo IS NULL ORDER BY nombre"
        : "SELECT * FROM estudiantes WHERE grupo = ? ORDER BY nombre";

    const params = grupo === "Sin grupo" ? [] : [grupo];

    const [rows] = await pool.promise().query(query, params);

    res.json({
      success: true,
      count: rows.length,
      grupo: grupo,
      data: rows,
    });
  } catch (error) {
    console.error("Error al obtener estudiantes por grupo:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener estudiantes",
    });
  }
});
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
