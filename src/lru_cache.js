const defaultLruOptions = {
  keyLimit: 100,
  ttl: 60 * 1000,
  getDate: Date.now,
  removeExpiredCoolDown: null,
}

class LRU {
  // TODO: create with entries
  // TODO: refactor and use default props
  constructor(options) {
    options = {
      ...defaultLruOptions,
      ...options,
    };

    this.keyLimit = options.keyLimit;
    this.ttl = options.ttl;
    this.getDate = options.getDate;

    this.new = this.old = null;
    this.keySize = 0;
    this.cache = new Map();

    this.removeExpiredCoolDown = options.removeExpiredCoolDown;
    if (this.removeExpiredCoolDown) {
      this.intervalId = setInterval(this._removeExpired, this.removeExpiredCoolDown);
      if (this.intervalId && typeof this.intervalId.unref === 'function') {
        this.intervalId.unref(); // interval doesn't prevent stopping process
      }
    }
  }

  // TODO: add "many" versions of function
  set(key, value, ttl) {
    if (this.cache.has(key)) {
      this._update(key, value, ttl);
    } else {
      this._setNew(key, value, ttl);
    }

    return value;
  }

  get(key) {
    const data = this._getData(key);
    return data ? data.v : undefined;
  }

  // TODO: in safeCache check resolver is function and other parameters check
  async fetch(key, resolver, ttl) {
    const data = this._getData(key);
    if (data) return data.v;

    const newValue = await resolver();
    this._setNew(key, newValue, ttl);
    return newValue;
  }

  // TODO: add deleteByValue ?
  delete(key) {
    const data = this.cache.get(key);
    if (!data) return undefined;

    this._deleteByData(data);
    return data.v;
  }

  // TODO: add hasValue
  has(key) {
    return !!this._getData(key);
  }

  _setNew(key, value, ttl) {
    if (!this.cache.has(key) && this.keySize >= this.keyLimit) {
      this._deleteOldest();
    }

    const newTtl = this.getDate() + (ttl || this.ttl);

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
    } else { // first element in the list
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
  }

  _update(key, newValue, newTtl) {
    const data = this.cache.get(key);
    this._makeNew(data);

    data.v = newValue;
    data.t = this.getDate() + (newTtl || this.ttl);
  }

  _getData(key) {
    const data = this.cache.get(key);
    if (!data) return undefined;

    if (data.t < this.getDate()) {
      this._deleteByData(data);
      return undefined;
    }

    this._makeNew(data);

    return data;
  }

  _deleteByData(data) {
    this.cache.delete(data.k);

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
    if (data === this.new) { // if single value - always yes
      return;
    }

    if (this.keySize > 2) {
      if (data === this.old) {
        this.old = data.n;
        this.old.o = null;
      } else {
        data.n.o = data.o;
        data.o.n = data.n;
      }

      this.new.n = data;
      data.o = this.new;
      this.new = data;
      data.n = null;
    } else { // there are two values
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

  _removeExpired() {
    const currentTime = this.getDate();

    let current = this.new;
    while(current) {
      const next = current.n;
      if (current.t < currentTime) {
        this._deleteByData(current);
      }
      current = next;
    }
  }
}

class SafeLRU extends LRU {
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

module.exports = {
  LRU,
  SafeLRU,
}
