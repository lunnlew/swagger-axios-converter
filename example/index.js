const { Extractor, Generator, FileWriter } = require('../src/index')

Extractor.fetch('https://app.swaggerhub.com/apiproxy/registry/Oorjit/payment-platform_api/V1').then(res => {
    FileWriter.write(Generator.run(Extractor.parse(res)))
})