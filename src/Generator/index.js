const { tpl_replace } = require("../Util/util")
const { default: camelcase } = require("camelcase")

const CLASS_CODE_STYLE = 'class'

/**
 * 处理api定义
 * @param {*} path 
 * @param {*} apis 
 */
const genApiDefineItem = function (path, apis) {
    let apiDefines = []
    for (let method in apis) {
        let apiDefine = {
            summary: apis[method].summary,
            method: method,
            path: path,
            operationId: apis[method].operationId,
            responses: apis[method].responses,
            parameters: apis[method].parameters,
            group: apis[method].tags[0]
        }
        apiDefines.push(apiDefine)
    }
    return apiDefines
}

/**
 * 生成模型定义
 * @param {*} name 
 * @param {*} model 
 * @returns 
 */
const genModelDefineItem = function (name, model) {
    let propertyDefine = {
        name: normalizeStr(name),
        summary: model.description || model.title,
        properties: [],
        imports: []
    }
    for (let key in model.properties) {
        let property = model.properties[key]
        let property_type = normalizeTypeName(key, property)
        propertyDefine.properties.push({
            summary: property.description || key,
            name: normalizeStr(key),
            type: property_type.name
        })
        if (!property_type.isBuildIn) {
            propertyDefine.imports.push(property_type.type)
        }
        if (property_type.isEnum) {
            if (!propertyDefine.enum) {
                propertyDefine.enum = []
            }
            propertyDefine.enum.push({
                name: property_type.type,
                summary: property_type.summary || property.description || key,
                items: property_type.items
            })
        }
    }
    return propertyDefine
}

/**
 * 规范会类声明名称
 * @param {*} name 
 * @returns 
 */
