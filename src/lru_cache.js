export class Cache {
  constructor(options) {
    // TODO
    options = options || {};

    this.keyLimit = options.keyLimit || 100;
    this.ttl = options.ttl || 60 * 1000;
    this.getDate = options.getDate || Date.now.bind(Date);

    this.new = this.old = null;
    this.keySize = 0;
    this.cache = new Map();
  }

  set(key, value, ttl) {
    if (!this.cache.get(key) && this.keySize >= this.keyLimit) {
      this._deleteOldest();
    }

    const newTtl = this.getDate() + ttl || this.ttl;

    let data;
    if (this.keySize) {
      data = {
        k: key,
        v: value,
        t: newTtl,
        n: null,
        o: this.new,
      };
      this.new.n = data;
      this.new = data;
    } else {
      data = {
        k: key,
        v: value,
        t: newTtl,
        n: null,
        o: null,
      };
      this.new = this.old = data;
    }

    this.cache.set(key, data);
    ++this.keySize;
    return value;
  }

  delete(key) {
    const data = this.cache.get(key);
    if (!data) return undefined;

    this.cache.delete(key);
    return this._deleteData(data);
  }

  has(key) {
    return !!this._getData(key);
  }

  _getData(key) {
    const data = this.cache.get(key);
    if (!data) return undefined;

    if (data.t < this.getDate()) {
      this.cache.delete(key);
      this._deleteData(data);
      return undefined;
    }

    return data;
  }

  _deleteData(data) {
    if (this.keySize === 1) {
      this.new = this.old = null;
    } else if (this.new === data) {
      this.new = data.o;
      this.new.n = null;
    } else if (this.old === data) {
      this.old = data.n;
      this.old.o = null;
    } else {
      data.n.o = data.o;
      data.o.n = data.n;
    }

    --this.keySize;
    return data.v;
  }

  _makeNew(data) {
    if (data === this.new) {
      return;
    }

    if (this.keySize !== 2) {
      if (data === this.old) {
        this.old = data.n;
        data.n.o = null;
      } else {
        data.n.o = data.o;
        data.o.n = data.n;
      }

      this.new.n = data;
      data.o = this.new;
      this.new = data;
      data.n = null;
    } else {
      this.old.o = this.new;
      this.old.n = null;
      this.new.o = null;
      this.new.n = this.old;
      this.old = this.new;
      this.new = this.old.n;
    }
  }

  _deleteOldest() {
    const key = this.old.k;

    if (this.keySize > 2) {
      this.old.n.o = null;
      this.old = this.old.n;
    } else if (this.keySize === 2) {
      this.new.o = null;
      this.old = this.new;
    } else {
      this.new = this.old = null;
    }

    this.cache.delete(key);
    --this.keySize;
  }
}

export class SafeCache extends Cache {
  constructor(options) {
    super(options);
  }

  _checkKey(key) {
    // TODO: use
    if (typeof key !== 'string') {
      throw new Error('Cache key must be a string');
    }
  }
}
