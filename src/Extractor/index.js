const { request } = require("../Util/request")
const SWAGGER_VERSION_2 = '2.0'
const OPENAPI_VERSION_3 = '3.0.0'

/**
 * 类型探测
 * @param {*} data 
 * @returns 
 */
const measure = function (data) {
    if (data.type.indexOf('application/json') !== -1) {
        let source_data
        try {
            source_data = JSON.parse(data.data)
        } catch (err) {
            console.log('解析出错')
        }
        if (source_data) {
            if (source_data.swagger) {
                if (source_data.swagger === SWAGGER_VERSION_2) {
                    return {
                        type: 'swagger',
                        version: SWAGGER_VERSION_2,
                        data: source_data
                    }
                }
            } else if (source_data.openapi) {
                if (source_data.openapi === OPENAPI_VERSION_3) {
                    return {
                        type: 'openapi',
                        version: OPENAPI_VERSION_3,
                        data: source_data
                    }
                }
            } else {
                throw new Error('暂未支持的数据源')
            }
        }
    }
}

/**
 * 获取远程内容
 * @param {*} data 
 * @returns 
 */
const fetch = async function (url) {
    return measure(await request(url))
}

/**
 * 分析内容
 * @param {*} data 
 * @returns 
 */
const parse = function (content) {
    const { type, version, data } = content
    let parser
    if (type === 'swagger') {
        parser = require('./Swagger/parser_' + version)
    } else if (type === 'openapi') {
        parser = require('./Openapi/parser_' + version)
    } else {
        throw new Error('尚未支持的解析类型: ' + type + ' ' + version)
    }
    return parser.run(data)
}

exports.fetch = fetch
exports.parse = parse