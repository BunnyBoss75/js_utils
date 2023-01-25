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

  const builder = (k, v, currentIndent) => {
    const valueIndent = currentIndent + indent;

    const {value, key} = replacer(k, v);

    if (Array.isArray(value)) {
      if (!value.length) {
        return {key, value: '[]'};
      }

      if (seen.has(value)) {
        if (ignoreCycles) {
          return {key, value: '"__cycle__"'};
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      const values = value
        .map(el => (builder(null, el, valueIndent) || {}).value)
        .join(`,${newLine}${valueIndent}`);

      seen.delete(value);

      return {key, value: `[${newLine}${valueIndent}${values}${newLine}${currentIndent}]`};
    }

    if (value && typeof value === 'object') {
      let keys = getKeys(value);
      if (!keys.length) {
        return {key, value: '{}'};
      }

      if (seen.has(value)) {
        if (ignoreCycles) {
          return {key, value: '"__cycle__"'};
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      if (comparator) {
        keys = keys.sort(comparator);
      }

      const values = keys
        .map(valueKey => {
          if (Object.hasOwnProperty.call(value, valueKey)) {
            const {key: newKey, value: newValue} = builder(valueKey, value[valueKey], valueIndent) || {};

            if (newValue !== undefined) {
              return `"${newKey}":${keyValueIndent}${newValue}`;
            }
          }
        })
        .join(`,${newLine}${valueIndent}`);

      seen.delete(value);

      return {
        key,
        value: `{${newLine}${valueIndent}${values}${newLine}${currentIndent}}`,
      };
    }

    return value === undefined ? undefined : {key, value: `${value}`};
  };

  const {value = ''} = builder(null, initialValue, '') || {};
  return value;
};

module.exports = {
  stringify,
  defaultOptions,
  defaultReplacer,
};
