const fs = require('fs')
const path = require('path')
const readTpl = function (type) {
    return fs.readFileSync(path.join(__dirname, '/tpl/', type + '.art'), {
        encoding: 'utf8'
    })
}
const CodeTpl = function (options) {
    return {
        api_tpl: readTpl('class'),
        IRequest_tpl: readTpl('IRequest'),
        IRequestImport_tpl: readTpl('IRequestImport'),
        model_tpl: readTpl('model'),
        enum_tpl: readTpl('enum')
    }
}
exports.CodeTpl = CodeTpl