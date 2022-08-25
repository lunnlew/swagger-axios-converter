const prettier = require("prettier")
const { default: camelcase } = require("camelcase")


/**
 * 模板占位符替换
 * @param {*} tpl 
 * @param {*} params 
 * @returns 
 */
const tpl_replace = function (tpl, params) {
    for (let param_key in params) {
        tpl = tpl.replace(new RegExp("\\{" + param_key + "\\}", "g"), (params[param_key] || ''));
    }
    return tpl
}

/**
 * 代码格式化
 * @param {*} text 
 * @param {*} options 
 * @returns 
 */
const code_format = function (text, options) {
    return prettier.format(text, {
        printWidth: 120,
        tabWidth: 4,
        parser: 'typescript',
        trailingComma: 'none',
        semi: true,
        singleQuote: true
    });
}

/**
 * 规范化字符串
 * @param {*} str 
 * @returns 
 */
const normalizeStr = function (str) {
    return str.split(/[`~!@#$%^&*()+<>«»?:"{},.，。、\/;'[\]\- ]/g).filter(v => v).join('_')
}

/**
 * 驼峰化字符串
 * @param {*} str 
 * @returns 
 */
const camelcaseStr = function (str, pascalCase = true) {
    return camelcase(str, {
        pascalCase
    })
}

/**
 * 规范化类型
 * @param {*} property 
 * @returns 
 */
const normalizeTypeName = function (name, property) {
    if (hasProp(property, 'type')) {
        if (['integer', 'Int64', 'Int32', 'int', 'number'].indexOf(property.type) !== -1) {
            return {
                name: 'number',
                type: 'number',
                isBuildIn: isBuildInType('number')
            }
        } else if (['bool', 'boolean'].indexOf(property.type) !== -1) {
            return {
                name: 'boolean',
                type: 'boolean',
                isBuildIn: isBuildInType('boolean')
            }
        } else if (['string'].indexOf(property.type) !== -1) {
            if (property.format === 'date' || property.format === 'date-time') {
                return {
                    name: 'Date',
                    type: 'Date',
                    isBuildIn: isBuildInType('Date')
                }
            } else if (hasProp(property, 'enum')) {
                return {
                    name: camelcaseStr(normalizeStr('enum_' + name), true),
                    type: camelcaseStr(normalizeStr('enum_' + name), true),
                    enums: property.enum,
                    summary: property.description,
                    isEnum: true,
                    isBuildIn: isBuildInType('enum')
                }
            } else {
                return {
                    name: 'string',
                    type: 'string',
                    isBuildIn: isBuildInType('string')
                }
            }
        } else if (property.type === 'array') {
            let property_type = normalizeTypeName(name, property.items)
            return {
                name: property_type.name,
                type: property_type.type + '[]',
                enums: property_type.enums,
                summary: property_type.summary || property.description,
                isEnum: property_type.isEnum,
                isBuildIn: isBuildInType(property_type.type)
            }
        } else if (property.type === 'file') {
            return {
                name: 'File',
                type: 'File',
                isBuildIn: isBuildInType('File')
            }
        } else if (property.type === 'ref') {
            return {
                name: 'any',
                type: 'any',
                isBuildIn: isBuildInType('any')
            }
        }
        return {
            name: normalizeStr(property.type),
            type: normalizeStr(property.type),
            isBuildIn: isBuildInType(property.type)
        }
    } else if (hasProp(property, '$ref')) {
        let name = property['$ref'].split('/').pop()
        return {
            name: normalizeStr(name),
            type: normalizeStr(name),
            isBuildIn: isBuildInType(name)
        }
    } else if (hasProp(property, 'schema')) {
        return normalizeTypeName(name, property.schema)
    }
    return {
        name: 'any',
        type: 'any',
        isBuildIn: isBuildInType('any')
    }
}

/**
 * 是否内建类型
 * @param {*} type 
 * @returns 
 */
const isBuildInType = function (type) {
    return ['string', 'number', 'boolean', 'array', 'any', 'file', 'date', 'object'].indexOf(type.toLowerCase()) !== -1
}

/**
 * 是否有属性
 * @param {*} obj 
 * @param {*} prop 
 * @returns 
 */
const hasProp = function (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop)
}

/**
 * 规范化声明名称
 * @param {*} name 
 * @returns 
 */
const normalizeDeclareClassName = function (name) {
    return camelcaseStr(normalizeStr(name).split('-').pop() + 'Service', true)
}

const normalizeEnumName = function (name) {
    return /^\d/.test(name)?`_${name}`:name
}

const normalizeEnumCode = function (val) {
    return Object.prototype.toString.call(val) === '[object String]' ? `\'${val}\'`: val
}


exports.code_format = code_format
exports.tpl_replace = tpl_replace
exports.normalizeStr = normalizeStr
exports.normalizeEnumName = normalizeEnumName
exports.normalizeEnumCode = normalizeEnumCode
exports.camelcaseStr = camelcaseStr
exports.normalizeTypeName = normalizeTypeName
exports.isBuildInType = isBuildInType
exports.hasProp = hasProp
exports.normalizeDeclareClassName = normalizeDeclareClassName