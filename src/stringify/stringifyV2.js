const microUtils = require('../microUtils');

const jsonEscapeMapping = {
  0x08: '\\b',
  0x09: '\\t',
  0x0a: '\\n',
  0x0c: '\\f',
  0x0d: '\\r',
  0x22: '\\\"',
  0x5c: '\\\\',
};
const escapeString = (string) => {
  let result = '';
  const length = string.length;
  for (let i = 0; i < length; ++i) {
    const char = string.charCodeAt(i);
    if (jsonEscapeMapping[char]) {
      result += jsonEscapeMapping[char];
    } else if (char < 0x20) {
      const number = char.toString(16);
      result += `\\u${'0'.repeat(4 - number.length)}${number}`;
    } else if (0xd800 <= char && char <= 0xdfff) {
      // The current character is a surrogate.
      if (char <= 0xdbff) {
        // The current character is a leading surrogate.
        if (i + 1 < length) {
          // There is a next character.
          const next = string.charCodeAt(i + 1);
          if (0xdc00 <= next && next <= 0xdfff) {
            // The next character is a trailing surrogate, meaning this is a
            // surrogate pair.
            result += String.fromCharCode(char) + String.fromCharCode(next);
            ++i;
          } else {
            // The next character is not a trailing surrogate. Thus, the
            // current character is a lone leading surrogate.
            const number = char.toString(16);
            result += `\\u${'0'.repeat(4 - number.length)}${number}`;
          }
        } else {
          // There is no next character. Thus, the current character is a lone
          // leading surrogate.
          const number = char.toString(16);
          result += `\\u${'0'.repeat(4 - number.length)}${number}`;
        }
      } else {
        // The current character is a lone trailing surrogate. (If it had been
        // preceded by a leading surrogate, we would've ended up in the other
        // branch earlier on, and the current character would've been handled
        // as part of the surrogate pair already.)
        const number = char.toString(16);
        result += `\\u${'0'.repeat(4 - number.length)}${number}`;
      }
    } else {
      result += String.fromCharCode(char);
    }
  }
  return result;
};
const cycleString = '__cycle__';

const defaultOptions = {
  replacer: null,
  comparator: true,
  newLine: false,
  indent: 0,
  keyValueIndent: 0,
  ignoreCycles: true,
  ignoreSymbols: false,
};

const getValidOptions = (options) => {
  options = {
    ...defaultOptions,
    ...(options || {}),
  };

  const resultOptions = {};

  resultOptions.ignoreCycles = !!options.ignoreCycles;
  resultOptions.ignoreSymbols = !!options.ignoreSymbols;
  resultOptions.newLine = !!options.newLine;


  if (typeof options.replacer !== 'function') {
    resultOptions.replacer = null;
  } else {
    resultOptions.replacer = options.replacer;
  }

  if (options.comparator === true) {
    resultOptions.comparator = options.ignoreSymbols ?
      microUtils.defaultStringCompare :
      microUtils.defaultStringSymbolCompare;
  } else if (typeof options.comparator !== 'function') {
    resultOptions.comparator = null;
  } else {
    resultOptions.comparator = options.comparator;
  }

  if (!Number.isInteger(options.indent)) {
    if (Number.isFinite(options.indent)) {
      resultOptions.indent = Math.round(options.indent)
    } else {
      resultOptions.indent = 0;
    }
  } else {
    resultOptions.indent = options.indent;
  }

  if (!Number.isInteger(options.keyValueIndent)) {
    if (Number.isFinite(options.keyValueIndent)) {
      resultOptions.keyValueIndent = Math.round(options.keyValueIndent)
    } else {
      resultOptions.keyValueIndent = 0;
    }
  } else {
    resultOptions.keyValueIndent = options.keyValueIndent;
  }

  return resultOptions;
};

