/*-----------------------------------------------------------------------------------------------------------------
//* MesaAyuda.js debe copiarse al directorio del proyecto express como index.js
//*
//* REST API 
//* UADER - FCyT - Ingenieria de Software I 
//* Caso de estudio MesaAyuda
//*
//* Dr. Pedro E. Colla 2023,2025
 *----------------------------------------------------------------------------------------------------------------*/
//AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1

import express from 'express';
import crypto from 'crypto';
console.log("Comenzando servidor");

// const crypto = require('crypto');
console.log("crypto Ok!");

//const express = require('express');
//console.log("express Ok!");

const app = express();
console.log("express ready!");

const PORT = 8080;

import cors from 'cors';

//const cors = require('cors');
console.log("cors ok!");

app.use(cors());
console.log("CORS ready!");

import AWS from 'aws-sdk'
//var AWS = require('aws-sdk');
console.log("aws-sdk ready!");

// Acquire critical security resources from an external file out of the path //

//const accessKeyId = require('../accessKeyId.js');
//const secretAccessKey = require('../secretAccessKey.js');

import accessKeyId from '../accessKeyId.js';
import secretAccessKey  from '../secretAccessKey.js';

let awsConfig = {
    "region"         : "us-east-1",
    "endpoint"       : "http://dynamodb.us-east-1.amazonaws.com",
    "accessKeyId"    : accessKeyId, 
    "secretAccessKey": secretAccessKey
};

AWS.config.update(awsConfig);
console.log("Servidor listo!");
let docClient = new AWS.DynamoDB.DocumentClient();

/*----
Application server in LISTEN mode
*/

app.listen(
    PORT,
    () => console.log(`Servidor listo en http://localhost:${PORT}`)
);

app.use(express.json());

/*-------------------------------------------------------------------------------------------
                            Funciones y Servicios
 *-------------------------------------------------------------------------------------------*/

/*-----------
función para hacer el parse de un archivo JSON
*/
function jsonParser(keyValue,stringValue) {
    var string = JSON.stringify(stringValue);
    var objectValue = JSON.parse(string);
    return objectValue[keyValue];
}

/*-------------------------------------------------------------------------------------------
                            SERVER API 
 *-------------------------------------------------------------------------------------------*/
