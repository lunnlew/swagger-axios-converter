const { InterimApiDefine } = require('../Core/InterimApiDefine')
class Transform {
    toInterimApiDefine(content) {
        if (content.type === 'openapi') {
            return new InterimApiDefine(content)
        } else {
            return new InterimApiDefine(require('./' + content.type + 'ToOpenapi').run(content))
        }
    }
}

exports.Transform = Transform