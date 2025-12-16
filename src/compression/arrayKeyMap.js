class ArrayKeyMap {
  constructor() {
    this.symbol = Symbol('tail');
    this.root = new Map();
  }

  set(key, value) {
    const len = key.length;
    let curr = this.root;
    for (let i = 0; i < len; ++i) {
      const k = key[i];
      const v = curr.get(k);
      if (v === undefined) {
        const map = new Map();
        curr.set(k, map);
        curr = map;
      } else {
        curr = v;
      }
    }

    curr.set(this.symbol, value);
  }

  get(key) {
    const len = key.length;
    let curr = this.root;
    for (let i = 0; i < len; ++i) {
      const k = key[i];
      const v = curr.get(k);
      if (v === undefined) {
        return undefined;
      } else {
        curr = v;
      }
    }

    return curr.get(this.symbol);
  }

  has(key) {
    const len = key.length;
    let curr = this.root;
    for (let i = 0; i < len; ++i) {
      const k = key[i];
      const v = curr.get(k);
      if (v === undefined) {
        return false;
      } else {
        curr = v;
      }
    }

    return curr.has(this.symbol);
  }

  delete(key) {
    const len = key.length;
    const stackValue = [];
    const stackKeys = [];
    let curr = this.root;
    for (let i = 0; i < len; ++i) {
      const k = key[i];
      const v = curr.get(k);
      if (v === undefined) {
        return false;
      }
      stackValue.push(curr);
      stackKeys.push(k);
      curr = v;
    }

    curr.delete(this.symbol);

    while (!curr.size && stackValue.length > 0) {
      curr = stackValue.pop();
      curr.delete(stackKeys.pop());
    }

    return true;
  }

  // TODO: add iterator
  keys() {
    const res = [];
    this._keyWalker(this.root, [], res);
    return res;
  }

  _keyWalker(currRoot, currKey, currRes) {
    for (const k of currRoot.keys()) {
      if (k === this.symbol) {
        currRes.push(currKey.slice());
        continue;
      }

      currKey.push(k);
      this._keyWalker(currRoot.get(k), currKey, currRes);
      currKey.pop();
    }
  }
}

module.exports = {
  ArrayKeyMap,
};
