const formE1 = document.querySelector('.form');
// Selecciona el formulario usando la clase 'form' definida en el HTML.

//Intercepta el submit del formulario//

formE1.addEventListener('submit', (event) => {
	event.preventDefault();

	/**
	 * Función para mostrar un mensaje temporalmente.
	 * @param {string} elementId - El ID del elemento donde se mostrará el mensaje (ej: 'resultado1').
	 * @param {string} message - El texto del mensaje a mostrar.
	 */
	const mostrarMensajeTemporal = (elementId, message) => {
		const elemento = document.getElementById(elementId);
		if (elemento) {
			// Configura el estilo y el contenido del mensaje
			elemento.style.color = 'RED';
			elemento.style.textAlign = 'center';
			elemento.textContent = message;

			// Programa que el contenido del elemento se borre después de 3000 milisegundos (3 segundos)
			setTimeout(() => {
				elemento.textContent = '';
			}, 6000);
		}
	};

	const formData = new FormData(formE1);
	const data = Object.fromEntries(formData);
	console.log('Application Server: Revisa el valor del form:');
	console.log(data);

	//Realiza validaciones en los datos del formulario antes de procesar

	if (data.contacto == '' || data.password == '') {
		console.log('debe indicar usuario');
		mostrarMensajeTemporal(
			'resultado1',
			'Debe informar usuario y password para completar el acceso'
		);
		return;
	}
	if (data.contacto == 'pec') {
		console.log('pec no es bienvenido en éste sistema');
		mostrarMensajeTemporal(
			'resultado1',
			'El usuario <pec> no es bienvenido en éste sistema'
		);
		return;
	}
	if (data.termscondition != 'on') {
		console.log('no aceptó los T&C no se puede loggear');
		mostrarMensajeTemporal(
			'resultado1',
			'Debe aceptar los T&C para poder usar el sistema'
		);
		return;
	}

	//... (El resto del código de configuración de HTMLResponse, systemURL, RESTAPI, MODE, etc., sigue igual)

	const HTMLResponse = document.querySelector('#app');
	const ul = document.createElement('ul');
	const tpl = document.createDocumentFragment();

	const systemURL = {
		listarTicket: 'listarTicket.html',
		loginCliente: 'loginClient.html',
	};

	const RESTAPI = {
		loginCliente: 'http://localhost:8080/api/loginCliente',
		listarTicket: 'http://localhost:8080/api/listarTicket',
	};

	const MODE = 'LOCAL';

	if (MODE == 'LOCAL') {
		const login = {
			contacto: data.contacto,
			password: data.password,
		};
		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(login),
		};

		console.log('API REST:' + RESTAPI.loginCliente);
		var API = RESTAPI.loginCliente;
		var APIoptions = options;
	}

	if (MODE == 'TYPICODE') {
		console.log('Acceso usando Typicode como application server');
		API =
			'https://my-json-server.typicode.com/lu7did/MesaAyuda/posts/' + data.id;
		APIoptions = { method: 'GET' };
	}

	if (MODE == 'AWS') {
		console.log('Acceso usando AWS lambda como application server');
		API =
			'https://fmtj0jrpp9.execute-api.us-east-1.amazonaws.com/default/loginUserGET?ID=' +
			data.id +
			'&PASSWORD=' +
			data.password;
		APIoptions = { method: 'GET' };
	}


	fetch(`${API}`, APIoptions)
		.then((res) => {
			return res.json();
		})
		.then((users) => {
			console.log(
				'Datos en respuesta del application server=' + JSON.stringify(users)
			);

			if (users.response == 'OK') {
				console.log('La password es correcta');

				window.location.href =
					systemURL.listarTicket +
					'?id=' +
					users.id +
					'&contacto=' +
					users.contacto +
					'&nombre=' +
					users.nombre +
					'&fecha_ultimo_ingreso=' +
					users.fecha_ultimo_ingreso +
					'&mode=' +
					MODE;
			} else {
				console.log('La password no es correcta');
				const mensajeError =
					users.message || 'Error de login, intente nuevamente';
				mostrarMensajeTemporal('resultado', mensajeError);
				document.getElementById('registro-link').style.display = 'table-row';
			}
		})
		.catch((error) => {
			console.error('Error de conexión con el servidor:', error);
			mostrarMensajeTemporal(
				'resultado',
				'Error de red: No se pudo conectar con el servidor.'
			);
			document.getElementById('registro-link').style.display = 'table-row';
		});
});