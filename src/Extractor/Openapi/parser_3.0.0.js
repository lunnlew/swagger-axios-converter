const { normalizeStr, normalizeTypeName, hasProp } = require("../../Util/util")

const parseRequestBodyToParameters = function (api, components) {
    let parameters = []
    let contentType = ''
    if (hasProp(api, 'requestBody')) {
        if (hasProp(api.requestBody, 'content')) {
            let requestBody = api.requestBody
            let RequestBodyType = normalizeTypeName('RequestBody', Object.values(requestBody.content)?.[0])
            contentType = Object.keys(requestBody.content)?.[0] || ''
            parameters.push({
                description: RequestBodyType.type,
                name: RequestBodyType.name,
                in: "body",
                required: true,
                ...Object.values(requestBody.content)?.[0]
            })
        } else if (hasProp(components, 'requestBodies')) {
            let RequestBodyType = normalizeTypeName('RequestBody', api.requestBody)
            if (hasProp(components.requestBodies, RequestBodyType.name)) {
                let requestBody = components.requestBodies[RequestBodyType.name]
                RequestBodyType = normalizeTypeName('RequestBody', Object.values(requestBody.content)?.[0])
                contentType = Object.keys(requestBody.content)?.[0] || ''
                parameters.push({
                    description: RequestBodyType.type,
                    name: RequestBodyType.name,
                    in: "body",
                    required: true,
                    ...Object.values(requestBody.content)?.[0]
                })
            }
        } else {
            console.log('其他暂未支持')
        }
    }
    if (hasProp(api, 'parameters')) {
        parameters.push(...api.parameters.map(v => ({
            ...v,
            in: "query",
        })))
    }
    return {
        contentType,
        parameters
    }
}

/**
 * 处理api定义
 * @param {*} path 
 * @param {*} apis 
 */
const genApiDefineItem = function (path, apis, components) {
    let apiDefines = []
    for (let method in apis) {
        let { contentType, parameters } = parseRequestBodyToParameters(apis[method], components)
        let apiDefine = {
            summary: apis[method].summary,
            method: method,
            contentType: contentType,
            path: path,
            operationId: apis[method].operationId,
            responses: apis[method].responses,
            parameters: parameters,
            group: apis[method].tags?.[0] || 'all'
        }
        apiDefines.push(apiDefine)
    }
    return apiDefines
}

/**
 * 处理api定义
 * @param {*} api_paths 
 */
const buildApiDefine = function (api_paths, components) {
    // 统一api信息定义
    let defines = []
    for (let path in api_paths) {
        defines.push(...genApiDefineItem(path, api_paths[path], components))
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
                enums: property_type.enums
            })
        }
    }
    return propertyDefine
}


const normalizeApiSchemas = function (api_define) {
    return {
        apis: buildApiDefine(api_define.paths, api_define.components),
        models: buildModelDefine(api_define.components.schemas),
    }
}
const run = function (api_define) {
    return normalizeApiSchemas(api_define)
}
exports.run = run