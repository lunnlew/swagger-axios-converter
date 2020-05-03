const {
    convertJsType,
    genRefName,
    getMethodNameFromPath,
    genClassNameFromTags,
    propAttr,
    hasProp
} = require("../utils/index")
const { requestParametersCodegen } = require("./requestParametersCodegen")
const { requestBodyCodegen } = require("./requestBodyCodegen")

// 导出响应结构定义
var getResponseType = function (reqProps) {
    let result = 'any';
    let isRef = false;

    const successStatusCode = Object.keys(reqProps.responses).find(statusCode => statusCode.match(/20[0-4]$/));
    if (!successStatusCode) {
        return { responseType: result, isRef };
    }
    let resSchema = null;
    resSchema = reqProps.responses[successStatusCode].schema;
    if (!resSchema) {
        return { responseType: result, isRef };
    }
    let prop = propAttr(resSchema)

    result = prop.propType
    isRef = prop.isRef

    if (result == 'object') {
        result = 'any';
    } else if (result == 'array') {
        result = 'any[]';
    }

    return { responseType: result, isRef };
}

// 请求接口类生成
var requestCodegen = function (paths) {
    const requestClasses = {}
    for (const [path, operation] of Object.entries(paths)) {
        // 默认使用path转为方法名
        let methodName = getMethodNameFromPath(path);
        let operationId = '';
        for (const [method, operationProps] of Object.entries(operation)) {
            if (hasProp(operationProps, 'operationId')) {
                operationId = operationProps.operationId
            }
            // 处理分组类名
            const className = genClassNameFromTags(operationProps.tags)
            if (!hasProp(requestClasses, className)) {
                requestClasses[className] = []
            }

            // 处理请求类型
            const contentType = operationProps.consumes && operationProps.consumes.includes('multipart/form-data')
                ? 'multipart/form-data'
                : 'application/json';

            // 处理请求参数
            let imports = [];
            let formData = '';
            let pathReplace = '';
            let parsedParameters = {
                requestParameters: ''
            };
            if (hasProp(operationProps, 'parameters')) {
                parsedParameters = requestParametersCodegen(operationProps.parameters || [])
                formData = parsedParameters.requestFormData ? 'data = new FormData();\n' + parsedParameters.requestFormData : '';
                pathReplace = parsedParameters.requestPathReplace;
                // 合并imports
                if (parsedParameters.imports) {
                    imports.push(...parsedParameters.imports || []);
                }
            }

            // 处理请求Body
            let parsedRequestBody = {
                requestBodyString: ''
            };
            if (hasProp(operationProps, 'requestBody')) {
                parsedRequestBody = requestBodyCodegen(operationProps.requestBody || {})
                // 合并imports
                if (parsedRequestBody.imports) {
                    imports.push(...parsedRequestBody.imports || []);
                }
            }

            parsedParameters.requestParameters = parsedParameters.requestParameters
                ? parsedParameters.requestParameters + parsedRequestBody.requestBodyString
                : parsedRequestBody.requestBodyString;

            // 组装请求参数体
            parameters =
                ((_a = parsedParameters.requestParameters) === null || _a === void 0 ? void 0 : _a.length) > 0
                    ? `params: {
              ${parsedParameters.requestParameters}
          } = {} as any,`
                    : '';
            // 处理响应数据
            const { responseType, isRef } = getResponseType(operationProps);
            // 如果返回值也是引用类型，则加入到类的引用里面
            if (isRef) {
                imports = Array.from(new Set(imports).add(responseType))
            };

            // imports
            parsedParameters.imports = imports;

            // 所有信息
            requestClasses[className].push({
                name: methodName,
                operationId: operationId,
                requestSchema: {
                    summary: operationProps.summary,
                    path,
                    pathReplace,
                    parameters,
                    parsedParameters,
                    method,
                    contentType,
                    responseType,
                    formData,
                    requestBody: parsedRequestBody.requestBodyString
                }
            })
        }
    }
    return { requestClasses }
}

exports.requestCodegen = requestCodegen