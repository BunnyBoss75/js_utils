const {IntegerWriter} = require('./integerWriters');

const recursiveMapWalker = (curr, context) => {
  switch (typeof curr) {
    case 'number':
    case 'bigint':
      context.numberMap.set(curr, (context.numberMap.get(curr) || 0) + 1);
      break;
    case 'string':
    case 'symbol':
      context.stringMap.set(curr, (context.stringMap.get(curr) || 0) + 1);
      break;
    case 'object':
      if (curr === null) {
        break;
      }

      if (curr instanceof RegExp) {
        context.stringMap.set(curr, (context.stringMap.get(curr) || 0) + 1);
        break;
      }

      if (Array.isArray(curr)) {
        for (let i = 0, len = curr.length; i < len; ++i) {
          recursiveMapWalker(curr[i], context);
        }
        break;
      }

      const keys = Reflect.ownKeys(curr);
      for (let i = 0, len = keys.length; i < len; ++i) {
        recursiveMapWalker(curr[keys[i]], context);
      }
      break;
    case 'function':
    case 'boolean':
    case 'undefined':
      break;
  }
};

const jsonCompress = (obj, options) => {
  const context = {
    stringMap: new Map(),
    numberMap: new Map(),
    primitiveRefMap: new Map(),
    stringRefMap: new Map(),
    null: new IntegerWriter({type: 8}),
    bool: new IntegerWriter({type: 8}),
    schemaDict: new IntegerWriter({type: 8}),
    shema: new IntegerWriter({type: 8}),
    primitiveDict: new IntegerWriter({type: 8}),
    primitive: new IntegerWriter({type: 8}),
    primitiveTags: new IntegerWriter({type: 8}),
    stringDict: new IntegerWriter({type: 8}),
    string: new IntegerWriter({type: 8}),
    stringTags: new IntegerWriter({type: 8}),
    stringVariation: new IntegerWriter({type: 8}),
    reference: new IntegerWriter({type: 8}),
  };

  // TODO: calculate schemas
  recursiveMapWalker(obj, context);
};

module.exports = {
  jsonCompress,
}
