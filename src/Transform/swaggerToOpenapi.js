function run(content) {
    return {
        type: "3.0.0",
        data: {
            openapi: "3.0.0",
            paths: content.data.paths,
            info: content.data.info,
            tags: content.data.tags,
            components: {
                schemas: content.data.definitions
            },
            servers: [
                {
                    description: content.data.info.description,
                    url: content.data.host + content.data.basePath
                }
            ]
        }
    }
}
exports.run = run