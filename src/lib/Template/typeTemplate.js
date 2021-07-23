var typeTemplate = function (name, typeString, prefix, comments = '') {
  return `
  ${comments}
  export type ${name} = ${typeString};
  `;
}
exports.typeTemplate = typeTemplate