const normalizeDeclareClassName = function (name) {
    return name.split('-').pop() + 'Service'
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
                    name: normalizeStr('enum_' + name),
                    type: normalizeStr('enum_' + name),
                    items: property.enum,
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
                name: property_type.name + '[]',
                type: property_type.type,
                items: property_type.items,
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
 * 规范化字符串
 * @param {*} name 
 * @returns 
 */
const normalizeStr = function (str) {
    return camelcase(str.split(/[`~!@#$%^&*()+<>«»?:"{},.\/;'[\]]/g).filter(v => v).join('_'), {
        pascalCase: true
    })
}

/**
 * 生成方法定义
 * @param {*} api 
 * @returns 
 */
const genMethodDefineItem = function (api) {
    let parameters = []
    let parameterDefine = ''
    let imports = []
    let enums = []
    if (api.parameters) {
        for (let p of api.parameters) {
            let parameter_type = normalizeTypeName(p.name, p)
            parameters.push({
                name: p.name,
                summary: p.description,
                type: parameter_type.name,
            });
            if (!parameter_type.isBuildIn) {
                imports.push(parameter_type.type)
            }
            if (!parameter_type.isEnum) {
                enums.push({
                    name: parameter_type.type,
                    summary: parameter_type.summary || p.description,
                    items: parameter_type.items
                })
            }
        }
        parameterDefine = parameters.map(p => `
        /**
         * ${p.summary}
         */
        ${p.name}: ${p.type};`).join('')
        parameterDefine = `
        params: {
            ${parameterDefine}
        }
        `
    }
    let responses = []
    let success_reponse_type = ''
    if (api.responses) {
        for (let code in api.responses) {
            let p = api.responses[code]
            let response_type = normalizeTypeName('response_' + code, p)
            responses.push({
                name: code,
                summary: p.description,
                type: response_type.name
            });
            if (!response_type.isBuildIn) {
                imports.push(response_type.type)
            }
            if (!response_type.isEnum) {
                enums.push({
                    name: response_type.type,
                    summary: response_type.summary || p.description,
                    items: response_type.items
                })
            }
            if (code == '200') {
                success_reponse_type = response_type.name
            }
        }
    }

    return {
        imports,
        enums,
        method: `
        /**
         * ${api.summary}
         */
        static ${api.operationId}(${parameterDefine ? (parameterDefine + ', ') : ''}options: IRequestOptions = {}): Promise<${success_reponse_type}> {
            return new Promise((resolve, reject) => {
                let url = '${api.path}';
                const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);
                let data: any = ${parameterDefine ? "params['param']" : 'null'};
                configs.data = data;
                axios(configs, resolve, reject);
            })
        }
        `
    }
}

/**
 * 生成类定义
 * @param {*} name 
 * @param {*} apis 
 * @returns 
 */
const genClassDefineItem = function (name, apis) {
    let classDefine = {
        name: normalizeDeclareClassName(name),
        methods: [],
        imports: []
    }
    for (let api of apis) {
        let itemDefine = genMethodDefineItem(api)
        classDefine.imports.push(...itemDefine.imports)
        classDefine.methods.push(itemDefine.method)
    }
    return classDefine
}

/**
 * 处理api定义
 * @param {*} api_paths 
 */
const buildApiDefine = function (api_paths) {
    // 统一api信息定义
    let defines = []
    for (let path in api_paths) {
        defines.push(...genApiDefineItem(path, api_paths[path]))
    }
    return defines
}

/**
 * 处理model定义
 * @param {*} definitions 
 */
const buildModelDefine = function (models) {
    // 统一model信息定义
    let defines = []
    for (let key in models) {
        defines.push(genModelDefineItem(key, models[key]))
    }
    return defines
}

/**
 * 默认axios声明
 * @returns 
 */
const getAxiosDefault = function () {
    return `
    
  // tslint:disable
  /* eslint-disable */
  export interface IRequestOptions {
    headers?: any;
  }

  export interface IRequestPromise<T=any> extends Promise<IRequestResponse<T>> {}

  export interface IRequestResponse<T=any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
    request?: any;
  }

  export interface IRequestInstance {
    (config: any): IRequestPromise;
    (url: string, config?: any): IRequestPromise;
    request<T = any>(config: any): IRequestPromise<T>;
  }

  export interface IRequestConfig {
    method?: any;
    headers?: any;
    url?: any;
    baseURL?: any;
    data?: any;
    params?: any;
  }

  export interface ServiceOptions {
    axios?: IRequestInstance,
  }

  export const serviceOptions: ServiceOptions = {
  };
  
  export function getConfigs(method: string, contentType: string, url: string,options: any):IRequestConfig {
    const configs: IRequestConfig = { ...options, method, url };
    configs.headers = {
      ...options.headers,
      'Content-Type': contentType,
    };
    return configs
  }
  `
}
/**
 * 默认axios导入
 * @returns 
 */
const getDefaultAxiosImport = function (api_base = '', import_model_path = './') {
    return `
import { IRequestOptions, IRequestConfig, serviceOptions, getConfigs } from '${import_model_path}request';

export function axios(configs: IRequestConfig, resolve: (p: any) => void, reject: (p: any) => void): Promise<any> {
  if (serviceOptions.axios) {
    configs.baseURL = '${api_base ? api_base : ''}/fsc-sso';
    return serviceOptions.axios
      .request(configs)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  } else {
    throw new Error('please inject yourself instance like axios  ');
  }
}`
}

/**
 * 分离文件声明
 * @param {*} classes 
 * @returns 
 */
const genSingleClassFile = function (classDefine, options) {
    let imports = classDefine.imports
    let filename = options.class_file_path_tpl ? tpl_replace(options.class_file_path_tpl, {
        class_name: classDefine.name,
        group_name: options.group_name
    }) : (classDefine.name + '.ts')
    let relative_model_import = filename.replace(/[\\]/ig, '/').split('/').length - 1 - (options.relative_model_import ?? 0)
    let import_model_path = (relative_model_import > 0 ? (new Array(relative_model_import + 1)).join('../') : './')

    let import_code = ''
    let declare_model = ''
    if (imports.length > 0) {
        if (!options.inline_model_declare) {
            import_code = `import {${Array.from(new Set(imports)).join(',')}} from '${import_model_path}model_index'`
        } else {
            declare_model = buildModelDeclare(classDefine.models)
        }
    }

    import_code += getDefaultAxiosImport(options.api_base, import_model_path)

    return {
        filename,
        content: import_code + `
        /**
         * ${classDefine.name}
         */
        export class ${classDefine.name} {
            ${classDefine.methods.join('')}
        }
        ` + declare_model
    }
}

/**
 * 一个文件声明
 * @param {*} classes 
 * @returns 
 */
const genAllClassFile = function (classes, options) {
    let imports = []

    let filename = options.class_file_path_tpl ? tpl_replace(options.class_file_path_tpl, {
        group_name: options.group_name,
        class_name: 'all'
    }) : (classDefine.name + '.ts')
    let relative_model_import = filename.replace(/[\\]/ig, '/').split('/').length - 1 - (options.relative_model_import ?? 0)
    let import_model_path = (relative_model_import > 0 ? (new Array(relative_model_import + 1)).join('../') : './')


    let codes = []
    for (let classDefine of classes) {
        imports.push(...classDefine.imports)
        codes.push(`
        /**
         * ${classDefine.name}
         */
        export class ${classDefine.name} {
            ${classDefine.methods.join('')}
        }
        ` + (options.inline_model_declare ? buildModelDeclare(classDefine.models) : ''))
    }
    let import_code = ''
    if (imports.length > 0 && !options.inline_model_declare) {
        import_code = `import {${Array.from(new Set(imports)).join(',')}} from '${import_model_path}model_index'`
    }

    import_code += getDefaultAxiosImport(options.api_base, import_model_path)

    return {
        filename,
        content: import_code + codes.join('')
    }
}

/**
 * 处理模型声明
 * @param {*} model_defines 
 * @returns 
 */
const buildModelDeclare = function (model_defines) {
    let codes = []
    let enums = {}
    for (let model of model_defines) {
        let itemPropertiyDefines = model.properties.map(p => `
            /**
             * ${p.summary}
             */
            ${p.name}: ${p.type};`).join('')

        codes.push(`
            /**
             * ${model.summary}
             */
            export interface ${model.name} {
                ${itemPropertiyDefines}
            }`)

        if (model.enum) {
            model.enum.map(v => {
                enums[v.name] = v
            })
        }
    }

    for (let enum_name in enums) {
        let enum_item = enums[enum_name]
        let itemEnumDefines = enum_item.items.map(p => `'${p}' = '${p}'`).join(',\r')
        codes.push(`
        /**
         * ${enum_item.summary}
         */
        export enum ${enum_item.name} {
            ${itemEnumDefines}
        }`)
    }

    return codes.join('')
}

/**
 * 生成类风格定义
 * @param {*} model_defines 
 * @param {*} api_defines 
 * @returns 
 */
const genClassStyleCode = function (defines, options) {
    const { models: model_defines, apis: api_defines } = defines
    // 文件列表
    let files = []
    let imports = []


    if (!options.inline_model_declare) {
        files.push({
            filename: 'model_index.ts',
            content: buildModelDeclare(model_defines)
        })
    } else {
        imports = model_defines.reduce((p, v) => {
            return p.concat(v.imports)
        }, [])
    }

    options.relative_model_import = 0

    // 进行API分组
    let grouped = {}
    for (let api of api_defines) {
        if (api.group in grouped) {
            grouped[api.group].push(api)
        } else {
            grouped[api.group] = [api]
        }
    }

    // 生成类风格定义
    let classes = []
    for (let grouped_key in grouped) {
        let classDefine = genClassDefineItem(grouped_key, grouped[grouped_key])
        imports = Array.from(new Set(imports.concat(classDefine.imports)))
        classes.push({
            name: classDefine.name,
            summary: classDefine.name,
            imports,
            methods: classDefine.methods,
            models: (model_defines.filter(v => imports.indexOf(v.name) !== -1) || [])
        })
        imports = []
    }
    grouped = undefined
    codes = []

    if (options.single_class_declare) {
        files.push(genAllClassFile(classes, options))
    } else {
        if (options.class_file_path_tpl && options.class_file_path_tpl.indexOf('{class_name}') == -1) {
            console.error('警告：选项single_class_declare指定为false时,选项class_file_path_tpl必须提供{class_name}占位')
        }
        for (let classDefine of classes) {
            files.push(genSingleClassFile(classDefine, options))
        }
    }

    files.push({
        filename: 'request.ts',
        content: getAxiosDefault()
    })

    return files
}

/**
 * 搜集生成结果
 * @param {*} api_define 
 * @param {*} options 
 */
const collectGenerateInfo = function (api_define, options) {
    if (!options.code_style || options.code_style === CLASS_CODE_STYLE) {
        return genClassStyleCode({
            models: buildModelDefine(api_define.definitions),
            apis: buildApiDefine(api_define.paths)
        }, options)
    } else {
        throw new Error('暂不支持其他风格')
    }
}

const run = function (api_define, options) {
    return collectGenerateInfo(api_define, options)
}
exports.run = run