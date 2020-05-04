# swagger-axios-converter
`swagger api`文档转换为`vue axios`接口定义生成工具

## codegen使用
[mock参考](http://mockjs.com/examples.html)
```js
const { codegen } = require('swagger-axios-converter')
codegen({
    outputDir: './src/services',
    mockDir: './src/mock',
    responseMockTransform: (prop, models, enums) => {
    	console.log(prop)
    	let ruleResult = undefined
    	switch(prop.type){
	        case 'string':{
	            ruleResult = `'${prop.name}':'@string(10)'`
	            break;
	        }
	        case 'string[]':{
	            ruleResult = `'${prop.name}|1-10':'@string(10)'`
	            break;
	        }
	        case 'object':{
	            ruleResult = `'${prop.name}':'{}'`
	            break;
	        }
	        case 'number':{
	            ruleResult = `'${prop.name}|1-1000':1`
	            break;
	        }
	        default: {break;}
	    }
	    return ruleResult
    },
    mockDefines: [{
        name: 'name',
        type: 'string',
        rule: '\'name\':\'@cname\''
    }, {
        name: 'code',
        type: 'string',
        rule: '\'code|1\':[\'S\',\'E\']'
    }, {
        name: 'message',
        type: 'string',
        rule: '\'message|1\':[\'操作成功\',\'操作失败\']'
    }, {
        name: 'addTime',
        type: ['string', 'Date'],
        rule: '\'addTime\':\'@datetime\''
    }
    ],
    useCustomerRequestInstance: true,
    useStaticMethod: true,
    useMultipleSource: true,
    remoteUrl: [{
        name: 'default',
        remoteUrl:'http://127.0.0.1/v2/api-docs'
    }]
})
```

## mock使用
以vue为例: 在main.js导入mock.js文件
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