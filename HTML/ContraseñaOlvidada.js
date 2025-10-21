document.addEventListener('DOMContentLoaded', () => {
    // Variable global para guardar el ID del usuario cuando lo encontremos
    let userId = null;

    // --- Selectores de elementos ---
    const form = document.querySelector('.form');
    const paso1Div = document.getElementById('paso1-email');
    const paso2Div = document.getElementById('paso2-password');
    
    const emailInput = document.getElementById('contacto');
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('repeat-password');
    
    const buscarBtn = document.getElementById('btn-buscar');
    const cambiarBtn = document.getElementById('btn-cambiar');
    const resultSpan = document.getElementById('resultado');

    // --- Lógica para el Paso 1: Buscar por Email ---
    buscarBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        resultSpan.textContent = ''; // Limpiar mensajes

        if (!email) {
            resultSpan.style.color = 'red';
            resultSpan.textContent = 'Por favor, ingresa un correo electrónico.';
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/loginCliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacto: email, password: 'dummy_password' })
            });
            
            // Lee la respuesta JSON sin importar el status de la respuesta
            const data = await response.json();

            if (data.id) {
                // ¡ÉXITO! Se encontró un ID, sea por login correcto o incorrecto.
                userId = data.id; // Guardamos el ID del usuario
                resultSpan.textContent = '';
                
                // Ocultamos el paso 1 y mostramos el paso 2
                paso1Div.style.display = 'none';
                paso2Div.style.display = 'block';

            } else if (data.message === "Cliente no encontrado, por favor registrese") {
                // El usuario realmente no existe
                resultSpan.style.color = 'red';
                resultSpan.textContent = 'No se encontró una cuenta con ese correo electrónico.';
                
            } else {
                // Otro tipo de error
                resultSpan.style.color = 'red';
                resultSpan.textContent = data.message || 'Ocurrió un error inesperado.';
            }

        } catch (error) {
            console.error('Error en fetch:', error);
            resultSpan.style.color = 'red';
            resultSpan.textContent = 'Error de red. No se pudo conectar al servidor.';
        }
    });

    // --- Lógica para el Paso 2: Cambiar la Contraseña ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevenimos el envío del formulario
        const password = passwordInput.value;
        const repeatPassword = repeatPasswordInput.value;
        resultSpan.textContent = ''; // Limpiar mensajes

        if (password !== repeatPassword) {
            resultSpan.textContent = 'Error: Las contraseñas no coinciden.';
            resultSpan.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/resetCliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, password: password }),
            });
            const data = await response.json();

            if (response.ok && data.response === "OK") {
                resultSpan.textContent = '¡Contraseña actualizada! Serás redirigido al login.';
                resultSpan.style.color = '#00bfff';
                setTimeout(() => { window.location.href = 'loginClient.html'; }, 3000);
            } else {
                resultSpan.textContent = `Error: ${data.message || 'No se pudo actualizar.'}`;
                resultSpan.style.color = 'red';
            }
        } catch (error) {
            console.error('Error en fetch:', error);
            resultSpan.textContent = 'Error de red. Por favor, intente de nuevo.';
            resultSpan.style.color = 'red';
        }
    });

    // --- Funcionalidad para mostrar/ocultar contraseñas ---
    const showPasswordCheckbox1 = document.getElementById('showPassword1');
    const showPasswordCheckbox2 = document.getElementById('showPassword2');
    showPasswordCheckbox1.addEventListener('change', () => {
        passwordInput.type = showPasswordCheckbox1.checked ? 'text' : 'password';
    });
    showPasswordCheckbox2.addEventListener('change', () =>  {
        repeatPasswordInput.type = showPasswordCheckbox2.checked ? 'text' : 'password';
    });
});