const prettier = require("prettier")


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

exports.code_format = code_format
exports.tpl_replace = tpl_replace