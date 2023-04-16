class AbstractStringBuilder {
  /**
   * @param string - string
   */
  addString(string) {
    throw Error('not implemented');
  }

  /**
   * Big string is where length more than 32
   * @param string - string
   */
  addStringBig(string) {
    throw Error('not implemented');
  }

  /**
   * Small string is where length up to 32
   * @param string - string
   */
  addStringSmall(string) {
    throw Error('not implemented');
  }

  /**
   * @param char - int from 0 to 65535
   */
  addTwoBytes(char) {
    throw Error('not implemented');
  }

  addTwoBytesWithFill(char, count) {
    throw Error('not implemented');
  }

  /**
   * Add \u**** to buffer where **** - hex representation of char
   * @param char
   */
  addUnicodeEscapeTwoBytes(char) {
    throw Error('not implemented');
  }

  /**
   * @param string
   */
  addEscapedStringForJSON(string) {
    throw Error('not implemented');
  }

  /**
   * @param array - array of integers from 0 to 65535
   */
  addBytesArray(array) {
    throw Error('not implemented');
  }

  toString() {
    throw Error('not implemented');
  }
}

module.exports = AbstractStringBuilder;
