const AbstractStringBuilder = require('./abstractStringBuilder');

class CommonStringBuilder extends AbstractStringBuilder {
  constructor() {
    super();
    this.str = '';
  }

  /**
   * @param string - string
   */
  addString(string) {
    this.str += string;
  }

  /**
   * Big string is where length more than 32
   * @param string - string
   */
  addStringBig(string) {
    this.str += string;
  }

  /**
   * Small string is where length up to 32
   * @param string - string
   */
  addStringSmall(string) {
    this.str += string;
  }

  /**
   * @param char - int from 0 to 65535
   */
  addTwoBytes(char) {
    this.str += String.fromCharCode(char);
  }

  addTwoBytesWithFill(char, count) {
    while (count--) {
      this.str += String.fromCharCode(char);
    }
  }

  /**
   * Add \u**** to buffer where **** - hex representation of char
   * @param char
   */
  addUnicodeEscapeTwoBytes(char) {
    const number = char.toString(16);
    this.str += `\\u${'0'.repeat(4 - number.length)}${number}`;
  }

  /**
   * @param string
   */
  addEscapedStringForJSON(string) {
    const escaped = JSON.stringify(string);
    this.str += escaped.substring(1, escaped.length - 1);
  }

  /**
   * @param array - array of integers from 0 to 65535
   */
  addBytesArray(array) {
    for (let i = 0; i < array.length; ++i) {
      this.str += String.fromCharCode(array[i]);
    }
  }

  toString() {
    return this.str;
  }
}

module.exports = CommonStringBuilder;
