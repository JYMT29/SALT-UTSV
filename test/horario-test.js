

fetch('http://localhost:3001/alumnos')
        .then(response => response.json())
        .then(data => {
            console.log(data);

        })
        .catch(error => console.error('Error al cargar los datos:', error));