/*==*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
                                    *API REST Cliente*
 *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*==*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

app.get('/api/cliente', (req,res) => {
    res.status(200).send({response : "OK", message : "API Ready"});
    console.log("API cliente: OK");
});

//----------------PRIMERA MODIFICACION-----------//
// [/api/loginCliente] Esta API permite acceder a un cliente por ID y comparar la password pasada en un JSON en el cuerpo con la indicada en el DB //  
app.post('/api/loginCliente', (req, res) => {
    const { contacto, password } = req.body; // cambio hecho 1.1: Ahora espera 'contacto' y 'password'

    console.log(`loginCliente: contacto(${contacto})`);

    if (!password) {
        res.status(400).send({ response: "ERROR", message: "Password no informada" });
        return;
    }
    if (!contacto) {
        res.status(400).send({ response: "ERROR", message: "Correo electrónico no informado" });
        return;
    }

    // cambio hecho 1.2: Usa SCAN para buscar por 'contacto', ya no hace GET por ID
    const paramsScan = {
        TableName: "cliente",
        FilterExpression: '#c = :contacto',
        ExpressionAttributeNames: { '#c': 'contacto' },
        ExpressionAttributeValues: { ':contacto': contacto }
    };

    docClient.scan(paramsScan, function (err, data) {
        if (err) {
            console.error("Error en scan:", err);
            res.status(500).send({ response: "ERROR", message: "DB access error" });
        return;
        }

        if (data.Items && data.Items.length > 0) {
            const sanitized = data.Items.map(item => ({
                ...item,
            password: 'CENSURADO' // reemplaza la password real
            }));
        console.log("Scan data:", sanitized);
        } else {
            console.log("Scan data: vacío");
        }       



        if (!data.Items || data.Items.length === 0) {
            res.status(400).send({ response: "ERROR", message: "Cliente no encontrado, por favor registrese" });
            return;
        }

        const cliente = data.Items[0];
        const paswd = cliente.password;
        const activo = cliente.activo;
        const id = cliente.id;

        if (password === paswd) {
            if (activo) {
                res.status(200).send({
                    response: "OK",
                    id: id,
                    nombre: cliente.nombre,
                    contacto: cliente.contacto,
                    fecha_ultimo_ingreso: cliente.fecha_ultimo_ingreso
                });
            } else {
                res.status(400).send({ response: "ERROR", message: "Cliente no activo" });
            }
        } else {
        res.status(400).send({ response: "ERROR", message: "Contraseña incorrecta", id: id });
        }
    });
});
//------------------TERMINA PRIMERA MODIFICACION-----------------//

// [/api/getCliente] Esta API permite acceder a un cliente dado su id //
app.post('/api/getCliente/:id', (req,res) => {
    const { id } = req.params;
    console.log("getCliente: id("+id+")");
    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            }
        };
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
        } else {

            if (Object.keys(data).length != 0) {
            res.status(200).send(JSON.stringify({"response":"OK","cliente" : data.Item}),null,2);
            } else {
            res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
            }
        }    
    })


} );


// ----------------SEGUNDA MODIFICACION---------------//
// Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB) //
async function scanDb(contacto) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=contacto;
    const paramsScan = { // ScanInput
      TableName: "cliente", // required
    Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
    // <-- cambio hecho 2: Corrige el filtro para buscar por 'contacto'
    FilterExpression : 'contacto = :contacto', 
    ExpressionAttributeValues : {':contacto' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
        return data.Items 
    });  
    return objectPromise;
}
//----------------TERMINA SEGUNDA MODIFICACION-----------------//

//----------------TERCERA MODIFICACION----------------------//
//addCliente Revisa si el contacto (e-mail) existe y en caso que no da de alta el cliente generando un id al azar //
app.post('/api/addCliente', (req, res) => {
    // cambio hecho 3.1: Solo necesita 'contacto' y 'password' (el nombre se infiere)
    const { contacto, password } = req.body; 
    console.log("addCliente: contacto(" + contacto + ")");

    if (!password) {
        res.status(400).send({ response: "ERROR", message: "Password no informada" });
        return;
    }

    if (!contacto) {
        res.status(400).send({ response: "ERROR", message: "Contacto no informado" });
        return;
    }
    
    // cambio hecho 3.2: Lógica de validación de unicidad previa al PUT //
    // 1. se verifica si el correo ya se usa, mediante scanDb //
    scanDb(contacto)
        .then(resultDb => {
            if (resultDb.length > 0) {
                // Si el array de resultados tiene elementos, el contacto ya existe.
                res.status(400).send({ response: "ERROR", message: "Correo ya existente" });
                return;
            }

            // 2. si el usuario no existe, sigue con el registro //
            var hoy = new Date();
            var dd = String(hoy.getDate()).padStart(2, '0');
            var mm = String(hoy.getMonth() + 1).padStart(2, '0');
            var yyyy = hoy.getFullYear();
            hoy = dd + '/' + mm + '/' + yyyy;

            const newCliente = {
                // <-- cambio hecho 3.3: Usa UUID para la clave primaria 'id'
                id: crypto.randomUUID(), 
                contacto: contacto,
                nombre: contacto, // Asigna el contacto como nombre inicial
                password: password,
                activo: true,
                registrado: true,
                primer_ingreso: false,
                fecha_alta: hoy,
                fecha_cambio_password: hoy,
                fecha_ultimo_ingreso: hoy,
            };

            const paramsPut = {
                TableName: "cliente",
                Item: newCliente,
                // <-- cambio hecho 3.4: Elimina ConditionExpression (la validación ya se hizo con scanDb)
            };
            
            docClient.put(paramsPut, function (err, data) {
                if (err) {
                    // Aquí manejamos otros errores de escritura (no de unicidad)
                    console.error("Error al guardar en DB:", err.message);
                    res.status(500).send({ response: "ERROR", message: "DB error al guardar: " + err.message });
                } else {
                    res.status(200).send({ response: "OK", "cliente": newCliente });
                }
            });

        })
        .catch(err => {
            console.error("Error en scanDb:", err);
            res.status(500).send({ response: "ERROR", message: "Error interno al verificar el cliente." });
        });
});
// ---------------------TERMINA TERCERA MODIFICACION----------------------//

// [/api/updateCliente] Permite actualizar datos del cliente contacto, nombre, estado de activo y registrado//
app.post('/api/updateCliente', (req,res) => {
    
    const {id} = req.body;
    const {nombre}   = req.body; 
    const {password} = req.body;

    var activo = ((req.body.activo+'').toLowerCase() === 'true')
    var registrado = ((req.body.registrado+'').toLowerCase() === 'true')

    console.log("updateCliente: id("+id+") nombre("+nombre+")activo("+activo+") registrado("+registrado+")");

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!nombre) {
        res.status(400).send({response : "ERROR" , message: "Nombre no informado"});
        return;
    }

    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informado"});
        return;
    }

    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 

                    ExpressionAttributeNames: { 
                        "#a": "activo", 
                        "#n": "nombre",
                        "#p": "password",
                        "#r": "registrado"

                    }, 
                    ExpressionAttributeValues: { 
                        ":a": activo , 
                        ":p": password,
                        ":n": nombre , 
                        ":r": registrado 
                }, 
                Key: { 
                    "id": id 
                }, 
                ReturnValues: "ALL_NEW", 
                TableName: "cliente", 
                UpdateExpression: "SET #n = :n, #p = :p, #a = :a, #r = :r" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": data}));
                    }    
                });    
            }
        }    
    })


});
/*-------
/api/resetCliente
Permite cambiar la password de un cliente
*/
app.post('/api/resetCliente', (req, res) => {
    const { id, password, contacto } = req.body;

    // Validaciones básicas
    if (!id && !contacto) {
        res.status(400).send({ response: "ERROR", message: "Debe informar id o contacto" });
        return;
    }
    if (!password) {
        res.status(400).send({ response: "ERROR", message: "Password no informada" });
        return;
    }

    // Si vino el contacto (email), buscamos el cliente por email
    const buscarPorCorreo = (callback) => {
        const params = {
            TableName: "cliente",
            FilterExpression: "contacto = :c",
            ExpressionAttributeValues: { ":c": contacto }
        };

        docClient.scan(params, (err, data) => {
            if (err) {
                res.status(500).send({ response: "ERROR", message: "DB access error: " + err });
                return;
            }
            if (!data.Items || data.Items.length === 0) {
                res.status(404).send({ response: "ERROR", message: "Cliente no encontrado con ese correo." });
                return;
            }
            callback(data.Items[0].id);
        });
    };

    const actualizarPassword = (userId) => {
        const paramsUpdate = {
            TableName: "cliente",
            Key: { id: userId },
            ExpressionAttributeNames: { "#p": "password" },
            ExpressionAttributeValues: { ":p": password },
            UpdateExpression: "SET #p = :p",
            ReturnValues: "ALL_NEW"
        };

        docClient.update(paramsUpdate, (err, data) => {
            if (err) {
                res.status(500).send({ response: "ERROR", message: "DB access error: " + err });
            } else {
                res.status(200).send({ response: "OK", message: "Contraseña actualizada correctamente." });
            }
        });
    };

    // Si vino un id, actualizamos directamente. Si vino un correo, primero lo buscamos.
    if (id) {
        actualizarPassword(id);
    } else {
        buscarPorCorreo(actualizarPassword);
    }
});

