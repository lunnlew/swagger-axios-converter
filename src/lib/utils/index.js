const { default: camelcase } = require("camelcase")
// 替换特殊字符为下划线
var replaceSpecsToUnderline = function (str) {
    if (str === null || str === undefined) {
        return str
    }
    return str.replace(/[`~!@#$%^&*()+<>«»?:"{},.\/;'[\]]/g, '_')
}
exports.replaceSpecsToUnderline = replaceSpecsToUnderline

// 去除首尾指定字符
var trimString = function (str, char, type) {
    str = (str !== null && str !== void 0 ? str : '');
    if (char) {
        if (type == 'left') {
            return str.replace(new RegExp('^\\' + char + '+', 'g'), '');
        }
        else if (type == 'right') {
            return str.replace(new RegExp('\\' + char + '+$', 'g'), '');
        }
        return str.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
    }
    return str.replace(/^\s+|\s+$/g, '');
}
exports.trimString = trimString

// 是否泛型
var isGenerics = (s) => {
    return /^.+\<.+\>$/.test(s);
}
exports.isGenerics = isGenerics

// 获得类名称
var genClassNameFromTags = function (originTags) {
    return camelcase(originTags.length ? replaceSpecsToUnderline(originTags[0]) : 'Common', { pascalCase: true })
}
exports.genClassNameFromTags = genClassNameFromTags

// 获得方法名称
var getMethodNameFromPath = function (path) {
    const paths = path.split('/');
    for (let i = paths.length - 1; i >= 0; i--) {
        if (/\{.+\}/.test(paths[i]) === false) {
            return camelcase(paths[i], { pascalCase: true })
        }
    }
    return '';
}
exports.getMethodNameFromPath = getMethodNameFromPath

// 规范化引用名称
var genRefName = function (ref) {
    var refName = ref.slice(ref.lastIndexOf('/') + 1)
    var str = ''
    if (/^.+\[.+\]$/.test(refName) || /^.+\«.+\»$/.test(refName) || /^.+\<.+\>$/.test(refName)) {
        str = trimString(replaceSpecsToUnderline(refName), '_', 'right');
    } else {
        str = convertJsType(refName)
    }
    return camelcase(str, { pascalCase: true })
}
exports.genRefName = genRefName

// 统一到TS类型表示
var convertJsType = function (refName, format) {
    if (refName === undefined || refName === null || refName.length === 0) {
        return 'any | null'
    }
    var result = ''
    var s = refName.toLowerCase()
    switch (s) {
        case 'bool':
        case 'boolean':
            result = 'boolean';
            break;
        case 'array':
            result = '[]';
            break;
        case 'Int64':
        case 'Int32':
        case 'int':
        case 'integer':
        case 'number':
            result = 'number';
            break;
        case 'guid':
        case 'string':
        case 'uuid':
            switch (format) {
                case 'date':
                case 'date-time':
                    result = 'Date';
                    break;
                default:
                    result = 'string';
            }
            break;
        case 'file':
            result = 'any';
            break;
        case 'ref':
            // 文档里出现type:ref,这里固定为string
            result = 'string';
            break;
        default:
            // console.log('warnning convertJsType:', refName)
            result = refName;
            break;
    }
    return result
}
exports.convertJsType = convertJsType


// 获取枚举值
var getEnums = function (enumObject) {
    return Object.prototype.toString.call(enumObject) === '[object Object]' ? Object.values(enumObject) : enumObject;
}
exports.getEnums = getEnums

// 获取属性类型定义
var propAttr = function (v) {
    let result = {
        propType: '',
        isEnum: false,
        isArray: false,
        isType: false,
        isImport: false,
        isRef: false,
        ref: ''
    };
    if (hasProp(v, '$ref') || hasProp(v, 'allOf')) {
        // 引用类型
        result.ref = genRefName(v.$ref || hasProp(v, 'allOf') && v.allOf[0].$ref);
        result.isImport = true
        result.isRef = hasProp(v, '$ref')
        result.propType = result.ref
    } else if (hasProp(v, 'type') && v.type == 'array') {
        let propType = ''
        // 数组类型
        if (hasProp(v.items, '$ref')) {
            propType = genRefName(v.items.$ref) + '[]';
        } else {
            propType = convertJsType(v.items.type, v.items.format) + '[]';
        }
        result.isRef = hasProp(v.items, '$ref')
        result.propType = propType
        result.isArray = true;
        result.isImport = true
    } else if (hasProp(v, 'enum') && v.type == 'string') {
        // 数据枚举
        result.isEnum = true;
        result.propType = getEnums(v.enum).map(item => `'${item}'='${item}'`).join(',');
    } else if (hasProp(v, 'enum')) {
        // 类型枚举
        result.isType = true;
        result.propType = getEnums(v.enum).join('|');
    } else {
        // 其他类型
        result.propType = convertJsType(v.type, v.format);
    }
    return result;
}
exports.propAttr = propAttr

var hasProp = function (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop)
}
exports.hasProp = hasProp