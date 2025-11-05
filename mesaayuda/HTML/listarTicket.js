
/*---
Función para procesar los parámetros recibidos en el URL
*/
function getQueryParams(qs) {
    qs = qs.split('+').join(' ');
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
}

/*---
Extrae los datos del usuario del URL y los muestra en la sección de información
*/
console.log("Comienza listarTicket.js");

const query = getQueryParams(document.location.search);
console.log("id:", query.id);
console.log("nombre:", query.nombre);
console.log("contacto:", query.contacto);
console.log("ultima_fecha:", query.fecha_ultimo_ingreso);
console.log("mode:", query.mode);

// --- MODIFICACIÓN CLAVE ---
// Rellenamos los campos de la nueva tabla con los datos del usuario
document.getElementById("nombre-usuario").textContent = query.nombre || 'No disponible';
document.getElementById("email-usuario").textContent = query.contacto || 'No disponible';
document.getElementById("contacto-usuario").textContent = query.contacto || 'No disponible'; // Asumiendo que contacto y email son el mismo
document.getElementById("ultimo-ingreso-usuario").textContent = query.fecha_ultimo_ingreso || 'No disponible';
// --- FIN DE LA MODIFICACIÓN ---


const RESTAPI = {
    listarTicket: "http://localhost:8080/api/listarTicket",
};

const HTMLResponse = document.querySelector("#app");
let ticket = { "ID": query.id };
let options = { method: 'GET' };
let APIREST_URL = '';

console.log('transferred mode:' + query.mode);

switch (query.mode) {
    case "LOCAL":
        console.log("Utiliza servidor NodeJS local.");
        ticket = { "ID": query.id };
        options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket),
        };
        APIREST_URL = RESTAPI.listarTicket;
        break;
    case "TYPICODE":
        console.log("Typicode no soportado en ésta función");
        APIREST_URL = 'https://my-json-server.typicode.com/lu7did/mesaayuda/posts/' + query.id;
        break;
    case "AWS":
        console.log("Utiliza AWS como serverless");
        APIREST_URL = 'https://n3ttz410ze.execute-api.us-east-1.amazonaws.com/default/listTicketGET?ID=' + query.id;
        break;
    default:
        console.log("Modo no reconocido, asumiendo AWS.");
        APIREST_URL = 'https://n3ttz410ze.execute-api.us-east-1.amazonaws.com/default/listTicketGET?ID=' + query.id;
}

console.log("APIREST_URL:" + APIREST_URL);
console.log("ticket  :" + JSON.stringify(ticket));
console.log("options :" + JSON.stringify(options));

fetch(APIREST_URL, options)
    .then(res => {
        if (!res.ok) {
            // Si la respuesta no es OK, leemos el texto del error
            return res.text().then(text => { throw new Error(text) });
        }
        return res.json();
    })
    .then(response => {
        console.log("Respuesta de la API:", response);
        
        // El array de tickets está dentro de la propiedad "data"
        const tickets = response.data;
        
        if (!tickets || tickets.length === 0) {
            document.getElementById('mensajes').style.color = "RED";
            document.getElementById("mensajes").innerHTML = "No hay tickets pendientes";
            return;
        }

        let table = document.createElement("table");
        table.className = 'tickets-table'; // Clase para aplicar estilos
        
        // Crear encabezado de la tabla
        const headers = ["ID Ticket", "Motivo", "Estado", "Fecha"];
        let headerRow = document.createElement("tr");
        headers.forEach(headerText => {
            let th = document.createElement("th");
            th.innerText = headerText;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Llenar filas con datos de los tickets
        tickets.forEach(t => {
            let tr = document.createElement("tr");
            
            // Usamos las propiedades correctas del objeto ticket
            const cells = [t.id, t.descripcion, t.estado_solucion, t.ultimo_contacto];
            
            cells.forEach(cellText => {
                let td = document.createElement("td");
                td.innerText = cellText;
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });

        HTMLResponse.appendChild(table);
    })
    .catch(error => {
        console.error("Error al obtener tickets:", error);
        document.getElementById('mensajes').style.textAlign = "center";
        document.getElementById('mensajes').style.color = "RED";
        document.getElementById("mensajes").innerHTML = "Sin tickets pendientes";
    });