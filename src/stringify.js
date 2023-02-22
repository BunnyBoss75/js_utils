const microUtils = require('./microUtils');
const StringBuilder = require('./experimental/stringBuilder');

// TODO: use benchmark, compare to other libs, validate options, create stringify by call with options
// TODO: add option validation

const codeString = (string) => {
  const arr = [];
  for (let i = 0; i < string.length; ++i) {
    arr.push(string.charCodeAt(i))
  }
  return arr;
};

const doubleQuoteCode = '"'.charCodeAt(0);
const commaCode = ','.charCodeAt(0);
const newLineCode = '\n'.charCodeAt(0);
const spaceCode = ' '.charCodeAt(0);
const colonCode = ':'.charCodeAt(0);
const leftSquareBracket = '['.charCodeAt(0);
const rightSquareBracket = ']'.charCodeAt(0);
const leftCurlyBracket = '{'.charCodeAt(0);
const rightCurlyBracket = '}'.charCodeAt(0);

const cycleCodes = codeString('"__cycle__"');
const trueCodes = codeString('true');
const falseCodes = codeString('false');
const nullCodes = codeString('null');
const regExpPrefixCodes = codeString('"RegExp(');
const regExpSuffixCodes = codeString(')"');

const defaultOptions = {
  replacer: null,
  comparator: true,
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

  let {
    replacer,
    ignoreCycles,
    ignoreSymbols,
    comparator,
    newLine,
    indent,
    keyValueIndent,
  } = options;

  if (comparator === true) {
    comparator = ignoreSymbols ? microUtils.defaultStringCompare : microUtils.defaultStringSymbolCompare;
  }

  const getKeys = ignoreSymbols ? Object.keys : Reflect.ownKeys;

  // TODO: property of not object/array values?
  const seen = new Set();

  let stringBuilder = new StringBuilder();

  const addKeyString = (comma, currentIndent, key) => {
    if (comma) {
      stringBuilder.addTwoBytes(commaCode);
    }
    if (newLine) {
      stringBuilder.addTwoBytes(newLineCode);
    }
    stringBuilder.addTwoBytesWithFill(spaceCode, currentIndent);
    if (key !== null) {
      stringBuilder.addTwoBytes(doubleQuoteCode);

      if (typeof key === 'string') {
        stringBuilder.addEscapedStringForJSON(key)
      } else if (key.toString) {
        stringBuilder.addEscapedStringForJSON(key.toString());
      } else {
        stringBuilder.addEscapedStringForJSON(String(key));
      }

      stringBuilder.addBytesArray([doubleQuoteCode, colonCode]);
      stringBuilder.addTwoBytesWithFill(spaceCode, keyValueIndent);
    }
  }

  const builder = (key, value, currentIndent, comma) => {
    const valueIndent = currentIndent + indent;

    if (replacer) {
      const replacerResult = replacer(key, value);
      key = replacerResult.key;
      value = replacerResult.value;
    }

    if (value && typeof value.toJSON === 'function') {
      value = value.toJSON();
    }

    if (Array.isArray(value)) {
      if (seen.has(value)) {
        if (ignoreCycles) {
          addKeyString(comma, currentIndent, key);
          stringBuilder.addBytesArray(cycleCodes);
          return true;
        } else {
          throw new Error('Cycle reference during stringify object');
        }
      }
      seen.add(value);

      addKeyString(comma, currentIndent, key);
      stringBuilder.addTwoBytes(leftSquareBracket);

      let isFirst = true;
      for (const el of value) {
        if (builder(null, el, valueIndent, !isFirst)) {
          if (isFirst) {
            isFirst = false;
          }
        }
      }

      if (isFirst) {
        stringBuilder.addTwoBytes(rightSquareBracket);
      } else {
        if (newLine) {
          stringBuilder.addTwoBytes(newLineCode);
        }
        stringBuilder.addTwoBytesWithFill(spaceCode, currentIndent);
        stringBuilder.addTwoBytes(rightSquareBracket);
      }

      seen.delete(value);

      return true;
    }

    if (typeof value === 'object') {
      if (value instanceof RegExp) {
        addKeyString(comma, currentIndent, key);
        stringBuilder.addBytesArray(regExpPrefixCodes);
        stringBuilder.addEscapedStringForJSON(value.toString());
        stringBuilder.addBytesArray(regExpSuffixCodes);
        return true;
      } else if (value === null) {
        addKeyString(comma, currentIndent, key);
        stringBuilder.addBytesArray(nullCodes);
        return true;
      }

      if (seen.has(value)) {
        if (ignoreCycles) {
          addKeyString(comma, currentIndent, key);
          stringBuilder.addBytesArray(cycleCodes);
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

      addKeyString(comma, currentIndent, key);
      stringBuilder.addTwoBytes(leftCurlyBracket);

      let isFirst = true;
      for (const valueKey of keys) {
        if (builder(valueKey, value[valueKey], valueIndent, !isFirst)) {
          if (isFirst) {
            isFirst = false;
          }
        }
      }

      if (isFirst) {
        stringBuilder.addTwoBytes(rightCurlyBracket);
      } else {
        if (newLine) {
          stringBuilder.addTwoBytes(newLineCode);
        }
        stringBuilder.addTwoBytesWithFill(spaceCode, currentIndent);
        stringBuilder.addTwoBytes(rightCurlyBracket);
      }

      seen.delete(value);

      return true;
    }

    switch (typeof value) {
      case 'string':
        addKeyString(comma, currentIndent, key);
        stringBuilder.addTwoBytes(doubleQuoteCode);
        stringBuilder.addEscapedStringForJSON(value);
        stringBuilder.addTwoBytes(doubleQuoteCode);
        return true;
      case 'symbol':
        addKeyString(comma, currentIndent, key);
        stringBuilder.addTwoBytes(doubleQuoteCode);
        stringBuilder.addEscapedStringForJSON(value.toString());
        stringBuilder.addTwoBytes(doubleQuoteCode);
        return true;
      case 'bigint':
        addKeyString(comma, currentIndent, key);
        stringBuilder.addString(value.toString());
        return true;
      case 'function':
      case 'undefined':
        if (key === null) {
          addKeyString(comma, currentIndent, key);
          stringBuilder.addBytesArray(nullCodes);
          return true;
        }
        return false;
      case 'number':
        if (isFinite(value)) {
          addKeyString(comma, currentIndent, key);
          stringBuilder.addString(value.toString());
          return true;
        } else if (key === null) {
          addKeyString(comma, currentIndent, key);
          stringBuilder.addBytesArray(nullCodes);
          return true;
        } else {
          return false;
        }
      case 'boolean':
        addKeyString(comma, currentIndent, key);
        if (value) {
          stringBuilder.addBytesArray(trueCodes);
        } else {
          stringBuilder.addBytesArray(falseCodes);
        }
        return true;
    }
  };

  builder(null, initialValue, 0, false);

  return newLine ? stringBuilder.toString().slice(1) : stringBuilder.toString();
};

module.exports = {
  stringify,
  defaultOptions,
};