const createBuildCode = (options) => {
  const paramListStart = ['context', 'options', 'seen', 'value'];
  const paramList = [...paramListStart, 'key', 'comma'];
  if (options.indent) {
    paramList.push('indent');
  }

  const addKeyCode = `
    if (comma === true) {
      context.str += ',';
    }
${
  options.indent && options.newLine ? `
    context.str += '\\n' + ' '.repeat(indent);` : options.indent ? `
    context.str += ' '.repeat(indent);\`` : options.newLine ? `
    context.str += '\\n';` : ''}
    if (key !== null) {
      context.str += \`"\${options.escapeString(
        typeof key === 'string' ?
        key : typeof key.toString === 'function' ?
        key.toString() : String(key))}":${' '.repeat(options.keyValueIndent)}\`;
    }
  `;

  const checkSeenCode = `
      if (seen.has(value)) {
${options.ignoreCycles ? `
${addKeyCode}
        context.str += '"${cycleString}"';
        return true;` : `
        throw new Error('Cycle reference during stringify object');`}
      }
  `;

  let buildCode = '';
  let startBuildCode = '';

  if (options.indent) {
    buildCode += `
    const valueIndent = indent + ${options.indent};
    `;
  }

  if (options.replacer !== null) {
    const replacerPart = `
    const replacerResult = options.replacer(key, value);
    if (key !== null) {
      key = replacerResult.key;
    }
    value = replacerResult.value;
    `;
    buildCode += replacerPart;
    startBuildCode += replacerPart;
  }

  const toJsonPart = `
    if (value && typeof value.toJSON === 'function') {
      value = value.toJSON();
    }
  `;
  buildCode += toJsonPart;
  startBuildCode += toJsonPart;

  buildCode += `
    if (Array.isArray(value)) {
${checkSeenCode}
      seen.add(value);

${addKeyCode}

      context.str += '[';

      let isFirst = true;
      for (const el of value) {
        if (options.build(context, options, seen, el, null, !isFirst${options.indent ? ', valueIndent' : ''})) {
          if (isFirst) {
            isFirst = false;
          }
        }
      }

${!options.newLine && !options.indent ? '      context.str += \']\';' : `
      if (isFirst) {
        context.str += ']';
      } else {
        context.str += ${options.newLine && options.indent ?
    '\'\\n\' + \' \'.repeat(indent) + \']\'' : options.newLine ?
      '\'\\n]\'' : '\' \'.repeat(indent) + \']\''};
      }`}

      seen.delete(value);

      return true;
    }
    
    if (typeof value === 'object') {
      if (value instanceof RegExp) {
${addKeyCode}
        context.str += \`"RegExp(\${options.escapeString(value.toString())})"\`;
        return true;
      } else if (value === null) {
${addKeyCode}
        context.str += 'null';
        return true;
      }

${checkSeenCode}
      seen.add(value);

      let keys = ${options.ignoreSymbols ? 'Object.keys' : 'Reflect.ownKeys'}(value);
${options.comparator !== null ? '      keys = keys.sort(options.comparator);' : ''}
${addKeyCode}
      context.str += '{';

      let isFirst = true;
      for (const valueKey of keys) {
        if (options.build(context, options, seen, value[valueKey], valueKey, !isFirst${options.indent ? ', valueIndent' : ''})) {
          if (isFirst) {
            isFirst = false;
          }
        }
      }

${!options.newLine && !options.indent ? '      context.str += \'}\';' : `
      if (isFirst) {
        context.str += '}';
      } else {
        context.str += ${options.newLine && options.indent ? 
    '\'\\n\' + \' \'.repeat(indent) + \'}\'' : options.newLine ?
      '\'\\n}\'' : '\' \'.repeat(indent) + \'}\''};
      }`}
      
      seen.delete(value);

      return true;
    }
    
    switch (typeof value) {
      case 'string':
${addKeyCode}
        context.str += \`"\${options.escapeString(value)}"\`;
        return true;
      case 'symbol':
${addKeyCode}
        context.str += \`"\${options.escapeString(value.toString())}"\`;
        return true;
      case 'bigint':
${addKeyCode}
        context.str += value.toString();
        return true;
      case 'function':
      case 'undefined':
        if (key === null) {
          if (comma === true) {
            context.str += ',';
          }
${options.indent && options.newLine ? `
          context.str += '\\n' + ' '.repeat(indent) + 'null';` : options.indent ? `
          context.str += ' '.repeat(indent) + 'null';\`` : options.newLine ? `
          context.str += '\\nnull';` : '          context.str += \'null\''}
          return true;
        }
        return false;
      case 'number':
        if (isFinite(value)) {
${addKeyCode}
          context.str += value.toString();
          return true;
        } else if (key === null) {
          if (comma === true) {
            context.str += ',';
          }
${options.indent && options.newLine ? `
          context.str += '\\n' + ' '.repeat(indent) + 'null';` : options.indent ? `
          context.str += ' '.repeat(indent) + 'null';\`` : options.newLine ? `
          context.str += '\\nnull';` : '          context.str += \'null\''}
          return true;
        } else {
          return false;
        }
      case 'boolean':
