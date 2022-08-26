const { normalizeStr, camelcaseStr, normalizeTypeName, normalizeDeclareClassName, tpl_replace } = require("../Util/util")
const { CodeTpl } = require('../CodeTpl')

const CLASS_CODE_STYLE = 'class'

const default_options = {
    /**
     * api base
     */
    api_base: '/',
    /**
     * 代码风格
     */
    code_style: 'class',
    /**
     * 类单一文件声明
     */
    single_class_declare: true,
    /**
     * 是否内嵌模型声明
     */
    inline_model_declare: false,
    /**
     * 类文件路径模板
     */
    class_file_path_tpl: '{group_name}/index.ts',
    /**
     * 分组名
     */
    group_name: 'common'
}

/**
 * 生成方法定义
 * @param {*} api 
 * @returns 
 */
const genMethodDefineItem = function (api) {
    let parameters = []
    let imports = []
    let enums = []
    if (api.parameters) {
        for (let p of api.parameters) {
            let parameter_type = normalizeTypeName(p.name, p)
            if (parameter_type.name) {
                parameters.push({
                    name: parameter_type.name,
                    summary: p.summary,
                    description: p.description,
                    in: p.in,
                    required: p.required,
                    type: parameter_type.type,
                });
                if (!parameter_type.isBuildIn) {
                    imports.push(parameter_type.name)
                }
                if (parameter_type.isEnum) {
                    enums.push({
                        name: parameter_type.name,
                        summary: parameter_type.summary,
                        description: parameter_type.description,
                        enums: parameter_type.enums
                    })
                }
            }
        }
    }
    let responses = []
    if (api.responses) {
        for (let code in api.responses) {
            if (api.responses[code]['content']) { // for 3.x
                for (let contentType in api.responses[code]['content']) {
                    let p = api.responses[code]['content'][contentType]
                    let response_type = normalizeTypeName('response_' + code, p)
                    responses.push({
                        name: response_type.name,
                        responseCode: code,
                        summary: p.summary,
                        description: p.description,
                        type: response_type.type,
                        contentType
                    });
                    if (!response_type.isBuildIn) {
                        imports.push(response_type.name)
                    }
                    if (response_type.isEnum) {
                        enums.push({
                            name: response_type.name,
                            summary: response_type.summary,
                            description: response_type.description,
                            enums: response_type.enums
                        })
                    }
                }
            } else { // for 2.x
                let p = api.responses[code]
                let response_type = normalizeTypeName('response_' + code, p)
                responses.push({
                    name: response_type.name,
                    responseCode: code,
                    summary: p.summary,
                    description: p.description,
                    type: response_type.type,
                    contentType: ''
                });
                if (!response_type.isBuildIn) {
                    imports.push(response_type.name)
                }
                if (response_type.isEnum) {
                    enums.push({
                        name: response_type.name,
                        summary: response_type.summary,
                        description: response_type.description,
                        enums: response_type.enums
                    })
                }
            }
        }
    }

    return {
        imports,
        enums,
        api: {
            summary: api.summary,
            description: api.description,
            contentType: api.contentType,
            name: camelcaseStr(normalizeStr(api.operationId), false),
            path: api.path,
            method: api.method,
            parameters: parameters,
            responses: responses
        }
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
        apis: [],
        imports: []
    }
    for (let api of apis) {
        let itemDefine = genMethodDefineItem(api)
        classDefine.imports.push(...itemDefine.imports)
        classDefine.apis.push(itemDefine.api)
    }
    return classDefine
}

/**
 * 默认axios声明
 * @returns 
 */
const getAxiosDefault = function () {
    return '\n' + CodeTpl('IRequest_tpl').render()
}

/**
 * 默认axios导入
 * @returns 
 */
