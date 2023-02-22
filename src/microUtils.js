const defaultStringSymbolCompare = (a, b) => a.toString().localeCompare(b.toString());

const defaultStringCompare = (a, b) => a.localeCompare(b);

module.exports = {
  defaultStringSymbolCompare,
  defaultStringCompare,
}
