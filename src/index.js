const fs = require("fs")
const path = require("path")
const prettier = require("prettier")
const { cacheSwagger } = require("./lib/cacheSwagger")
const { definitionsCodeGen } = require("./lib/Codegen/definitionsCodeGen")
const { requestCodegen } = require("./lib/Codegen/requestCodegen")
const { tagsCodegen } = require("./lib/Codegen/tagsCodegen")
const { requestServiceTemplate } = require("./lib/Template/requestServiceTemplate")
const { requestMethodTemplate } = require("./lib/Template/requestMethodTemplate")
const { importCustomerAxiosHeader, customerAxiosConfigTemplate } = require("./lib/Template/importCustomerAxiosHeader")
const { importAxiosHeader, axiosConfigTemplate } = require("./lib/Template/importAxiosHeader")
const { interfaceTemplate } = require("./lib/Template/classTemplate")
const { enumTemplate } = require("./lib/Template/enumTemplate")
const { typeTemplate } = require("./lib/Template/typeTemplate")
const defaultOptions = {
    serviceNameSuffix: 'Service',
    methodNameMode: 'operationId',
    outputDir: './service',
    fileName: 'index.ts',
    useStaticMethod: true,
    useCustomerRequestInstance: false,
    modelMode: 'interface',
    strictNullChecks: true,
    useMultipleSource: false
};

var writeFile = function (fileDir, name, data) {
    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir);
    }
    const filename = path.join(fileDir, name);
    fs.writeFileSync(filename, data);
}
var format = function (text, options) {
    if (options.format) {
        return options.format(text);
    }
    return prettier.format(text, {
        printWidth: 120,
        tabWidth: 2,
        parser: 'typescript',
        trailingComma: 'none',
        jsxBracketSameLine: false,
        semi: true,
        singleQuote: true
    });
}
var codegenStart = function (AxiosHeader, options, requestTags, requestClass, models, enums) {
    // 处理接口
    for (let [className, requests] of Object.entries(requestClass)) {
        let text = '';
        requests.forEach(req => {
            const reqName = options.methodNameMode == 'operationId' ? req.operationId : req.name;
            text += requestMethodTemplate(reqName, req.requestSchema, options);
        });
        text = requestServiceTemplate(className + options.serviceNameSuffix, text, 
            requestTags[className].description?`
            /**
              * ${requestTags[className].description}
              */
            `:'');
        AxiosHeader += text;
    }
    // 处理类和枚举
    Object.values(models).forEach(item => {
        const text = interfaceTemplate(item.value.name, item.value.props, [], options.strictNullChecks, item.description?`/**
                     * ${item.description}
                     */
                     `:'');
        AxiosHeader += text;
    });
    Object.values(enums).forEach(item => {
        let text = item.description?`/**
                     * ${item.description}
                     */
                     `:'';
        text += item.content || '';
        AxiosHeader += text;
    });
    writeFile(options.outputDir || '.', options.fileName || '', format(AxiosHeader, options));
}
var codegenCommonDefine = function (options, multiple) {
    let AxiosHeader = options.useCustomerRequestInstance ? importCustomerAxiosHeader(options) : importAxiosHeader(options)
    if (multiple) {
        writeFile(options.outputDir || '.', 'request.ts', AxiosHeader);
        AxiosHeader = `
  // tslint:disable
  /* eslint-disable */
  import { IRequestOptions, IRequestConfig, serviceOptions, getConfigs } from '../request'`
    }
    return {
        AxiosHeader
    }
}
var codegen = async function (options) {
    options = Object.assign({}, defaultOptions, options);
    var codegenParts = []
    if (Object.prototype.toString.call(options.remoteUrl) === '[object String]') {
        let { swaggerJson } = await cacheSwagger(options.remoteUrl).fetch();
        let url = new URL(options.remoteUrl)
        codegenParts.push({
            'baseURL': url.origin + (url.port === '' ? '' : (':' + url.port)),
            'name': 'default',
            swaggerJson
        })
    } else if (Object.prototype.toString.call(options.remoteUrl) === '[object Array]') {
        for (let remote of options.remoteUrl) {
            let { swaggerJson } = await cacheSwagger(remote.remoteUrl).fetch();
            let url = new URL(remote.remoteUrl)
            codegenParts.push({
                'baseURL': url.origin + (url.port === '' ? '' : (':' + url.port)),
                'name': remote.name,
                swaggerJson
            })
        }
    } else {
        console.log('error: not support', options.remoteUrl)
    }
    const multiple = options.useMultipleSource || codegenParts.length > 1
    let { AxiosHeader } = codegenCommonDefine(options, multiple)
    let imports = ''
    for (let part of codegenParts) {
        let ImportAxiosHeader = AxiosHeader
        let { requestClasses } = requestCodegen(part.swaggerJson.paths)
        let { requestTags } = tagsCodegen(part.swaggerJson.tags)
        let { models, enums } = definitionsCodeGen(part.swaggerJson.definitions);
        if (multiple) {
            // 多数据源API指定
            let axiosConfig = `configs.baseURL = '${part.baseURL}${part.swaggerJson.basePath}'`
            ImportAxiosHeader += options.useCustomerRequestInstance ?
                customerAxiosConfigTemplate(options, axiosConfig) :
                axiosConfigTemplate(options, axiosConfig)
        }
        codegenStart(
            ImportAxiosHeader,
            multiple ? { ...options, outputDir: options.outputDir + '/' + part.name } : options,
            requestTags,
            requestClasses,
            models,
            enums);
    }
    console.log('done !!')
}
exports.codegen = codegen
