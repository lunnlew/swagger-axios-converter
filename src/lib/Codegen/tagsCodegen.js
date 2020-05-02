const {
    genClassNameFromTags
} = require("../utils/index")

// 导出标签类注释
var tagsCodegen = function (tags) {
    const requestTags = {}
    for (const tag of tags) {
        let className = genClassNameFromTags([tag.name]);
        requestTags[className] = {
            description: tag.description
        }
    }
    return { requestTags };
}

exports.tagsCodegen = tagsCodegen