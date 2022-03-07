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
    return str.split(/[`~!@#$%^&*()+<>«»?:"{},.\/;'[\]]/g).filter(v => v).join('_')
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

exports.code_format = code_format
exports.tpl_replace = tpl_replace
exports.normalizeStr = normalizeStr
exports.camelcaseStr = camelcaseStr