${addKeyCode}
        if (value === true) {
          context.str += 'true';
        } else {
          context.str += 'false';
        }
        return true;
    }
  `;

  startBuildCode += `
    if (Array.isArray(value)) {
      seen.add(value);

      context.str = '[';

      let isFirst = true;
      for (const el of value) {
        if (options.build(context, options, seen, el, null, !isFirst${options.indent ? `, ${options.indent}` : ''})) {
          if (isFirst) {
            isFirst = false;
          }
        }
      }

${options.newLine ? `
      if (isFirst) {
        context.str += ']';
      } else {
        context.str += '\\n]';
      }
` : '      context.str += \']\';'}
      return;
    }
    
    if (typeof value === 'object') {
      if (value instanceof RegExp) {
        context.str = \`"RegExp(\${options.escapeString(value.toString())})"\`;
        return true;
      } else if (value === null) {
        context.str = 'null';
        return true;
      }

      seen.add(value);

      let keys = ${options.ignoreSymbols ? 'Object.keys' : 'Reflect.ownKeys'}(value);
${options.comparator !== null ? '      keys = keys.sort(options.comparator);' : ''}
      context.str = '{';

      let isFirst = true;
      for (const valueKey of keys) {
        if (options.build(context, options, seen, value[valueKey], valueKey, !isFirst${options.indent ? `, ${options.indent}` : ''})) {
          if (isFirst) {
            isFirst = false;
          }
        }
      }

${options.newLine ? `
      if (isFirst) {
        context.str += '}';
      } else {
        context.str += '\\n}';
      }
` : '      context.str += \'}\';'}
      return;
    }
    
    switch (typeof value) {
      case 'string':
        context.str = \`"\${options.escapeString(value)}"\`;
      case 'symbol':
        context.str = \`"\${options.escapeString(value.toString())}"\`;
      case 'bigint':
        context.str = value.toString();
      case 'number':
        if (isFinite(value)) {
          context.str = value.toString();
        } else {
          context.str = 'null';
        }
      case 'boolean':
        if (value === true) {
          context.str = 'true';
        } else {
          context.str = 'false';
        }
    }
  `;

  return [
    Function(...paramListStart, startBuildCode),
    Function(...paramList, buildCode),
  ];
};

const createStringify = (options) => {
  options = getValidOptions(options);

  const [startBuild, build] = createBuildCode(options);

  options.escapeString = escapeString;
  options.startBuild = startBuild;
  options.build = build;

  return value => {
    const context = {};
    const seen = new Set();

    options.startBuild(context, options, seen, value);

    return context.str;
  };
};

const defaultStringify = createStringify();
defaultStringify.createStringify = createStringify;
defaultStringify.defaultOptions = defaultOptions;

module.exports = defaultStringify;
