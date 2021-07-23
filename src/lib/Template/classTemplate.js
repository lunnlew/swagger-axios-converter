const {
  convertJsType
} = require("../utils/index")
var interfaceTemplate = function (name, props, imports, strictNullChecks = true, comments = '') {
  return `
  ${comments}
  export interface ${name} {
    ${props.map(p => classPropsTemplate(p.name, p.type, null, p.description ? `/**
                     * ${p.description}
                     */
                     `: '', !strictNullChecks, false, false)).join('')}
  }
  `;
}
exports.interfaceTemplate = interfaceTemplate

var classPropsTemplate = function (filedName, type, format, comments = '', canNull, useClassTransformer, isType) {
  type = convertJsType(type, format);
  return `
  ${comments}
  '${filedName}'${canNull ? '?' : ''}:${type};
  `;
}
exports.classPropsTemplate = classPropsTemplate
