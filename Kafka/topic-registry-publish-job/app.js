const schemaRegistryService = require("./schemaRegistryService");
const path = require('path');
const fs = require("fs");
const { promisify } = require("util");
const { verify } = require("crypto");
const args = require('yargs').argv;
const readdir = promisify(require("fs").readdir);

function verifyRequiredArguments(schemaRegistryUrl) {
  if (schemaRegistryUrl) {
    console.log(`schemaRegistryUrl set to ${schemaRegistryUrl}`);
  } else {
    throw new Error(
      'Either the KAFKA_SCHEMA_REGISTRY_URL env var or the "schemaRegistry" argument was not passed in'
    );
  }

  if (args.schemaDirectoryPath) {
    console.log(`schemaDirectoryPath set to ${args.schemaDirectoryPath}`);
  } else {
    throw new Error("schemaDirectoryPath argument was not passed in");
  }
}

async function getSchemasToCheck(schemaDirectoryPath) {
  let schemasToCheck = [];
  let schemaFiles = await readdir(schemaDirectoryPath);

  for (let index = 0; index < schemaFiles.length; index++) {
    const fileName = schemaFiles[index];
    if (!fileName.endsWith(".json")) {
      throw new Error(`All files in the ${schemaDirectoryPath} directory must have the .json file extension. Invalid file: ${JSON.stringify(fileName)}`);
    }
    const rawSchemaData = fs.readFileSync(path.join(schemaDirectoryPath, fileName));
    const subjects = JSON.parse(rawSchemaData);

    schemasToCheck.push(
      {
        topic: path.parse(fileName).name,
        key: subjects.key,
        value: subjects.value
      }
    );
  }

  return schemasToCheck;
}

//MAIN
(async () => {
  console.log("==========PROGRAM START==========\n");

  try {
    console.log(`EXECUTION DIRECTORY:\n${process.cwd()}\n`);
    let schemaRegistryUrl =
      process.env.KAFKA_SCHEMA_REGISTRY_URL || args.schemaRegistryUrl;

    //Setup passed in arguments
    console.log(`\nINCOMING ARGUMENTS:`);
    verifyRequiredArguments(schemaRegistryUrl);

    //Gather all schemas to evaluate
    const schemasToCheck = await getSchemasToCheck(args.schemaDirectoryPath);
    console.log(`\nSCHEMAS TO EVALUATE:\n${schemasToCheck.map(_ => _.topic).join("\n")}`);

    // Check schema compatibility against the registry
    console.log("\nEVALUATING SCHEMA COMPATIBILITY:");
    const allSchemasCompatible = await schemaRegistryService.allSchemasAreCompatible(schemaRegistryUrl, schemasToCheck);
    if (allSchemasCompatible) {
      console.log("ALL SCHEMAS WERE COMPATIBLE > MOVING ONTO THE REGISTRATION STEP\n");
    }
    else {
      console.log("SOME SCHEMAS WERE NOT COMPATIBLE.  REGISTRATION STEP WILL NOT BE EXECUTED.");
      process.exitCode = 1;
    }

    //Register schemas in the registry
    if (allSchemasCompatible) {
      await schemaRegistryService.registerSchemaBatch(schemaRegistryUrl, schemasToCheck);
    }

  } catch (error) {
    console.error("AN ERROR HAS OCCURRED IN THE PROGRAM\n", error.toString());
    process.exitCode = 1;
  }

  console.log("==========PROGRAM END==========");
})();
