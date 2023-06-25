const stringifyBenchmark = require('./stringify');
const stringBuilderBenchmark = require('./stringBuilder');

const jsUtilsStringify = require('../src/stringify');
const jsUtilsStringifyV2 = require('../src/stringify/stringifyV2');
const jsUtilsStringifyV2NotStable = jsUtilsStringifyV2.createStringify({comparator: false});
const jsUtilsStringifyV2WithoutSymbols = jsUtilsStringifyV2.createStringify({ignoreSymbols: true});
const jsUtilsStringifyV2NotStableWithoutSymbols = jsUtilsStringifyV2.createStringify({comparator: false, ignoreSymbols: true});
const safeStableStringify = require('safe-stable-stringify');
const safeStableStringifyMotStable = safeStableStringify.configure({deterministic: false});
const jsonify = require('jsonify');
const jsonStableStringify = require('json-stable-stringify')

const bufferStringBuilder = require('../src/experimental/bufferStringBuilder');
const commonStringBuilder = require('../src/experimental/commonStringBuilder');

stringifyBenchmark('js_utils.stringify:default', value => jsUtilsStringify(value));
stringifyBenchmark('js_utils.stringify:notStable', value => jsUtilsStringify(value, {comparator: false}));
stringifyBenchmark('js_utils.stringifyV2:default', value => jsUtilsStringifyV2(value));
stringifyBenchmark('js_utils.stringifyV2:notStable', value => jsUtilsStringifyV2NotStable(value));
stringifyBenchmark('js_utils.stringifyV2:withoutSymbols', value => jsUtilsStringifyV2WithoutSymbols(value));
stringifyBenchmark('js_utils.stringifyV2:notStableWithoutSymbols', value => jsUtilsStringifyV2NotStableWithoutSymbols(value));
stringifyBenchmark('JSON.stringify:default', value => JSON.stringify(value));
stringifyBenchmark('safeStableStringify:default', value => safeStableStringify(value));
stringifyBenchmark('safeStableStringify:notStable', value => safeStableStringifyMotStable(value));
stringifyBenchmark('jsonify:default', value => jsonify.stringify(value));
stringifyBenchmark('jsonStableStringify:default', value => jsonStableStringify(value));

stringBuilderBenchmark('js_utils.bufferStringBuilder', bufferStringBuilder);
stringBuilderBenchmark('js_utils.commonStringBuilder', commonStringBuilder);
