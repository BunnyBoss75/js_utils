const microUtils = require('../microUtils');
const AbstractStringBuilder = require('./abstractStringBuilder');

const charHexMapping = {
  0x0: 0x30,
  0x1: 0x31,
  0x2: 0x32,
  0x3: 0x33,
  0x4: 0x34,
  0x5: 0x35,
  0x6: 0x36,
  0x7: 0x37,
  0x8: 0x38,
  0x9: 0x39,
  0xa: 0x61,
  0xb: 0x62,
  0xc: 0x63,
  0xd: 0x64,
  0xe: 0x65,
  0xf: 0x66,
};
const jsonEscapeMapping = {
  0x08: '\\b',
  0x09: '\\t',
  0x0a: '\\n',
  0x0c: '\\f',
  0x0d: '\\r',
  0x22: '\\\"',
  0x5c: '\\\\',
};
const jsonEscapeRegExp = /[\u0000-\u001f\u0022\u005c]|(?<![\ud800-\udbff])[\udc00-\udfff]|[\ud800-\udbff](?![\udc00-\udfff])/;

const slashCode = '\\'.charCodeAt(0);
const uCode = 'u'.charCodeAt(0);

// TODO: see og_protocol
// TODO: use return this
// TODO: in case if size more than bufferLength and create new buffer - try to use Buffer.from()
class BufferStringBuilder extends AbstractStringBuilder {
  constructor(options) {
    super();
    if (typeof options === 'number') {
      this.bufferSize = options;
    } else {
      options = options || {};
      this.bufferSize = options.bufferSize || 128;
    }

    this.bufferSize = (Math.ceil(this.bufferSize) | 0x1) + 1;

    this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
    this.buffers = [];
    this.currentBufferLength = 0;
  }

  /**
   * @param string - string
   */
  addString(string) {
    if (string.length > 32) {
      this.addStringBig(string);
    } else {
      this.addStringSmall(string);
    }
  }

  /**
   * Big string is where length more than 32
   * @param string - string
   */
  addStringBig(string) {
    const byteLength = string.length * 2;

    if (this.currentBuffer.length - this.currentBufferLength - byteLength > -1) {
      this.currentBuffer.write(string, this.currentBufferLength, 'utf16le');
      this.currentBufferLength += byteLength;
    } else {
      this._expandWithLength(byteLength);
      this.currentBuffer.write(string, 'utf16le');
      this.currentBufferLength = byteLength;
    }
  }

  /**
   * Small string is where length up to 32
   * @param string - string
   */
  addStringSmall(string) {
    const length = string.length;
    const byteLength = length * 2;

    if (this.currentBuffer.length - this.currentBufferLength - byteLength > -1) {
      for (let i = 0; i < length; ++i) {
        const char = string.charCodeAt(i);
        this.currentBuffer[this.currentBufferLength++] = char & 0xff;
        this.currentBuffer[this.currentBufferLength++] = char >> 8;
      }
    } else {
      this._expandWithLength(byteLength);
      this.currentBufferLength = 0;
      for (let i = 0; i < length; ++i) {
        const char = string.charCodeAt(i);
        this.currentBuffer[this.currentBufferLength++] = char & 0xff;
        this.currentBuffer[this.currentBufferLength++] = char >> 8;
      }
    }
  }

  /**
   * @param char - int from 0 to 65535
   */
  addTwoBytes(char) {
    if (this.currentBuffer.length - this.currentBufferLength - 2 > 1) {
      this.currentBuffer[this.currentBufferLength++] = char & 0xff;
      this.currentBuffer[this.currentBufferLength++] = char >> 8;
    } else {
      this._expand();
      this.currentBuffer[0] = char & 0xff;
      this.currentBuffer[1] = char >> 8;
      this.currentBufferLength = 2;
    }
  }

  addTwoBytesWithFill(char, count) {
    const byteLength = count * 2;

    if (this.currentBuffer.length - this.currentBufferLength - byteLength < 0) {
      this._expandWithLength(byteLength);
      this.currentBufferLength = 0;
    }

    for (let i = 0; i < count; ++i) {
      this.currentBuffer[this.currentBufferLength++] = char & 0xff;
      this.currentBuffer[this.currentBufferLength++] = char >> 8;
    }
  }

