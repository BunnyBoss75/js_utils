class StringBuilder {
  constructor(options) {
    options = options || {};
    this.bufferSize = options.bufferSize || Buffer.poolSize;

    this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
    this.buffersHead = [null, Buffer.allocUnsafe(0)];
    this.buffersTail = this.buffersHead;
    this.length = 0;
    this.currentBufferLength = 0;
  }

  add(string) {
    const buffered = Buffer.from(string);
    const length = buffered.length;
    const freeSize = this.bufferSize - this.currentBufferLength;
    if (freeSize - length > -1) {
      buffered.copy(this.currentBuffer, this.currentBufferLength);
      this.length += length;
      this.currentBufferLength += length;
    } else {
      const last = length - freeSize;
      buffered.copy(this.currentBuffer, this.currentBufferLength, 0, freeSize);
      this._push();
      if (last > this.bufferSize) {
        const newBuffer = Buffer.allocUnsafe(last);
        buffered.copy(newBuffer, freeSize);
        this._push(newBuffer);
        this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
        this.currentBufferLength = 0;
      } else {
        this.currentBuffer = Buffer.allocUnsafe(this.bufferSize);
        buffered.copy(this.currentBuffer, 0, freeSize);
        this.currentBufferLength = last;
      }
      this.length += length;
    }
  }

  _push(buffer = this.currentBuffer) {
    this.buffersTail[0] = [null, buffer];
    this.buffersTail = this.buffersTail[0];
  }

  toString() {
    let current = this.buffersHead;
    const result = Buffer.allocUnsafe(this.length);

    let targetStart = 0;
    do {
      current[1].copy(result, targetStart);
      targetStart += current[1].length;
    } while (current = current[0]);

    this.currentBuffer.subarray(0, this.currentBufferLength).copy(result, targetStart);
    return result.toString();
  }
}

module.exports = StringBuilder;
