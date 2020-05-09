const fs = require("fs")
const path = require("path")
const prettier = require("prettier")
const { cacheSwagger } = require("./lib/cacheSwagger")
const { definitionsCodeGen } = require("./lib/Codegen/definitionsCodeGen")
const { requestCodegen } = require("./lib/Codegen/requestCodegen")
const { tagsCodegen } = require("./lib/Codegen/tagsCodegen")
const { requestServiceTemplate } = require("./lib/Template/requestServiceTemplate")
const { requestMethodTemplate } = require("./lib/Template/requestMethodTemplate")
const { mockTemplate } = require("./lib/Template/mockTemplate")
const { importCustomerAxiosHeader, customerAxiosConfigTemplate } = require("./lib/Template/importCustomerAxiosHeader")
const { importAxiosHeader, axiosConfigTemplate } = require("./lib/Template/importAxiosHeader")
const { interfaceTemplate } = require("./lib/Template/classTemplate")
const { enumTemplate } = require("./lib/Template/enumTemplate")
const { typeTemplate } = require("./lib/Template/typeTemplate")
const {
    hasProp
} = require("./lib/utils/index")
const defaultOptions = {
    mockDefines: undefined,
    responseMockTransform: undefined,
    baseApiOrigin: undefined,
    serviceNameSuffix: 'Service',
    methodNameMode: 'operationId',
    outputDir: './service',
    mockDir: './mock',
    enableMock: false,
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
// 方法名称缓存
var methodNameCache = {}
var codegenStart = function (AxiosHeader, options, requestTags, requestClass, models, enums) {
    // 处理接口
    for (let [className, requests] of Object.entries(requestClass)) {
        let text = '';
        requests.forEach(req => {
            let reqName = options.methodNameMode == 'operationId' ? req.operationId : req.name;
            let c = 0
            let isnew = false
            // 重复名称处理
            if(hasProp(methodNameCache, reqName)){
                c = parseInt(methodNameCache[reqName]) + 1
                isnew = true
            }
            methodNameCache[reqName] = c
            if(isnew){
                reqName =  reqName + c + ''
            }
            text += requestMethodTemplate(reqName, req.requestSchema, options);
        });
        if(!requestTags[className]){
            console.log('warnning: className not exists in tags', className)
        }
        text = requestServiceTemplate(className + options.serviceNameSuffix, text, 
            requestTags[className] && requestTags[className].description?`
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
var mockData = function(models, enums, p, options, isRecursion){
    let ruleResult = ''
    // 支持自定义的转换器
    if(options.responseMockTransform && Object.prototype.toString.call(options.responseMockTransform) === '[object Function]'){
        ruleResult = options.responseMockTransform(p, models, enums)
        if(ruleResult){
            return ruleResult
        }
    }
    // 支持部分定义转换
    if(options.mockDefines && Object.prototype.toString.call(options.mockDefines) === '[object Array]'){
        ruleResult = options.mockDefines.find(item => 
            item.name===p.name && (
            item.type===p.type || 
            (Object.prototype.toString.call(item.type) === '[object Array]'?item.type.indexOf(p.type)!==-1:false)
            ))
        if(ruleResult){
            return ruleResult.rule
        }
    }
    switch(p.type){
        case 'string':{
            ruleResult = `'${p.name}':'@string(10)'`
            break;
        }
        case 'string[]':{
            ruleResult = `'${p.name}|1-10':'@string(10)'`
            break;
        }
        case 'object':{
            ruleResult = `'${p.name}':'{}'`
            break;
        }
        case 'number':{
            ruleResult = `'${p.name}|1-1000':1`
            break;
        }
        default: {
            // 处于递归中断
            if(isRecursion){
                return  `'${p.name}': null`
            }
            let r = buildResponseMock(models, enums, p.type, options)
            if(r.isArray){
                if(r.isModel){
                    ruleResult = `'${p.name}|1-10':` + `[{${r.result}}]`
                } else {
                    ruleResult = `'${p.name}|1-10':` + `[${r.result}]`
                }
            } else {
                if(r.isModel){
                    ruleResult = `'${p.name}':` + `{${r.result}}`
                } else {
                    ruleResult = `'${p.name}|1':` + `[${r.result}]`
                }
            }
            break;
        }
    }
    return ruleResult.replace('{null}','null')
}
var buildModelTypeName = function(modelType){
    return modelType.replace(/\[\]/g, '')
}
var isArrayField = function(modelType){
    if(modelType.endsWith('[]')){
        return true
    }
}
var buildResponseMock = function(models, enums, modelType, options){
    const isArray = isArrayField(modelType)
    const modelTypeName = buildModelTypeName(modelType)
    let model = models.find(item => item.value && item.value.name===modelTypeName)
    if(model){
        return {
            isModel:true,
            isArray: isArray,
            result:model.value.props.map(p => mockData(models, enums, p, options, p.type===modelType)).join(',')
        }
    }
    let enumk = enums.find(item => item.name && item.name===modelTypeName)
    if(enumk){
        return {
            isModel:false,
            isArray: isArray,
            result:enumk.items.map(p => `'${p}'`).join(',')
        }
    }
    return {
        isModel:true,
        isArray: isArray,
        result:null
    }
}
var mockStart = function (AxiosHeader, options, requestTags, requestClass, models, enums) {
     for (let [className, requests] of Object.entries(requestClass)) {
        let mocks = []
        requests.forEach(req => {
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
              } = req.requestSchema;
              let r = buildResponseMock(Object.values(models), Object.values(enums), responseType, options).result
              if(r!==null){
                r = `{${r}}`
              }
              mocks.push({
                path,
                mockRule: r,
                method
              })
        })
        writeFile(options.mockDir || '.', className + '.mock.js', prettier.format(mockTemplate(mocks), {
            printWidth: 120,
            tabWidth: 2,
            parser: 'typescript',
            trailingComma: 'none',
            jsxBracketSameLine: false,
            semi: false,
            singleQuote: true
        }));
     }
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
            'baseURL': options.baseApiOrigin?options.baseApiOrigin:url.origin,
            'name': 'default',
            swaggerJson
        })
    } else if (Object.prototype.toString.call(options.remoteUrl) === '[object Array]') {
        for (let remote of options.remoteUrl) {
            let { swaggerJson } = await cacheSwagger(remote.remoteUrl).fetch();
            let url = new URL(remote.remoteUrl)
            codegenParts.push({
                'baseURL': url.origin,
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
        if(!('paths' in part.swaggerJson)){
            console.log('warnning:','not paths in current swaggerJson')
            continue
        }
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
        options.enableMock && mockStart(
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
