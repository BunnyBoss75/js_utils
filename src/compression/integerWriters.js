const INT16_PAGE_SIZE = 8 * 1024;
const INT8_PAGE_SIZE = 16 * 1024;

class IntegerReader {
  constructor (pages, lastPage, size, pageSize) {
    this.pages = pages;
    this.lastPage = lastPage;
    this.size = size;
    this.pageSize = pageSize;

    this.offset = 0;
    this.page = this.pages.length > 0 ? this.pages[0] : this.lastPage;
    this.pageIdx = this.pages.length > 0 ? 0 : -1;
    this.currSize = this.pages.length > 0 ? this.pageSize : size;
  }

  read() {
    if (this.offset === this.currSize) {
      if (this.pageIdx === -1) {
        return -1;
      }

      this.offset = 0;
      ++this.pageIdx;

      if (this.pageIdx === this.pages.length) {
        this.page = this.lastPage;
        this.pageIdx = -1;
        this.currSize = this.size;
      } else {
        this.page = this.pages[this.pageIdx];
        this.currSize = this.pageSize;
      }
    }

    return this.page[this.offset++];
  }
}

class IntegerWriter {
  constructor(options) {
    this.totalSize = 0;
    this.size = 0;
    this.type = options.type || 16;
    this.page = this.type === 16 ? new Uint16Array(INT16_PAGE_SIZE) : new Uint8Array(INT8_PAGE_SIZE);
    this.pages = [];
  }

  writeInteger(int) {
    if (this.size === INT16_PAGE_SIZE) {
      this._expand();
    }

    this.page[this.size++] = int;
    ++this.totalSize;
  }

  _expand() {
    this.pages.push(this.page);
    this.page = this.type === 16 ? new Uint16Array(INT16_PAGE_SIZE) : new Uint8Array(INT8_PAGE_SIZE);
    this.size = 0;
  }

  getTotalSize() {
    return this.totalSize;
  }

  computeFrequencies(size) {
    const freq = new Uint32Array(size);
    const pages = this.pages;
    const pagesLength = pages.length;

    for (let i = 0; i < pagesLength; ++i) {
      const page = pages[i];

      for (let j = 0; j < INT16_PAGE_SIZE; ++j) {
        freq[page[j]]++;
      }
    }

    const lastSize = this.size;
    const last = this.page;
    for (let i = 0; i < lastSize; ++i) {
      freq[last[i]]++;
    }

    return freq;
  }

  getReader() {
    return new IntegerReader(this.pages, this.page, this.size, this.type === 16 ? INT16_PAGE_SIZE : INT8_PAGE_SIZE);
  }
}

module.exports = {
  IntegerWriter,
};
