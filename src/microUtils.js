const defaultStringSymbolCompare = (a, b) => a.toString().localeCompare(b.toString());

const defaultStringCompare = (a, b) => a.localeCompare(b);

const phi = (1 + Math.sqrt(5)) / 2;

module.exports = {
  defaultStringSymbolCompare,
  defaultStringCompare,

  phi,
}
