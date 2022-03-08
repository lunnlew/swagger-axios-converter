const { normalizeStr, normalizeTypeName } = require("../../Util/util")

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
        // TODO property.properties
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
            contentType: apis[method].consumes?.[0] || '',
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

const normalizeApiSchemas = function (api_define) {
    return {
        apis: buildApiDefine(api_define.paths),
        models: buildModelDefine(api_define.definitions),
    }
}
const run = function (api_define) {
    return normalizeApiSchemas(api_define)
}
exports.run = run