const stringifyBenchmark = require('./stringify');

const jsUtilsStringify = require('../src/stringify');
const safeStableStringify = require('safe-stable-stringify');
const jsonify = require('jsonify');
const jsonStableStringify = require('json-stable-stringify')

stringifyBenchmark('js_utils.stringify:default', value => jsUtilsStringify(value));
stringifyBenchmark('JSON.stringify:default', value => JSON.stringify(value))
stringifyBenchmark('safeStableStringify:default', value => safeStableStringify(value));
stringifyBenchmark('jsonify:default', value => jsonify.stringify(value));
stringifyBenchmark('jsonStableStringify:default', value => jsonStableStringify(value));
