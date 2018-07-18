import { resolve } from "path";
import {
    createJsonSchemaFile,
    CreateJsonSchemaConfig
} from "../src/CreateJsonSchemaFile";

describe("valid-data", () => {
    it("demo", () => {
        const config: CreateJsonSchemaConfig = {
            path: resolve(`test/test-type/*.ts`), // 配置文件
            expose: "all", // Create shared $ref definitions for all types.
            topRef: false, // 是否包裹根节点
            jsDoc: "none",
            idPrefix: "http://dp/schemas", // 生成 json schema $id 前缀
            externalRefList: ["Id", "Name"], // 外部引入 ref
            validTypeList: ["User"], // 校验的类型
            writeDirPath: resolve("test/test-type/json") // 写入 dir
        };

        createJsonSchemaFile(config);
    });
});
