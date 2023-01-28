class StringBuilder {
  constructor(options) {
    if (typeof options === 'number') {
      this.bufferSize = options;
    } else {
      options = options || {};
      this.bufferSize = options.bufferSize || Buffer.poolSize;
    }

    this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
    this.buffersHead = {n: null, b: null};
    this.buffersTail = this.buffersHead;
    this.length = 0;
    this.currentBufferLength = 0;
  }

  /**
   * @param string - string
   */
  add(string) {
    const byteLength = string.length * 2;

    if (this.currentBuffer.length - this.currentBufferLength - byteLength > -1) {
      this.currentBuffer.write(string, this.currentBufferLength, 'utf16le');
      this.currentBufferLength += byteLength;
    } else {
      this._push(this.currentBuffer.subarray(0, this.currentBufferLength));
      this.currentBuffer = Buffer.allocUnsafe(this.bufferSize > byteLength ? this.bufferSize : byteLength);
      this.currentBuffer.write(string, 'utf16le');
      this.currentBufferLength = byteLength;
    }

    this.length += byteLength;
  }

  /**
   * @param char - int from 0 to 65535
   */
  addTwoBytes(char) {
    if (this.currentBuffer.length - this.currentBufferLength - 2 > 1) {
      this.currentBuffer[this.currentBufferLength++] = char % 256;
      this.currentBuffer[this.currentBufferLength++] = char >> 8;
    } else {
      this._push(this.currentBuffer.subarray(0, this.currentBufferLength));
      this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
      this.currentBuffer[0] = char % 256;
      this.currentBuffer[1] = char >> 8;
      this.currentBufferLength = 2;
    }

    this.length += 2;
  }

  /**
   * @param array - array of integers from 0 to 65535
   */
  addBytesArray(array) {
    const byteLength = array.length * 2;
    if (this.currentBuffer.length - this.currentBufferLength - byteLength < 0) {
      this._push(this.currentBuffer.subarray(0, this.currentBufferLength));
      this.currentBuffer = Buffer.allocUnsafe(byteLength > this.bufferSize ? byteLength : this.bufferSize);
      this.currentBufferLength = 0;
    }

    for (let byte of array) {
      this.currentBuffer[this.currentBufferLength++] = byte % 256;
      this.currentBuffer[this.currentBufferLength++] = byte >> 8;
    }

    this.length += byteLength;
  }

  _push(buffer = this.currentBuffer) {
    this.buffersTail.b = buffer;
    this.buffersTail.n = {n: null, b: null};
    this.buffersTail = this.buffersTail.n;
  }

  toString() {
    let current = this.buffersHead;
    const result = Buffer.allocUnsafe(this.length);

    let targetStart = 0;
    while (current.n) {
      current.b.copy(result, targetStart);
      targetStart += current.b.length;
      current = current.n;
    }

    this.currentBuffer.copy(result, targetStart, 0, this.currentBufferLength)
    return result.toString('utf16le');
  }
}

module.exports = StringBuilder;