/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
/* API REST ticket                                                             *
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

/*---------
Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB)
*/
async function scanDbTicket(clienteID) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=clienteID;
    const paramsScan = { // ScanInput
      TableName: "ticket", // required
    Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
    FilterExpression : 'clienteID = :clienteID',
    ExpressionAttributeValues : {':clienteID' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
        return data.Items 
    });  
    return objectPromise;
}
/*----------
listarTicket
API REST para obtener todos los tickets de un clienteID
*/  
app.post('/api/listarTicket', (req,res) => {

    const {ID}  = req.body;
    console.log("listarTicket: ID("+ID+")");

    if (!ID) {
        res.status(400).send({response : "ERROR" , message: "ID cliente  no informada"});
        return;
    }

    scanDbTicket(ID)
    .then(resultDb => {
    if (Object.keys(resultDb).length == 0) {
        res.status(400).send({response : "ERROR" , message : "clienteID no tiene tickets"});
        return;
    } else {
        res.status(200).send(JSON.stringify({response : "OK",  "data": resultDb}));
    }

    });

});

/*---------
getTicket
API REST para obtener los detalles de un ticket
*/
app.post('/api/getTicket', (req,res) => {
    const {id}  = req.body;
    console.log("getTicket: id("+id+")");

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "ticket id no informada"});
        return;
    }
    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //"clienteID": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            //"id"       : "e08905a8-4aab-45bf-9948-4ba2b8602ced"
        }
    };
    docClient.get(params, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
        }
        else {
            if (Object.keys(data).length == 0) {
                res.status(400).send({response : "ERROR" , message : "ticket invalido"});
            } else {
                res.status(200).send(JSON.stringify({response : "OK", "data" : data}));    
            }    
        }
    })
});

