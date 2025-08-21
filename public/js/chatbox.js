// Función para abrir y cerrar el chat
function toggleChat() {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.classList.toggle("chat-container-open");
}

// Función para manejar el evento de presionar una tecla (enter)
function handleKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

// Función para enviar el mensaje
function sendMessage() {
  const chatInput = document.getElementById("chat-input");
  const chatBox = document.getElementById("chat-box");

  const message = chatInput.value.trim();

  // Verificar si el campo de entrada no está vacío
  if (message !== "") {
    // Crear el mensaje y agregarlo al chat
    const userMessage = document.createElement("div");
    userMessage.classList.add("chat-message");
    userMessage.classList.add("user-message");
    userMessage.textContent = message;
    chatBox.appendChild(userMessage);

    // Desplazar hacia abajo el chat
    chatBox.scrollTop = chatBox.scrollHeight;

    // Limpiar el campo de entrada
    chatInput.value = "";

    // Simular una respuesta del sistema
    setTimeout(() => {
      const systemMessage = document.createElement("div");
      systemMessage.classList.add("chat-message");
      systemMessage.classList.add("system-message");
      systemMessage.textContent = "Recibido: " + message; // Aquí puedes personalizar la respuesta
      chatBox.appendChild(systemMessage);

      // Desplazar hacia abajo el chat después de la respuesta
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
  }
}
