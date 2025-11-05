document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetForm');
    const emailInput = document.getElementById('contacto');
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('repeat-password');
    const resultSpan = document.getElementById('resultado');

    // Lógica principal
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        resultSpan.textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const repeatPassword = repeatPasswordInput.value.trim();

        if (!email || !password || !repeatPassword) {
            resultSpan.textContent = 'Por favor, completa todos los campos.';
            resultSpan.style.color = 'red';
            return;
        }

        if (password !== repeatPassword) {
            resultSpan.textContent = 'Las contraseñas no coinciden.';
            resultSpan.style.color = 'red';
            return;
        }

        try {
            // Llamada directa al endpoint de reseteo
            const response = await fetch('http://localhost:8080/api/resetCliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacto: email, password: password }),
            });

            const data = await response.json();

            if (response.ok && data.response === "OK") {
                resultSpan.textContent = '¡Contraseña actualizada con éxito! Serás redirigido al login.';
                resultSpan.style.color = '#00bfff';
                setTimeout(() => { window.location.href = 'loginClient.html'; }, 3000);
            } else {
                resultSpan.textContent = data.message || 'No se pudo actualizar la contraseña.';
                resultSpan.style.color = 'red';
            }
        } catch (error) {
            console.error('Error en fetch:', error);
            resultSpan.textContent = 'Error de red. Intente nuevamente.';
            resultSpan.style.color = 'red';
        }
    });
});
