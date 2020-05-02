var requestServiceTemplate = function (name, body, comments = '') {
  return `
  ${comments}
  export class ${name} {
    ${body}
  }
  `;
}
exports.requestServiceTemplate = requestServiceTemplate