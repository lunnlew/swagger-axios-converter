const fs = require("fs")
const path = require("path")
const { default: axios } = require('axios');
var cacheSwagger = (remoteUrl) => {
	return {
		fetch: () => {
			console.log('fetch remoteUrl:', remoteUrl)
			return new Promise((resolve, reject) => {
				axios.get(remoteUrl).then(function (res) {
					var swaggerJson = res.data
					var swaggerSource
					if (Object.prototype.toString.call(swaggerJson) === '[object String]') {
						fs.writeFileSync('./cache_swagger.json', swaggerJson);
						swaggerSource = require(path.resolve('./cache_swagger.json'));
					} else {
						swaggerSource = swaggerJson
					}
					resolve({
						'swaggerJson': swaggerSource
					})
				}).catch(err => {
					console.log('fetch err:', err)
					reject(err)
				})

			})
		}
	}
}
exports.cacheSwagger = cacheSwagger