const {IntegerWriter} = require('./integerWriters');
const {ArrayKeyMap} = require('./arrayKeyMap');

const schemaTokens = {
  null: 1 << 0,
  nullInverse: ~(1 << 0),

  primitive: 1 << 1,
  string: 1 << 2,
  bool: 1 << 3,
  array: 1 << 4,
  object: 1 << 5,

  unsupported: -1,
};


const inferType = v => {
  switch (typeof v) {
    case 'number':
    case 'bigint':
      return schemaTokens.primitive;
    case 'string':
    case 'symbol':
      return schemaTokens.string;
    case 'object':
      if (v === null) {
        return schemaTokens.null;
      } else if (Array.isArray(v)) {
        return schemaTokens.array;
      } else {
        return schemaTokens.object;
      }
    case 'boolean':
      return schemaTokens.bool;
    case 'function':
    case 'undefined':
      return schemaTokens.unsupported;
  }
};

class SchemaProcessor {
  constructor(options) {
    this.map = new ArrayKeyMap();
  }

  takeNewSchema(keys, types) {
    const filteredKeys = keys.filter((key, index) => types[index] !== schemaTokens.unsupported);
    const filteredTypes = types.filter((type) => type !== schemaTokens.unsupported);

    const typesMap = this.map.get(filteredKeys);
    if (typesMap === undefined) {
      const newMap = new ArrayKeyMap();
      newMap.set(filteredTypes, 1);
      this.map.set(filteredKeys, newMap);
    } else {
      typesMap.set(filteredTypes, (typesMap.get(filteredTypes) || 0) + 1);
    }
  }

  ingest() {
    const allKeys = this.map.keys();

    // TODO: check do we need to cache length of array
    for (let i = 0; i < allKeys.length; ++i) { // set of keys
      const info = this.map.get(allKeys[i]);
      const types = info.keys();

      for (let j = 0; j < types.length; ++j) { // set of types for keys
        let type1 = types[j];
        for (let k = j + 1; k < types.length; ++k) { // matched set of types for keys
          const type2 = types[k];
          if (SchemaProcessor._matchTypes(type1, type2)) {
            const newType = new Array(type1.length).fill(null);
            for (let x = 0; x < type1.length; ++x) { // join types
              newType[x] = type1[x] | type2[x];
            }
            info.set(newType, info.get(type1) + info.get(type2));
            info.delete(type1);
            info.delete(type2);
            types[k] = types[types.length - 1]; // replace k with new not processed
            types.pop();
            --k;
            type1 = newType;
            // types[j] = newType;
          }
        }
      }
    }
  }

  static _matchTypes(type1, type2) {
    for (let i = 0; i < type1.length; ++i) {
      const v1 = type1[i] & schemaTokens.nullInverse;
      const v2 = type2[i] & schemaTokens.nullInverse;
      if (v1 && v2 && v1 !== v2) { // v1 not null and v2 not null and types not match
        return false;
      }
    }

    return true;
  }
}

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

      // TODO: make strict in case of symbols if needed
      const keys = Reflect.ownKeys(curr).sort();
      const len = keys.length;
      const types = new Array(len).fill(null);
      for (let i = 0; i < len; ++i) {
        recursiveMapWalker(curr[keys[i]], context);
        types[i] = inferType(curr[keys[i]]);
      }

      context.objectSchemaProcessor.takeNewSchema(keys, types);
      break;
    case 'boolean':
    case 'function':
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
    objectSchemaProcessor: new SchemaProcessor(),
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
