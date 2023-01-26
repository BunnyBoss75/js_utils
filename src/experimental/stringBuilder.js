class StringBuilder {
  constructor(options) {
    options = options || {};
    this.bufferSize = options.bufferSize || Buffer.poolSize;

    this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
    this.buffersHead = {n: null, b: null};
    this.buffersTail = this.buffersHead;
    this.length = 0;
    this.currentBufferLength = 0;
    this.freeSize = this.bufferSize;
  }

  add(string) {
    const length = Buffer.byteLength(string);

    if (this.freeSize - length > -1) {
      this.currentBuffer.write(string, this.currentBufferLength);
      this.currentBufferLength += length;
      this.freeSize -= length;
    } else {
      this._push(this.currentBuffer.subarray(0, this.currentBufferLength));
      if (length > this.bufferSize) {
        const newBuffer = Buffer.allocUnsafe(length);
        newBuffer.write(string);
        this._push(newBuffer);
        this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
        this.currentBufferLength = 0;
        this.freeSize = this.bufferSize;
      } else {
        this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
        this.currentBuffer.write(string);
        this.currentBufferLength = length;
        this.freeSize = this.bufferSize - length;
      }
    }

    this.length += length;
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
    return result.toString();
  }
}

module.exports = StringBuilder;