const getDefaultAxiosImport = function (import_request_path = './', options) {
    return '\n' + CodeTpl('IRequestImport_tpl').render({
        import_request_path,
        options
    })
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
    let import_model_path = options.group_name ?
        (relative_model_import > 0 ? ((new Array(relative_model_import)).join('../') || './') : './') :
        (relative_model_import > 0 ? ((new Array(relative_model_import + 1)).join('../') || './') : './')
    let import_request_path = (relative_model_import > 0 ? ((new Array(relative_model_import + 1)).join('../') || './') : './')

    let import_code = ''
    let declare_model = ''
    if (imports.length > 0) {
        if (!options.inline_model_declare) {
            import_code = `import { ${Array.from(new Set(imports)).join(', ')} } from '${import_model_path}model_index'`
        } else {
            let { codes, enums } = buildModelDeclare(classDefine.models)
            for (let enum_name in enums) {
                codes.push(CodeTpl('enum_tpl').render({ enum_define: enums[enum_name] }))
            }
            declare_model = codes.join('\n')
        }
    }

    import_code += getDefaultAxiosImport(import_request_path, options)
    return {
        filename,
        content: import_code + '\n' + CodeTpl('class_tpl').render({ class_define: classDefine }) + declare_model
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
        class_name: 'service_index'
    }) : (classDefine.name + '.ts')
    let relative_model_import = filename.replace(/[\\]/ig, '/').split('/').length - 1 - (options.relative_model_import ?? 0)
    let import_model_path = options.group_name ?
        (relative_model_import > 0 ? ((new Array(relative_model_import)).join('../') || './') : './') :
        (relative_model_import > 0 ? ((new Array(relative_model_import + 1)).join('../') || './') : './')
    let import_request_path = (relative_model_import > 0 ? ((new Array(relative_model_import + 1)).join('../') || './') : './')


    let codes = []
    let enums = {}
    for (let classDefine of classes) {
        imports.push(...classDefine.imports)
        if (options.inline_model_declare) {
            let { codes: model_codes, enums: model_enums } = buildModelDeclare(classDefine.models)
            codes.push(...model_codes)
            enums = Object.assign({}, enums, model_enums)
        }
        codes.push(CodeTpl('class_tpl').render({ class_define: classDefine }))
    }

    let import_code = ''
    if (imports.length > 0 && !options.inline_model_declare) {
        import_code = `import {${Array.from(new Set(imports)).join(',')}} from '${import_model_path}model_index'`
    }

    for (let enum_name in enums) {
        codes.push(CodeTpl('enum_tpl').render({ enum_define: enums[enum_name] }))
    }

    import_code += getDefaultAxiosImport(import_request_path, options)

    return {
        filename,
        content: import_code + codes.join('\n')
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
        codes.push(CodeTpl('model_tpl').render({ model }))
        if (model.enum) {
            model.enum.map(v => {
                enums[v.name] = v
            })
        }
    }
    return {
        codes,
        enums
    }
}

/**
 * 递归处理依赖
 * @param {*} model_defines 
 * @param {*} imports 
 * @returns 
 */
const buildModelImports = function (model_defines, imports, is_recursion = false) {
    let curentIndex = 0
    let models = (model_defines.filter(v => imports.indexOf(v.name) !== -1) || [])
    while (curentIndex <= models.length - 1) {
        let current = models[curentIndex]
        let current_imports = current.imports
        let current_imports_models = (model_defines.filter(v => current_imports.indexOf(v.name) !== -1) || [])
        for (let model of current_imports_models) {
            if (!models.find(q => q.name === model.name)) {
                models.push(model)
            }
        }
        if (!is_recursion) {
            break
        }
        curentIndex++
    }
    return {
        models: models,
        imports: imports
    }
}

/**
 * 生成类风格定义
 * @param {*} model_defines 
 * @param {*} api_defines 
 * @returns 
 */
const genClassStyleCode = function (defines, options) {
    const { models: model_defines, apis: api_defines } = defines
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
        let { imports: class_imports, models: class_models } = buildModelImports(model_defines, Array.from(new Set(classDefine.imports)), options.inline_model_declare)
        classes.push({
            name: classDefine.name,
            summary: classDefine.name,
            imports: class_imports,
            apis: classDefine.apis,
            models: class_models
        })
    }

    // 文件列表
    let files = []
    if (!options.inline_model_declare) {
        let { codes, enums } = buildModelDeclare(model_defines)
        for (let enum_name in enums) {
            codes.push(CodeTpl('enum_tpl').render({ enum_define: enums[enum_name] }))
        }
        files.push({
            filename: options.group_name ? options.group_name + '/model_index.ts' : './model_index.ts',
            content: codes.join('\n')
        })
    }

    options.relative_model_import = 0

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

const run = function (api_define, options) {
    options = Object.assign({}, default_options, options)
    if (!options.code_style || options.code_style === CLASS_CODE_STYLE) {
        return genClassStyleCode(api_define, options)
    } else {
        throw new Error('暂不支持其他风格')
    }
}
exports.run = run