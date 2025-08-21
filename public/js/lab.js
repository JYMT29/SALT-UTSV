// Función para obtener parámetros de la URL
function obtenerParametro(nombre) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nombre);
}

// Obtener el número de laboratorio
const laboratorio = obtenerParametro("lab");

if (laboratorio) {
  console.log("Usuario accedió al laboratorio:", laboratorio);
  document.getElementById("titulo").innerText =
    "Horario del Laboratorio " + laboratorio;

  // Llamar a la función para registrar en la BD
  registrarAcceso(laboratorio);
}

// Función para enviar el laboratorio a la BD
function registrarAcceso(lab) {
  fetch("/registrar-lab", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ laboratorio: lab }),
  })
    .then((response) => response.json())
    .then((data) => console.log("Registro guardado:", data))
    .catch((error) => console.error("Error al registrar:", error));
}
