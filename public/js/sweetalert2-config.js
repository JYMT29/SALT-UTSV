// Función para mostrar la alerta con SweetAlert2
const mostrarAlerta = async (datos) => {
    const { matricula, nombre, carrera, urlImagen } = datos;
  
    try {
      await Swal.fire({
        title: 'Información del Código QR',
        text: `Matrícula: ${matricula}\nNombre: ${nombre}\nCarrera: ${carrera}`,
        imageUrl: urlImagen,
        imageAlt: 'Imagen del código QR',
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'mi-clase-popup',
          title: 'mi-clase-titulo',
          htmlContainer: 'mi-clase-contenido',
          confirmButton: 'mi-clase-boton-confirmar'
        },
        didOpen: () => {
          const img = Swal.getImage();
          img.onerror = () => {
            console.error('Error al cargar la imagen:', urlImagen);
            Swal.showValidationMessage(`No se pudo cargar la imagen: ${urlImagen}`);
          };
        }
      });
    } catch (error) {
      console.error('Error al mostrar la alerta:', error);
      Swal.fire('Error', 'No se pudo mostrar la alerta.', 'error');
    }
  };
  