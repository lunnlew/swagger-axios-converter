var requestMethodTemplate = function (name, requestSchema, options) {
  let {
    summary = '',
    parameters = '',
    responseType = '',
    method = '',
    contentType = 'multipart/form-data',
    path = '',
    pathReplace = '',
    parsedParameters = {},
    formData = '',
    requestBody = null
  } = requestSchema;
  const { queryParameters = [], bodyParameter = [] } = parsedParameters;
  const resolveString = 'resolve';
  return `
/**
 * ${summary || ''}
 */
${options.useStaticMethod ? 'static' : ''} ${name}(${parameters}options:IRequestOptions={}):Promise<${responseType}> {
  return new Promise((resolve, reject) => {
    let url = '${path}'
    ${pathReplace}
    const configs:IRequestConfig = getConfigs('${method}', '${contentType}', url, options)
    ${parsedParameters && queryParameters.length > 0
      ? 'configs.params = {' + queryParameters.join(',') + '}'
      : ''}
    let data = ${parsedParameters && bodyParameter && bodyParameter.length > 0
      ? bodyParameter
      : !!requestBody
        ? 'params.body'
        : 'null'}
    ${contentType === 'multipart/form-data' ? formData : ''}
    configs.data = data;
    axios(configs, ${resolveString}, reject);
  });
}`;
}
exports.requestMethodTemplate = requestMethodTemplate