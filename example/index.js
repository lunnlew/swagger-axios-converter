const { Extractor, Generator, FileWriter } = require('../src/index')

Extractor.measure('https://app.swaggerhub.com/apiproxy/registry/wangyf/Cable/1.0.0').then(res => {
    FileWriter.write(Generator.run(Extractor.parse(res)), {
        output: './dist'
    })
})