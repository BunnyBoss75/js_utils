const microUtils = require('./microUtils');

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

  const builder = (k, v, currentIndent, addKey) => {
    const {value, key} = replacer(k, v);

    const valueIndent = currentIndent + indent;
    const keyString = addKey ? `"${key}":${keyValueIndent}` : '';

    if (Array.isArray(value)) {
      if (seen.has(value)) {
        if (ignoreCycles) {
          return keyString + '"__cycle__"';
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      const values = value
        .map(el => builder(null, el, valueIndent, false))
        .filter(el => el !== undefined)
        .join(`,${newLine}${valueIndent}`);

      seen.delete(value);

      return values.length ?
        `${keyString}[${newLine}${valueIndent}${values}${newLine}${currentIndent}]` :
        `${keyString}[]`;
    }

    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        if (ignoreCycles) {
          return keyString + '"__cycle__"';
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      let keys = getKeys(value);
      if (comparator) {
        keys = keys.sort(comparator);
      }

      const values = keys
        .map(valueKey => Object.hasOwnProperty.call(value, valueKey) ?
          builder(valueKey, value[valueKey], valueIndent, true) : undefined)
        .filter(el => el !== undefined)
        .join(`,${newLine}${valueIndent}`);

      seen.delete(value);

      return values.length ?
        `${keyString}{${newLine}${valueIndent}${values}${newLine}${currentIndent}}` :
        `${keyString}{}`;
    }

    return value === undefined ? undefined : keyString + `${value}`;
  };

  return builder(null, initialValue, '', false) || '';
};

module.exports = {
  stringify,
  defaultOptions,
  defaultReplacer,
};
