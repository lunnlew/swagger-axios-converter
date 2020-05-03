# swagger-axios-converter
`swagger api`文档转换为`vue axios`接口定义生成工具

## mock应用
[mock参考](http://mockjs.com/examples.html)
```js
mockDefines: [
	{
		name: 'addTime',
		type: ['string', 'Date'],
		rule: '\'addTime\':\'@datetime\''
	}
]
```

```js
// main.js
import './mock'

// mock.js
const Mock = require('mockjs2')
const requireModule = require.context('.', true, /\.js$/)
requireModule.keys().forEach(fileName => {
  if (fileName === './index.js') return
  requireModule(fileName)
})
Mock.setup({
  timeout: 800 // setter delay time
})
````

### 参考
[json-schema](https://tools.ietf.org/html/draft-fge-json-schema-validation-00)
[swagger-v2](https://swagger.io/specification/v2/)