const { normalizeStr, normalizeTypeName, hasProp } = require("../Util/util")
class InterimApiDefine {
    data = {};
    version = '3.0.0'
    constructor(content) {
        this.data = content.data
        this.version = content.version
    }
    get paths() {
        return this.data.paths
    }
    get info() {
        return this.data.info
    }
    get schemas() {
        return this.data.components.schemas
    }
    build() {
        return {
            apis: this.buildPathDefine(),
            models: this.buildModelDefine(),
        }
    }
    requestBodys() {
        let data = []
        for (let refName in this.data.components.requestBodies) {
            let item = this.data.components.requestBodies[refName]
            for (let contentType in item.content) {
                data.push({
                    ...item.content[contentType],
                    description: item.description,
                    refName,
                    contentType: contentType,
                    required: item.required
                })
            }
        }
        return data
    }
    buildPathDefine() {
        let defines = []
        let api_paths = this.paths
        for (let path in api_paths) {
            defines.push(...this.genApiDefineItem(path, api_paths[path]))
        }
        return defines
    }
    genApiDefineItem(path, apis) {
        let apiDefines = []
        for (let method in apis) {
            let { contentType, parameters } = this.parseRequestBodyToParameters(apis[method])
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
    getRequestBodysSchema(requestBody, components) {
        if (hasProp(requestBody, 'content')) {
            let data = []
            for (let contentType in requestBody.content) {
                let RequestBodyRefType = normalizeTypeName('RequestBody', requestBody.content[contentType])
                data.push({
                    schema: requestBody.content[contentType.schema],
                    contentType: contentType,
                    refName: RequestBodyRefType.name,
                    required: true
                })
            }
            return data
        } else if (hasProp(requestBody, '$ref') && hasProp(components, 'requestBodies')) {
            let RequestBodyRefType = normalizeTypeName('RequestBody', requestBody)
            return this.requestBodys().filter(v => v.refName === RequestBodyRefType.name)
        } else {
            return []
        }
    }
    parseRequestBodyToParameters(api) {
        let parameters = []
        let contentType = ''
        if (hasProp(api, 'requestBody')) {
            let RequestBodysSchema = this.getRequestBodysSchema(api.requestBody, this.data.components)
            let DefaultRequestBody = RequestBodysSchema.find(v => v.contentType === 'application/json')
            DefaultRequestBody = DefaultRequestBody || RequestBodysSchema.pop()
            if (DefaultRequestBody) {
                let RequestBodyType = normalizeTypeName('RequestBody', DefaultRequestBody)
                parameters.push({
                    description: RequestBodyType.type,
                    name: DefaultRequestBody.refName,
                    in: "body",
                    required: DefaultRequestBody.require,
                    schema: DefaultRequestBody.schema
                })
            }
        }
        if (hasProp(api, 'parameters')) {
            parameters.push(...api.parameters.map(v => ({
                ...v,
                in: v.in || "query",
            })))
        }
        return {
            contentType,
            parameters
        }
    }
    buildModelDefine() {
        let defines = []
        let models = this.schemas
        for (let key in models) {
            defines.push(this.genModelDefineItem(key, models[key]))
        }
        return defines
    }
    genModelDefineItem(name, model) {
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
                type: property_type.name,
                properties: property.properties ? Object.keys(property.properties).map(k => {
                    let p = property.properties[k]
                    let p_type = normalizeTypeName(normalizeStr(k), p)
                    return {
                        summary: k,
                        name: k,
                        type: p_type.name
                    }
                }) : undefined
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
}
exports.InterimApiDefine = InterimApiDefine