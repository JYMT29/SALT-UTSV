fetch("https://salt-utsv-production.up.railway.app/alumnos")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
  })
  .catch((error) => console.error("Error al cargar los datos:", error));
