const microUtils = require('../microUtils');

// using idea from safe-stable-stringify
// if regexp.test() = false - we can use string as is without escaping
const possiblyNeedEscape = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
const testEscapingMagicNumber = 5000;
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

// TODO: don't pass value by value
// TODO: remove getKeys if ignoreSymbols and no sort
// TODO: use buildForArray buildForObject instead of build

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
  const paramListStart = ['context', 'options', 'value'];
  const paramObjectList = [...paramListStart, 'key', 'comma'];
  const paramArrayList = [...paramListStart, 'comma'];
  if (options.indent) {
    paramObjectList.push('indent');
    paramArrayList.push('indent');
  }

  const addEscapeCode = (valueName, resultReceiver, precalculate = false) => {
    if (!precalculate) {
      return `
      // idea and magic number from safe-stable-stringify
      if (${valueName}.length < ${testEscapingMagicNumber} && !options.possiblyNeedEscape.test(${valueName})) {
        ${resultReceiver} \`"\${${valueName}}"\`;
      } else {
        ${resultReceiver} JSON.stringify(${valueName});
      }`;
    } else {
      return `
      // idea and magic number from safe-stable-stringify
      const constructEscapeValue = ${valueName};
      if (constructEscapeValue.length < ${testEscapingMagicNumber} && !options.possiblyNeedEscape.test(constructEscapeValue)) {
        ${resultReceiver} \`"\${constructEscapeValue}"\`;
      } else {
        ${resultReceiver} JSON.stringify(constructEscapeValue);
      }`;
    }
  };

  const addCloseBracketsCode = (isStart, forArray) => {
    const bracket = forArray ? ']' : '}';
    if ((isStart || !options.indent) && !options.newLine) {
      return `
      context.str += '${bracket}';
      `;
    } else if ((isStart || !options.indent) && options.newLine) {
      return `
      context.str += isFirst === true ? '${bracket}' : '\\n${bracket}';
      `;
    } else if (options.newLine) {
      return `
      context.str += isFirst === true ? '${bracket}' : '\\n' + ' '.repeat(indent) + '${bracket}';
      `;
    } else { // !options.newLine
      return `
      context.str += isFirst === true ? '${bracket}' : ' '.repeat(indent) + '${bracket}';
      `;
    }
  };

  const addKeyCode = (isArray, isStart) => {
    if (isStart) {
      return  '';
    }

    const before = `
      if (comma === true) {
        context.str += ',';
      }
      
      ${options.indent && options.newLine ? `
    context.str += '\\n' + ' '.repeat(indent);` : options.indent ? `
    context.str += ' '.repeat(indent);\`` : options.newLine ? `
    context.str += '\\n';` : ''}
    `;

    if (isArray) {
      return before;
    } else {
      return before + `
        keyStr = typeof key === 'string' ?
          key : typeof key.toString === 'function' ?
          key.toString() : String(key);
        // idea and magic number from safe-stable-stringify
        if (keyStr.length < ${testEscapingMagicNumber} && !options.possiblyNeedEscape.test(keyStr)) {
          context.str += \`"\${keyStr}":${' '.repeat(options.keyValueIndent)}\`;
        } else {
          context.str += \`\${JSON.stringify(keyStr)}:${' '.repeat(options.keyValueIndent)}\`;
        }
      `;
    }
  }

  const addSeenCode = (isArray, isStart) => {
    if (isStart) {
      return `
      context.seen.add(value);
      `;
    } else {
      return `
      if (context.seen.has(value)) {
${options.ignoreCycles ? `${addKeyCode(isArray, isStart)}
        context.str += '"${cycleString}"';
        return true;` : `
        throw new Error('Cycle reference during stringify object');`}
      }
      context.seen.add(value);
    `;
    }

  }

  const buildCode = (isArray, isStart) => {
    return `
    ${!isArray ? 'let keyStr;' : ''}
    ${!isStart && options.indent ? `
        const valueIndent = indent + ${options.indent};
    ` : ''}
${options.replacer === null ? '' : !isArray ? `
    const replacerResult = options.replacer(key, value);
    key = replacerResult.key;
    value = replacerResult.value;` : `
    value = options.replacer(null, value).value;
`}
    
    switch (typeof value) {
      case 'object':
        if (value === null) {
          ${addKeyCode(isArray, isStart)}
          context.str += 'null';
          return${isStart ? '' : ' true'};
        } else if (value instanceof RegExp) {
          ${addKeyCode(isArray, isStart)}
          // immediately use escaping from JSON.stringify as RegExp frequently contains special characters
          context.str += JSON.stringify(\`RegExp(\${value.toString()})\`);
          return${isStart ? '' : ' true'};
        }
        if (typeof value.toJSON === 'function') {
          value = value.toJSON(${!isArray ? 'key' : ''});
          if (typeof value !== 'object') {
            return ${isStart ?
    'options.startBuild(context, options, value)' : isArray ?
      `options.buildArrayElement(context, options, value${isStart ? '' : ', !isFirst'}${options.indent ? ', valueIndent' : ''})` :
      `options.buildObjectElement(context, options, value, key${isStart ? '' : ', !isFirst'}${options.indent ? ', valueIndent' : ''})`};
          }
        }

        if (Array.isArray(value)) {
${addSeenCode(isArray, isStart)}
${addKeyCode(isArray, isStart)}

          context.str += '[';

          let isFirst = true;
          for (const el of value) {
            if (options.buildArrayElement(context, options, el${isStart ? '' : ', !isFirst'}${options.indent ? ', valueIndent' : ''}) === true) {
              if (isFirst === true) {
                isFirst = false;
              }
            }
          }

          ${addCloseBracketsCode(isStart, true)}
    
          context.seen.delete(value);
    
          return${isStart ? '' : ' true'};
        } else {
          ${addSeenCode(isArray, isStart)}

          let keys = ${options.ignoreSymbols ? 'Object.keys' : 'Reflect.ownKeys'}(value);
    ${options.comparator !== null ? '      keys = keys.sort(options.comparator);' : ''}
    ${addKeyCode(isArray, isStart)}
          context.str += '{';

          let isFirst = true;
          for (const valueKey of keys) {
            if (options.buildObjectElement(context, options, value[valueKey], valueKey${isStart ? '' : ', !isFirst'}${options.indent ? ', valueIndent' : ''}) === true) {
              if (isFirst === true) {
                isFirst = false;
              }
            }
          }
    
          ${addCloseBracketsCode(isStart, false)}
          
          context.seen.delete(value);
    
          return${isStart ? '' : ' true'};
        }
      case 'string':
${addKeyCode(isArray, isStart)}
${addEscapeCode('value', 'context.str +=')}
        return${isStart ? '' : ' true'};
      case 'symbol':
${addKeyCode(isArray, isStart)}
${addEscapeCode('value.toString()', 'context.str +=', true)}
        return${isStart ? '' : ' true'};
      case 'bigint':
${addKeyCode(isArray, isStart)}
        context.str += value.toString();
        return${isStart ? '' : ' true'};
      case 'function':
      case 'undefined':
${isStart || isArray ? `
        ${!isStart ? `if (comma === true) {
          context.str += ',';
        }` : ''}
${options.indent && options.newLine ? `
        context.str += '\\n' + ' '.repeat(indent) + 'null';` : options.indent ? `
        context.str += ' '.repeat(indent) + 'null';\`` : options.newLine ? `
        context.str += '\\nnull';` : '          context.str += \'null\''}
        return${isStart ? '' : ' true'};
` : `
        return${isStart ? '' : ' false'};`}
      case 'number':
        if (isFinite(value)) {
${addKeyCode(isArray, isStart)}
          context.str += value.toString();
          return${isStart ? '' : ' true'};
        } else {
          ${isStart || isArray ? `
          ${!isStart ? `if (comma === true) {
            context.str += ',';
          }` : ''}
${options.indent && options.newLine ? `
          context.str += '\\n' + ' '.repeat(indent) + 'null';` : options.indent ? `
          context.str += ' '.repeat(indent) + 'null';\`` : options.newLine ? `
          context.str += '\\nnull';` : '          context.str += \'null\''}
          return${isStart ? '' : ' true'};
` : `
          return false;
`}
        }
      case 'boolean':
${addKeyCode(isArray, isStart)}
        if (value === true) {
          context.str += 'true';
        } else {
          context.str += 'false';
        }
        return${isStart ? '' : ' true'};
    }
  `;
  };

  return [
    Function(...paramListStart, buildCode(true, true)),
    Function(...paramArrayList, buildCode(true, false)),
    Function(...paramObjectList, buildCode(false, false)),
  ];
};

const createStringify = (options) => {
  options = getValidOptions(options);

  const [startBuild, buildArrayElement, buildObjectElement] = createBuildCode(options);

  options.possiblyNeedEscape = possiblyNeedEscape;
  options.startBuild = startBuild;
  options.buildArrayElement = buildArrayElement;
  options.buildObjectElement = buildObjectElement;

  return value => {
    const context = {};
    context.seen = new Set();
    context.str = '';

    options.startBuild(context, options, value);

    return context.str;
  };
};

const defaultStringify = createStringify();
defaultStringify.createStringify = createStringify;
defaultStringify.defaultOptions = defaultOptions;

module.exports = defaultStringify;
