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
    case 'symbol':
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
      String(value);
      break;
    case 'object':
      if (value === null) {
        value = 'null';
      }
      break;
  }

  return {key, value};
};

module.exports = (initialValue, options) => {
  options = Object.assign(
    {
      replacer: defaultReplacer,
      newLine: false,
      indent: 0,
      keyValueIndent: 0,
    },
    options,
  );

  const newLine = options.newLine ? '\n' : '';
  const indent = ' '.repeat(options.indent);
  const keyValueIndent = ' '.repeat(options.keyValueIndent);
  const {replacer} = options;

  const builder = (value, currentIndent) => {
    const valueIndent = currentIndent + indent;
    if (Array.isArray(value)) {
      const values = value
        .map(el => builder(el, valueIndent))
        .filter(el => typeof el !== 'undefined')
        .join(`,${newLine}${valueIndent}`);
      return `[${newLine}${valueIndent}${values}${newLine}${currentIndent}]`;
    }

    if (value && typeof value === 'object') {
      let values = [];
      for (const key of Reflect.ownKeys(value)) {
        if (Object.hasOwnProperty.call(value, key)) {
          let {key: newKey, value: newValue} = replacer(key, value[key]);
          if (typeof newValue === 'object') {
            newValue = builder(newValue, valueIndent);
          }

          if (typeof newValue !== 'undefined' && typeof newValue !== 'function') {
            values.push(`"${newKey}":${keyValueIndent}${newValue}`);
          }
        }
      }

      values = values.join(`,${newLine}${valueIndent}`);
      return values.length ? `{${newLine}${valueIndent}${values}${newLine}${currentIndent}}` : '{}';
    }

    const {value: newValue} = replacer(null, value);
    return newValue === undefined ? undefined : `${newValue}`;
  };

  return builder(initialValue, '');
};
