// Función para obtener el valor de un parámetro de la URL
function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Espera a que el DOM se cargue completamente
document.addEventListener("DOMContentLoaded", function () {
  // Obtén el valor del parámetro "lab" en la URL
  const lab = getURLParameter("lab");

  // Si el valor es "lab2", cambia el texto
  if (lab === "lab2") {
    console.log("Estamos en lab2, cambiando el texto...");
    document.getElementById("ubicacion").textContent = "Planta Alta";
  } else {
    console.log("No estamos en lab2, el texto permanece igual.");
  }
});
