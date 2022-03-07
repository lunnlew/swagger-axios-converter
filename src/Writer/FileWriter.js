const path = require("path")
const fs = require("fs")
const { code_format } = require("../Util/util")

const write = function (files, options) {
    const path_dir = options.output || './'
    if (options.clear) {
        fs.rmSync(path_dir, { recursive: true, force: true })
    }
    for (let file of files) {
        let file_path = path.join(path.resolve(path_dir), file.filename)
        let file_dir = path.dirname(file_path)
        if (!fs.existsSync(file_dir)) {
            fs.mkdirSync(file_dir, {
                recursive: true
            })
        }
        fs.writeFileSync(file_path, options.format ? code_format(file.content) : file.content)
    }
}

exports.write = write