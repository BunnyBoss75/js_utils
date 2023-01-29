const {describe, expect, test} = require('@jest/globals');

const stringify = require('../src/stringify').stringify;

describe('stringify', () => {
  test('baseTest', () => {
    const a1 = {a: 2};
    const b2 = {a1};
    a1.b = b2;

    const toStringify = {
      a1,
      a: 123,
      b: {
        c: 3,
        b2,
        d: [true, null, undefined],
        b1: '123',
      },
      e: undefined,
      f: 123,
      h: {
        g: {
          j: [{
            a: 1,
            [Symbol.for('123')]: null,
            t: false,
            b: 2,
            c: Symbol.for('escapeMe\n'),
            e: Number.NaN,
          }],
        },
        a1,
      },
    };
    const options = {
      indent: 2,
      keyValueIndent: 1,
      newLine: true,
      ignoreCycles: true,
    };

    const res = stringify(toStringify, options);

    expect(res).toBe(`{
  "a": 123,
  "a1": {
    "a": 2,
    "b": {
      "a1": "__cycle__"
    }
  },
  "b": {
    "b1": "123",
    "b2": {
      "a1": {
        "a": 2,
        "b": "__cycle__"
      }
    },
    "c": 3,
    "d": [
      true,
      null
    ]
  },
  "f": 123,
  "h": {
    "a1": {
      "a": 2,
      "b": {
        "a1": "__cycle__"
      }
    },
    "g": {
      "j": [
        {
          "a": 1,
          "b": 2,
          "c": "Symbol(escapeMe\\n)",
          "Symbol(123)": null,
          "t": false
        }
      ]
    }
  }
}`);
  });
});