  /**
   * Add \u**** to buffer where **** - hex representation of char
   * @param char
   */
  addUnicodeEscapeTwoBytes(char) {
    if (this.currentBuffer.length - this.currentBufferLength - 12 < 0) {
      this._expandWithLength(12);
      this.currentBufferLength = 0;
    }

    this.currentBuffer[this.currentBufferLength++] = slashCode;
    this.currentBuffer[this.currentBufferLength++] = 0;

    this.currentBuffer[this.currentBufferLength++] = uCode;
    this.currentBuffer[this.currentBufferLength++] = 0;

    this.currentBuffer[this.currentBufferLength++] = charHexMapping[char >> 12];
    this.currentBuffer[this.currentBufferLength++] = 0;

    this.currentBuffer[this.currentBufferLength++] = charHexMapping[(char >> 8) & 0xf];
    this.currentBuffer[this.currentBufferLength++] = 0;

    this.currentBuffer[this.currentBufferLength++] = charHexMapping[(char >> 4) & 0xf];
    this.currentBuffer[this.currentBufferLength++] = 0;

    this.currentBuffer[this.currentBufferLength++] = charHexMapping[char & 0xf];
    this.currentBuffer[this.currentBufferLength++] = 0;
  }

  /**
   * Based on the algorithm from original v8 JsonStringifier::SerializeString_
   * (8eed79319a1c386bb11a770c71e7745827c2dbac)
   * @param string
   */
  addEscapedStringForJSON(string) {
    const length = string.length;
    for (let i = 0; i < length; ++i) {
      const char = string.charCodeAt(i);
      if (jsonEscapeMapping[char]) {
        this.addStringSmall(jsonEscapeMapping[char]);
      } else if (char < 0x20) {
        this.addUnicodeEscapeTwoBytes(char);
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
              this.addBytesArray([char, next]);
              ++i;
            } else {
              // The next character is not a trailing surrogate. Thus, the
              // current character is a lone leading surrogate.
              this.addUnicodeEscapeTwoBytes(char);
            }
          } else {
            // There is no next character. Thus, the current character is a lone
            // leading surrogate.
            this.addUnicodeEscapeTwoBytes(char);
          }
        } else {
          // The current character is a lone trailing surrogate. (If it had been
          // preceded by a leading surrogate, we would've ended up in the other
          // branch earlier on, and the current character would've been handled
          // as part of the surrogate pair already.)
          this.addUnicodeEscapeTwoBytes(char);
        }
      } else {
        this.addTwoBytes(char);
      }
    }
  }

  /**
   * @param array - array of integers from 0 to 65535
   */
  addBytesArray(array) {
    const byteLength = array.length * 2;
    if (this.currentBuffer.length - this.currentBufferLength - byteLength < 0) {
      this._expandWithLength(byteLength);
      this.currentBufferLength = 0;
    }

    for (let byte of array) {
      this.currentBuffer[this.currentBufferLength++] = byte & 0xff;
      this.currentBuffer[this.currentBufferLength++] = byte >> 8;
    }
  }

  _expand() {
    this.buffers.push(this.currentBuffer.subarray(0, this.currentBufferLength));
    this.bufferSize = (Math.floor(microUtils.phi * this.bufferSize) | 0x1) + 1;
    this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
  }

  _expandWithLength(length) {
    this.buffers.push(this.currentBuffer.subarray(0, this.currentBufferLength));
    this.bufferSize = (Math.floor(microUtils.phi * this.bufferSize) | 0x1) + 1;
    this.currentBuffer = Buffer.allocUnsafe(this.bufferSize > length ? this.bufferSize : length);
  }

  toString() {
    if (this.buffers.length === 0) {
      return this.currentBuffer.subarray(0, this.currentBufferLength).toString('utf16le');
    }

    const buffers = [...this.buffers, this.currentBuffer.subarray(0, this.currentBufferLength)];
    return Buffer.concat(buffers).toString('utf16le');
  }
}

module.exports = BufferStringBuilder;
