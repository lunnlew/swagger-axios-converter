const { Extractor, Generator, FileWriter } = require('../src/index')

Extractor.fetch('https://app.swaggerhub.com/apiproxy/registry/Oorjit/payment-platform_api/V1').then(res => {
    FileWriter.write(Generator.run(Extractor.parse(res), {
        api_base: '/222/',
        /**
         * 代码风格
         */
        code_style: 'class',
        /**
         * 类单一文件声明
         */
        single_class_declare: false,
        /**
         * 是否内嵌模型声明
         */
        inline_model_declare: false,
        /**
         * 类文件路径模板
         */
        class_file_path_tpl: '{group_name}/{class_name}.ts',
        /**
         * 分组名
         */
        group_name: 'common'
    }), {
        /**
         * 输出位置
         */
        output: './dist',
        /**
         * 是否先清空目录
         */
        clear: true,
        /**
         * 是否格式化
         */
        format: true
    })
})