/*-----------------
/api/addTicket
API REST para agregar ticket (genera id)
*/
app.post('/api/addTicket', (req,res) => {

    const {clienteID} = req.body;
    const estado_solucion = 1;
    const {solucion} = req.body;
    const {descripcion} = req.body;

    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const newTicket = {
    id                    : crypto.randomUUID(),
    clienteID             : clienteID,
    estado_solucion       : estado_solucion,
    solucion              : solucion,
    descripcion           : descripcion,
    fecha_apertura        : hoy,
    ultimo_contacto       : hoy
    };

    const paramsPut = {
    TableName: "ticket",
    Item: newTicket,
    ConditionExpression:'attribute_not_exists(id)',
    };

    docClient.put(paramsPut, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
        } else {
            res.status(200).send(JSON.stringify({response : "OK", "ticket": newTicket}));
        }
    });
}
)

/*--------
/api/updateTicket
Dado un id actualiza el ticket, debe informarse la totalidad del ticket excepto ultimo_contacto
*/
app.post('/api/updateTicket', (req,res) => {

    const {id} = req.body;
    const {clienteID} = req.body;
    const {estado_solucion} = req.body;
    const {solucion} = req.body;
    const {descripcion} = req.body;
    const {fecha_apertura} = req.body;

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!clienteID) {
        res.status(400).send({response : "ERROR" , message: "clienteID no informada"});
        return;
    }

    if (!estado_solucion) {
        res.status(400).send({response : "ERROR" , message: "estado_solucion no informada"});
        return;
    }

    if (!solucion) {
        res.status(400).send({response : "ERROR" , message: "solucion no informado"});
        return;
    }

    if (!fecha_apertura) {
        res.status(400).send({response : "ERROR" , message: "fecha apertura"});
        return;
    }
    
    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const ultimo_contacto = hoy;

    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "ticket no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 

                    ExpressionAttributeNames: { 
                        "#c": "clienteID", 
                        "#e": "estado_solucion",
                        "#s": "solucion",
                        "#a": "fecha_apertura",
                        "#u": "ultimo_contacto",
                        "#d": "descripcion"
                    }, 
                    ExpressionAttributeValues: { 
                        ":c":  clienteID, 
                        ":e":  estado_solucion , 
                        ":s":  solucion , 
                        ":a":  fecha_apertura,
                        ":u":  ultimo_contacto,
                        ":d":  descripcion 
                }, 
                Key: { 
                    "id": id 
                }, 
                ReturnValues: "ALL_NEW", 
                TableName: "ticket", 
                UpdateExpression: "SET #c = :c, #e = :e, #a = :a, #s = :s, #d = :d, #u = :u" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK",  "data": data}));
                    }    
                });    
            }
        }    
    })

});
/*-------------------------------------------------[ Fin del API REST ]-------------------------------------------------------------*/