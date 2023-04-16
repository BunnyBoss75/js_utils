const {describe, expect, test} = require('@jest/globals');

const StringBuilder = require('../src/experimental/bufferStringBuilder');
const CommonStringBuilder = require('../src/experimental/commonStringBuilder');

describe('stringBuilder', () => {
  test('isCorrectBuild', () => {
    const testString = '123456цу789!#%&(//\\№йФжэʼЇ🦾\x7f';
    const testArray = [...Array(100).fill(1).map((el, i) => testString.slice(0, i))];

    const stringBuilder = new StringBuilder(15);
    const commonStringBuilder = new CommonStringBuilder();

    let correctString = '';
    for (let i = 0; i < 100; ++i) {
      stringBuilder.addString(testArray[i % 100]);
      commonStringBuilder.addString(testArray[i % 100]);
      correctString += testArray[i % 100];
    }

    stringBuilder.addTwoBytes('😎'.charCodeAt(0));
    stringBuilder.addTwoBytes('😎'.charCodeAt(1));
    commonStringBuilder.addTwoBytes('😎'.charCodeAt(0));
    commonStringBuilder.addTwoBytes('😎'.charCodeAt(1));
    correctString += '😎';

    stringBuilder.addBytesArray(['😎'.charCodeAt(0), '😎'.charCodeAt(1)]);
    commonStringBuilder.addBytesArray(['😎'.charCodeAt(0), '😎'.charCodeAt(1)]);
    correctString += '😎';

    const resultedString = stringBuilder.toString();
    const commonResultString = commonStringBuilder.toString();

    expect(resultedString).toBe(correctString);
    expect(commonResultString).toBe(correctString);
  });

  test('unicodeEscape', () => {
    const stringBuilder = new StringBuilder(25);
    const commonStringBuilder = new CommonStringBuilder();

    stringBuilder.addUnicodeEscapeTwoBytes(0x1234);
    stringBuilder.addUnicodeEscapeTwoBytes(0x5678);
    stringBuilder.addUnicodeEscapeTwoBytes(0x9abc);
    stringBuilder.addUnicodeEscapeTwoBytes(0xdef0);
    stringBuilder.addUnicodeEscapeTwoBytes(0x0000);
    stringBuilder.addUnicodeEscapeTwoBytes(0xffff);

    commonStringBuilder.addUnicodeEscapeTwoBytes(0x1234);
    commonStringBuilder.addUnicodeEscapeTwoBytes(0x5678);
    commonStringBuilder.addUnicodeEscapeTwoBytes(0x9abc);
    commonStringBuilder.addUnicodeEscapeTwoBytes(0xdef0);
    commonStringBuilder.addUnicodeEscapeTwoBytes(0x0000);
    commonStringBuilder.addUnicodeEscapeTwoBytes(0xffff);

    const resultString = stringBuilder.toString();
    const commonResultString = commonStringBuilder.toString();

    expect(resultString).toBe('\\u1234\\u5678\\u9abc\\udef0\\u0000\\uffff');
    expect(commonResultString).toBe('\\u1234\\u5678\\u9abc\\udef0\\u0000\\uffff');
  });
});
