const Ajv = require("ajv");

// 所有 json 文件 type name 数组
const allSchemaNameList = ['User'];

const allSchemaList = allSchemaNameList.map(schemaName => {
  return require(`./test-type/${schemaName}.json`);
});

const ajv = new Ajv({
  allErrors: true,
  schemas: allSchemaList // 所有 json-schema 文件
});

const idPrefix = "http://dp/schemas";

const testSchemaName = "User";

const validate = ajv.getSchema(`${idPrefix}/${testSchemaName}.json`);

var valid = validate({
  a: "a",
});

if (!valid) console.log(validate.errors);
