const fs = require("fs");
const axios = require("axios");
const { promisify } = require("util");

axios.interceptors.request.use(req => {
    console.log(`HTTP REQUEST: ${req.method} | ${req.url}`);
    return req;
});

axios.interceptors.response.use(res => {
    console.log(`HTTP RESPONSE: ${res.status} | ${res.statusText}`);
    return res;
});

async function printAllSubjects(schemaRegsitryUrl) {

    let res = await axios.get(`${schemaRegsitryUrl}/subjects`);
    let subjects = res.data;
    console.log(`ALL SUBJECTS: ${JSON.stringify(subjects)}`)
}

// async function isSubjectCreated(schemaRegistryUrl, topic){
//     try {
//         let res = await axios.get(`${schemaRegistryUrl}/subjects/${topic}-value/versions/latest`);
//         return res.data.is_compatible;
//     } catch (e) {
//         if(e.response.status === 404){
//             //create subject
//             return;
//         }
//         console.log(`Error checking schema compatibility. Details: ${JSON.stringify(e.response.data)}`)
//         return false;
//     }
// }

async function isSchemaCompatible(schemaRegistryUrl, subject, schema) {
    const headers = {
        headers:
        {
            "Content-Type": "application/vnd.schemaregistry.v1+json"
        }
    };
    const body = {
        "schema": JSON.stringify(schema)
    };

    try {
        let res = await axios.post(`${schemaRegistryUrl}/compatibility/subjects/${subject}/versions/latest`, body, headers);
        return res.data.is_compatible;
    } catch (e) {
        if (e.response.status === 404) {
            //schema was not found since it has not been created yet
            return true;
        }
        console.log(`Error checking schema compatibility. Details: ${JSON.stringify(e.response.data)}`)
        return false;
    }
}

async function allSchemasAreCompatible(schemaRegistryUrl, schemasToCheck) {
    let allSchemasCompatible = true;

    for (let index = 0; index < schemasToCheck.length; index++) {
        const schemaToCheck = schemasToCheck[index];
        if (!schemaToCheck.key || !schemaToCheck.value) {
            throw new Error(`Schema file must contain both a key and a value schema to be valid... Please update this schema file: ${schemaToCheck.topic}`);
        }
        const isKeyCompatible = await isSchemaCompatible(schemaRegistryUrl, schemaToCheck.topic + "-key", schemaToCheck.key);
        const isValueCompatible = await isSchemaCompatible(schemaRegistryUrl, schemaToCheck.topic + "-value", schemaToCheck.value);
        const isCompatible = isKeyCompatible && isValueCompatible;

        console.log(`${schemaToCheck.topic} is ${isCompatible ? "COMPATIBLE" : "NOT COMPATIBLE"}\n`);

        if (!isCompatible) {
            allSchemasCompatible = false;
        }
    }

    return allSchemasCompatible;
}

async function registerSchema(schemaRegistryUrl, topic, schema, subjectType) {
    const headers = {
        headers:
        {
            "Content-Type": "application/vnd.schemaregistry.v1+json"
        }
    };
    const body = {
        "schema": JSON.stringify(schema)
    };

    try {
        let res = await axios.post(`${schemaRegistryUrl}/subjects/${topic}-${subjectType}/versions`, body, headers);
        console.log(`Schema registration for ${topic} subject of ${topic}-${subjectType} was successful. Details: ${JSON.stringify(res.data)}\n`)
    } catch (e) {
        console.log(`Error registering schema. Details: ${JSON.stringify(e.response.data)}`)
    }

}

async function registerSchemaBatch(schemaRegistryUrl, schemasToRegister) {
    console.log("REGISTERING SCHEMAS:");
    for (let index = 0; index < schemasToRegister.length; index++) {
        const schemaToRegister = schemasToRegister[index];
        await registerSchema(schemaRegistryUrl, schemaToRegister.topic, schemaToRegister.key, "key")
        await registerSchema(schemaRegistryUrl, schemaToRegister.topic, schemaToRegister.value, "value")
    }
}

module.exports = {
    printAllSubjects: printAllSubjects,
    registerSchema: registerSchema,
    registerSchemaBatch: registerSchemaBatch,
    allSchemasAreCompatible: allSchemasAreCompatible
}