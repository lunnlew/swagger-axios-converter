const { codegen } = require("../src/index");
codegen({
    outputDir: './service',
    useCustomerRequestInstance: true,
    useStaticMethod: true,
    useMultipleSource: true,
    'remoteUrl': [{
    	'name':'default',
    	'remoteUrl':'http://127.0.0.1/v2/api-docs'
    }]
})