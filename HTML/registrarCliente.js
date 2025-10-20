const formE1 = document.querySelector('.form');

formE1.addEventListener('submit', (event) => {
event.preventDefault();
const formData = new FormData(formE1);
const data = Object.fromEntries(formData);
const displayMessage = document.getElementById('resultado1');

// --- Validaciones del formulario (sin el campo nombre) ---
if (!data.contacto || !data.password) {
    displayMessage.style.color = 'RED';
    displayMessage.textContent = 'El Email y la Contraseña son obligatorios.';
    return;
}

if (data.termscondition !== 'on') {
    displayMessage.style.color = 'RED';
    displayMessage.textContent = 'Debe aceptar los términos y condiciones.';
    return;
}

// --- Preparar datos para enviar a la API (sin el campo nombre) ---
const newUser = {
    contacto: data.contacto,
    password: data.password
};

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
    };
    
    // --- Llamada a la API del backend ---
    const API_URL = 'http://localhost:8080/api/addCliente';

    fetch(API_URL, options)
        .then(res => {
            // Es importante verificar si la respuesta fue exitosa (status 200) o no
            if (!res.ok) {
                // Si no fue exitosa, lee el JSON del error para obtener el mensaje
                return res.json().then(errorInfo => {
                    throw new Error(errorInfo.message);
                });
            }
            return res.json();
        })
        .then(response => {
            console.log(response);
            if (response.response === 'OK') {
                // Si el registro es exitoso y el status del JSON es OK
                alert('¡Registro exitoso! Ahora serás redirigido a la pantalla de login.');
                window.location.href = 'loginClient.html'; // Redirige al login
            } else if (response.response === 'ERROR') {
                 // Si el status del JSON es ERROR, forzamos el catch para mostrar el mensaje
                 throw new Error(response.message || 'Error desconocido del servidor.');
            }
        })
        .catch(err => {
            // El bloque catch ahora recibirá el mensaje de error específico del backend
            console.error('Error en el registro:', err.message);
            displayMessage.style.color = 'RED';
            displayMessage.textContent = err.message || 'No se pudo conectar con el servidor.';
        });
});
// mostrar password
const passwordInput = document.getElementById('password');
const showPassword = document.getElementById('showPassword');
if (passwordInput && showPassword) {
	showPassword.addEventListener('change', () => {
		passwordInput.type = showPassword.checked ? 'text' : 'password';
	});
}