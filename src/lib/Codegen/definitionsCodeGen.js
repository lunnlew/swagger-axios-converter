const {
    convertJsType,
    isGenerics,
    genRefName,
    getEnums,
    propAttr,
    hasProp
} = require("../utils/index")


// 导出类定义
var createDefinitionClass = function (className, properties, required) {
    var _a;
    let enums = [];
    let types = [];
    let model = { name: className, props: [], imports: [] };
    const propertiesEntities = Object.entries(properties || {});
    for (const [k, v] of propertiesEntities) {
        let { propType, isEnum, isArray, isType, ref, items } = propAttr(v);
        // 数据枚举
        if (isEnum) {
            let enumName = `Enum${className}${k}`;
            enums.push({
                name: enumName,
                description: v.description,
                items,
                text: `export enum ${enumName}{
        ${propType}
      }`
            });
            propType = isArray ? enumName + '[]' : enumName;
            ref = enumName;
        }
        // 类型枚举
        if (isType) {
            let typeName = `I${className}${k}`;
            enums.push({
                name: typeName,
                description: v.description,
                items,
                text: `type ${typeName} = ${propType};`
            });
            propType = isArray ? typeName + '[]' : typeName;
            ref = typeName;
        }
        // 是否有引用
        if (!!ref) {
            model.imports.push(ref);
        }
        model.props.push({
            name: k,
            type: propType,
            format: v.format,
            description: v.description,
            isType,
            isEnum
        });
    }
    return { enums, model };
}

// 导出枚举定义
var createDefinitionEnum = function (className, enumArray, type) {
    let result = '';
    let items = [];
    items = getEnums(enumArray)
    if (type === 'string') {
        result = items.map(item => `'${item}'='${item}'`).join(',')
    } else {
        result = items.join('|')
    }
    return { name: className, enumProps: result, type: type, items };
}

// 属性定义代码生成
var definitionsCodeGen = function (definitions) {
    let definitionModels = {};
    let definitionEnums = {};
    if (!!definitions) {
        for (const [k, v] of Object.entries(definitions)) {
            let className = genRefName(k);
            if (isGenerics(className)) {
                continue;
            }
            if (hasProp(v, 'enum')) {
                const enumDef = createDefinitionEnum(className, v.enum, v.type);
                definitionEnums[`#/definitions/${k}`] = {
                    name: enumDef.name,
                    value: enumDef,
                    items: enumDef.items,
                    description: v.description
                };
            } else {
                const { enums, model } = createDefinitionClass(className, v.properties, v.required);
                enums.forEach(item => {
                    definitionEnums[`#/definitions/${item.name}`] = {
                        name: item.name,
                        content: item.text,
                        items: item.items,
                        description: item.description
                    };
                });
                definitionModels[`#/definitions/${k}`] = {
                    value: model,
                    name: className,
                    description: v.description
                };
            }
        }
    }
    return { models: definitionModels, enums: definitionEnums };
}


exports.definitionsCodeGen = definitionsCodeGen