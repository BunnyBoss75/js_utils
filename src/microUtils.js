const defaultStringSymbolCompare = (a, b) => String.prototype.localeCompare.call(a.toString(), b.toString());

module.exports = {
  defaultStringSymbolCompare,
}
