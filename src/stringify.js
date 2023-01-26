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
      value = isFinite(value) ? value.toString() : 'null';
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

  const seen = new Set();

  const builder = (k, v, currentIndent) => {
    const valueIndent = currentIndent + indent;

    const {value, key} = replacer(k, v);

    if (Array.isArray(value)) {
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
        .filter(el => typeof el !== 'undefined')
        .join(`,${newLine}${valueIndent}`);

      seen.delete(value);

      return {key, value:`[${newLine}${valueIndent}${values}${newLine}${currentIndent}]`};
    }

    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        if (ignoreCycles) {
          return {key, value: '"__cycle__"'};
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      let values = [];

      let keys = Reflect.ownKeys(value);
      if (ignoreSymbols) {
        keys = keys.filter(key => typeof key === 'string');
      }
      if (comparator) {
        keys = keys.sort(comparator);
      }

      for (const valueKey of keys) {
        if (Object.hasOwnProperty.call(value, valueKey)) {
          const {key: newKey, value: newValue} = builder(valueKey, value[valueKey], valueIndent) || {};

          if (typeof newValue !== 'undefined') {
            values.push(`"${newKey}":${keyValueIndent}${newValue}`);
          }
        }
      }

      seen.delete(value);

      return {
        key,
        value: values.length ?
          `{${newLine}${valueIndent}${values.join(`,${newLine}${valueIndent}`)}${newLine}${currentIndent}}` :
          '{}',
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
