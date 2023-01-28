const {describe, expect} = require('@jest/globals');

const StringBuilder = require('../src/experimental/stringBuilder');

describe('stringBuilder', () => {
  test('isCorrectBuild', () => {
    const testString = '123456цу789!#%&(//\\№йФжэʼЇ🦾\x7f';
    const testArray = [...Array(100).fill(1).map((el, i) => testString.slice(0, i))];

    const stringBuilder = new StringBuilder(15);

    let correctString = '';
    for (let i = 0; i < 100; ++i) {
      stringBuilder.add(testArray[i % 100]);
      correctString += testArray[i % 100];
    }

    stringBuilder.addTwoBytes('😎'.charCodeAt(0));
    stringBuilder.addTwoBytes('😎'.charCodeAt(1));
    correctString += '😎';

    stringBuilder.addBytesArray(['😎'.charCodeAt(0), '😎'.charCodeAt(1)]);
    correctString += '😎';

    const resultedString = stringBuilder.toString();

    expect(resultedString).toBe(correctString);
  })
});
