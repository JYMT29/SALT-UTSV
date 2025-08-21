const express = require("express");
const mysql = require("mysql2"); // Usamos mysql2
const app = express();
app.use(express.json());

// Configurar la conexión a la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "sistema_alumnos",
  port: 330, // Asegúrate de que el puerto es el correcto (3306 por defecto)
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error al conectar a la BD:", err);
    return;
  }
  console.log("Conectado a la BD");
});

// Ruta para registrar el acceso
app.post("/registrar-lab", (req, res) => {
  const { laboratorio } = req.body;

  if (!laboratorio) {
    return res
      .status(400)
      .json({ error: "El campo 'laboratorio' es obligatorio" });
  }

  const sql = "INSERT INTO accesos (laboratorio) VALUES (?)";
  db.query(sql, [laboratorio], (err, result) => {
    if (err) {
      console.error("Error al registrar:", err);
      return res.status(500).json({ error: "Error en la BD" });
    }
    res.json({ message: "Registro exitoso", id: result.insertId });
  });
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
