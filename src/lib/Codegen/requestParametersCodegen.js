const {
    convertJsType,
    genRefName,
    propAttr,
    hasProp
} = require("../utils/index")
const { default: camelcase } = require("camelcase")

// 请求参数生成
var requestParametersCodegen = function (parameters) {
    let requestParameters = '';
    let requestFormData = ''
    let requestPathReplace = ''
    let queryParameters = [];
    let bodyParameters = [];
    let useBodyParams = parameters.filter(item => item.in === 'body').length > 1;
    let imports = [];
    for (const [index, param] of Object.entries(parameters)) {
        if(!hasProp(param, 'name')){
            console.log('warnning: param not has name', param)
            continue
        }
        let prop = {};
        if (hasProp(param, 'schema')) {
            prop = propAttr(param.schema)
            if (prop.isImport) {
                imports.push(prop.propType);
            }
        } else {
            prop = propAttr(param)
            if (prop.isImport) {
                imports.push(prop.propType);
            }
        }
        const paramName = camelcase(param.name, { pascalCase: false })
        requestParameters += `
    /** ${param.description || ''} */
    ${paramName}${param.required ? '' : '?'}:${prop.propType.replace(/-/g,'')},`;

        // 如果参数是从formData 提交
        if (param.in === 'formData') {
            requestFormData += `if(params['${paramName}']){
        data.append('${param.name}',params['${paramName}'] as any)
      }\n
      `;
        }
        else if (param.in === 'path') {
            requestPathReplace += `url = url.replace('{${param.name}}',params['${paramName}']+'')\n`;
        }
        else if (param.in === 'query') {
            queryParameters.push(`'${param.name}':params['${paramName}']`);
        }
        else if (param.in === 'body') {
            const body = useBodyParams ? `'${param.name}':params['${paramName}']` : `params['${paramName}']`;
            bodyParameters.push(body);
        }

    }
    const bodyParameter = useBodyParams ? `{${bodyParameters.join(',')}}` : bodyParameters.join(',');
    return { requestParameters, requestFormData, requestPathReplace, queryParameters, bodyParameter, imports };
}


exports.requestParametersCodegen = requestParametersCodegen
