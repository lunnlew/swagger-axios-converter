/**
 * 请求数据
 * @param {*} options 
 * @returns 
 */
const request = async function (options) {
    let url = options
    let res = await new Promise((resolve, reject) => {
        if (url.indexOf('https:') === 0) {
            const https = require('https')
            https.get(url, res => {
                let data = ''
                res.setEncoding("utf-8");
                res.on('data', (chunk) => {
                    data += chunk
                })
                res.on('end', () => resolve({
                    data,
                    'type': res.headers['content-type']
                }))
                res.on('error', (e) => reject(e));
            })
        } else if (url.indexOf('http:') === 0) {
            const http = require('http')
            http.get(url, res => {
                let data = ''
                res.setEncoding("utf-8");
                res.on('data', (chunk) => {
                    data += chunk
                });
                res.on('end', () => resolve({
                    data,
                    'type': res.headers['content-type']
                }))
                res.on('error', (e) => reject(e));
            })
        } else {
            resolve()
        }
    })
    return res || {
        data: '',
        'type': data['type'] || 'application/json;charset=UTF-8'
    }
}

exports.request = request