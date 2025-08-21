document.addEventListener("DOMContentLoaded", function () {
  fetch("get_user_role.php") // Llamamos a un archivo PHP para obtener el rol
    .then((response) => response.json())
    .then((data) => {
      if (data.rol === "admin") {
        document.getElementById("adminPanel").style.display = "block";
      } else if (data.rol === "usuario") {
        document.getElementById("userPanel").style.display = "block";
      }
    })
    .catch((error) => console.error("Error obteniendo el rol:", error));
});
