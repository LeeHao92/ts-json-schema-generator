import * as Ajv from "ajv";
import { assert } from "chai";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as ts from "typescript";
import { createFormatter } from "../factory/formatter";
import { createParser } from "../factory/parser";
import { createProgram } from "../factory/program";
import { Config } from "../src/Config";
import { SchemaGenerator } from "../src/SchemaGenerator";

const validator = new Ajv();
const metaSchema: object = require("ajv/lib/refs/json-schema-draft-06.json");
validator.addMetaSchema(metaSchema);

const basePath = "test/valid-data";

export type Run = (
    expectation: string,
    callback?: ((this: Mocha.ITestCallbackContext, done: MochaDone) => any) | undefined,
) => Mocha.ITest;

function assertSchema(name: string, type: string, only: boolean = false): void {
    const run: Run = only ? it.only : it;
    run(name, () => {
        const config: Config = {
            path: resolve(`${basePath}/${name}/*.ts`),
            type: type,

            expose: "export",
            topRef: true,
            jsDoc: "none",
        };

        const program: ts.Program = createProgram(config);
        const generator: SchemaGenerator = new SchemaGenerator(
            program,
            createParser(program, config),
            createFormatter(config),
        );

        const schema = generator.createSchema(type);


    });
}

describe("valid-data", () => {
    assertSchema("simple-object", "SimpleObject");
});
