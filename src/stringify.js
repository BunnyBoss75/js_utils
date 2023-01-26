const microUtils = require('./microUtils');
const stringBuilder = require('./experimental/stringBuilder');

const defaultReplacer = (key, value) => {
  if (typeof key !== 'string' && key !== null) {
    if (key.toString) {
      key = key.toString();
    } else {
      key = String(key);
    }
  }

  if (value && typeof value.toJSON === 'function') {
    value = value.toJSON();
  }

  switch (typeof value) {
    case 'string':
      // TODO: escape sequence
      value = `"${value}"`;
      break;
    case 'symbol':
    case 'bigint':
      value = value.toString();
      break;
    case 'function':
    case 'undefined':
      value = undefined;
      break;
    case 'number':
      value = isFinite(value) ? value.toString() : undefined;
      break;
    case 'boolean':
      value = String(value);
      break;
    case 'object':
      if (value === null) {
        value = 'null';
      } else if (value instanceof RegExp) {
        value = `"RegExp(${value.toString()})"`;
      }

      break;
  }

  return {key, value};
};

const defaultOptions = {
  replacer: defaultReplacer,
  comparator: microUtils.defaultStringSymbolCompare,
  newLine: false,
  indent: 0,
  keyValueIndent: 0,
  ignoreCycles: false,
  ignoreSymbols: false,
}

const stringify = (initialValue, options) => {
  options = {
    ...defaultOptions,
    ...options,
  };

  const newLine = options.newLine ? '\n' : '';
  const indent = ' '.repeat(options.indent);
  const keyValueIndent = ' '.repeat(options.keyValueIndent);
  const {replacer, ignoreCycles, ignoreSymbols, comparator} = options;

  const getKeys = ignoreSymbols ? Object.keys : Reflect.ownKeys;

  const seen = new Set();

  let result = new stringBuilder();

  const builder = (k, v, currentIndent, addKey, comma) => {
    const {key, value} = replacer(k, v);

    const valueIndent = currentIndent + indent;
    const keyString = (comma ? ',' : '') + newLine + currentIndent + (addKey ? `"${key}":${keyValueIndent}` : '');

    if (Array.isArray(value)) {
      if (seen.has(value)) {
        if (ignoreCycles) {
          result.add(keyString + '"__cycle__"');
          return true;
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      result.add(keyString + '[');

      let isFirst = true;
      for (const el of value) {
        if (builder(null, el, valueIndent, false, !isFirst)) {
          if (isFirst) {
            isFirst = false;
          }
        }
      }

      if (isFirst) {
        result.add(']');
      } else {
        result.add(`${newLine}${currentIndent}]`);
      }

      seen.delete(value);

      return true;
    }

    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        if (ignoreCycles) {
          result.add(keyString + '"__cycle__"');
          return true;
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      let keys = getKeys(value);
      if (comparator) {
        keys = keys.sort(comparator);
      }

      result.add(keyString + '{');

      let isFirst = true;
      for (const valueKey of keys) {
        if (Object.hasOwnProperty.call(value, valueKey)) {
          if (builder(valueKey, value[valueKey], valueIndent, true, !isFirst)) {
            if (isFirst) {
              isFirst = false;
            }
          }
        }
      }

      if (isFirst) {
        result.add('}');
      } else {
        result.add(`${newLine}${currentIndent}}`);
      }

      seen.delete(value);

      return true;
    }

    if (value === undefined) {
      return false;
    } else {
      result.add(keyString + `${value}`);
      return true;
    }
  };

  builder(null, initialValue, '', false, false)

  return result.toString().slice(1);
};

module.exports = {
  stringify,
  defaultOptions,
  defaultReplacer,
};
