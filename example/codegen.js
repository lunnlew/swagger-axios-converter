const { codegen } = require("../src/index");
codegen({
    outputDir: './service',
    responseMockTransform: (prop, models, enums) => {
        console.log(prop)
    },
    mockDefines: [
        {
          name: 'addTime',
          type: ['string', 'Date'],
          rule: '\'addTime\':\'@datetime\''
        }
    ],
    useCustomerRequestInstance: true,
    useStaticMethod: true,
    useMultipleSource: true,
    'remoteUrl': [{
    	'name':'default',
    	'remoteUrl':'http://127.0.0.1/v2/api-docs'
    }]
})