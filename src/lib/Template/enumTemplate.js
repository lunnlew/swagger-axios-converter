var enumTemplate = function (name, enumString, prefix, comments = '') {
  return `
  ${comments}
  export enum ${name}{
    ${enumString}
  }
  `;
}
exports.enumTemplate = enumTemplate
