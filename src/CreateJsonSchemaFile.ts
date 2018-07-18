import { writeFileSync, readdirSync, unlinkSync } from "fs";
import { resolve } from "path";
import * as ts from "typescript";
import { createFormatter } from "../factory/formatter";
import { createParser } from "../factory/parser";
import { createProgram } from "../factory/program";
import { Config } from "../src/Config";
import { SchemaGenerator } from "../src/SchemaGenerator";

export interface CreateJsonSchemaConfig extends Config {
    path: string; // 配置文件
    idPrefix: string; // 生成 json schema $id 前缀
    externalRefList: string[]; // 外部引入 ref
    validTypeList: string[]; // 校验的类型
    writeDirPath: string; // json 文件，写入的 dir
}

export const createJsonSchemaFile = (
    createJsonSchemaConfig: CreateJsonSchemaConfig
) => {
    const {
        idPrefix,
        externalRefList,
        validTypeList,
        writeDirPath
    } = createJsonSchemaConfig;

    // 清空所有 json schema 文件
    readdirSync(writeDirPath).forEach(function(path) {
        unlinkSync(`${writeDirPath}/${path}`);
    });

    const program: ts.Program = createProgram(createJsonSchemaConfig);

    const generator: SchemaGenerator = new SchemaGenerator(
        program,
        createParser(program, createJsonSchemaConfig),
        createFormatter(createJsonSchemaConfig, externalRefList)
    );

    function createSchema(list: string[]) {
        list.forEach((typeName: string) => {
            const schema = generator.createSchema(
                typeName,
                `${idPrefix}/${typeName}.json`,
                externalRefList
            );

            writeFileSync(
                resolve(`${writeDirPath}/${typeName}.json`),
                JSON.stringify(schema)
            );
        });
    }

    createSchema(externalRefList.concat(validTypeList));
};
