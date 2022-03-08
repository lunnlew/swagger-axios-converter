const fs = require('fs')
const path = require('path')
const template = require('art-template');
template.defaults.imports.toResponseTypeByName = function (responses, name) { return responses.find(r => r.name === name)?.type || 'any' };
template.defaults.imports.notEmpty = function (params) { return params.length > 0 };
template.defaults.imports.toPlaceholder = function (name) {
    return `{${name}}`
}
const CodeTpl = function (tpl) {
    return {
        render: (data = {}) => {
            return template.compile({
                filename: tpl + '.art',
                root: path.join(__dirname, '/tpl/')
            })(data)
        }
    }
}
exports.CodeTpl = CodeTpl