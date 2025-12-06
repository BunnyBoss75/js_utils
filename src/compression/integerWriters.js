const INT16_PAGE_SIZE = 8 * 1024;

class Integer16Reader {
  constructor (pages, lastPage, size) {
    this.pages = pages;
    this.lastPage = lastPage;
    this.size = size;

    this.offset = 0;
    this.page = this.pages.length > 0 ? this.pages[0] : this.lastPage;
    this.pageIdx = this.pages.length > 0 ? 0 : -1;
    this.currSize = this.pages.length > 0 ? INT16_PAGE_SIZE : size;
  }

  read() {
    if (this.offset === this.currSize) {
      if (this.pageIdx === -1) {
        return null;
      }

      this.offset = 0;
      ++this.pageIdx;

      if (this.pageIdx === this.pages.length) {
        this.page = this.lastPage;
        this.pageIdx = -1;
        this.currSize = this.size;
      } else {
        this.page = this.pages[this.pageIdx];
        this.currSize = INT16_PAGE_SIZE;
      }
    }

    return this.page[this.offset++];
  }
}

class Integer16Writer {
  constructor(options) {
    this.totalSize = 0;
    this.size = 0;
    this.page = new Uint16Array(INT16_PAGE_SIZE);
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
    this.page = new Uint16Array(INT16_PAGE_SIZE);
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
    return new Integer16Reader(this.pages, this.page, this.size);
  }
}

module.exports = {
  Integer16Writer,
};
