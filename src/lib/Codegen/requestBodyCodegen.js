const {
    convertJsType,
    genRefName,
    hasProp
} = require("../utils/index")

// 请求体定义代码生成
var requestBodyCodegen = function (requestBody) {
    if (requestBody.content == null || requestBody.content === 'undefined')
        return
    let imports = [];
    let bodyType = '';
    let requestBodyString = ''
    let [reqBodyType] = Object.keys(requestBody.content);
    reqBody == requestBody.content[reqBodyType];
    if (reqBody == null) {
        return { imports, bodyType };
    }

    let prop = {};
    if (hasProp(reqBody, 'schema')) {
        prop = propAttr(reqBody.schema)
        if (prop.isImport) {
            imports.push(prop.propType);
        }
    } else {
        prop = propAttr(reqBody)
        if (prop.isImport) {
            imports.push(prop.propType);
        }
    }

    requestBodyString += `
    /** requestBody */
    body?:${bodyType},`;

    return { imports, requestBodyString };
}

exports.requestBodyCodegen = requestBodyCodegen