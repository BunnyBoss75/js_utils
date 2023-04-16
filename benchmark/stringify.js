const Benchmark = require('benchmark');

const data = require('../package.json');
const dataArray10 = Array(10).fill(1).map(() => data);
const dataArray100 = Array(100).fill(1).map(() => data);
const circular = {...data};
circular.circular = data;
const circularArray = Array(10).fill(1).map(() => circular);
circularArray.push(circularArray);
circularArray[0].circularArray = circularArray;
const deep = {...data};
let currentDeep = deep;
for (let i = 0; i < 20; ++i) {
  currentDeep.deep = {...data};
  currentDeep = currentDeep.deep;
}

module.exports = (name, stringify) => {
  const suite = new Benchmark.Suite(name);
  suite
    .add(`${name}: empty object    `, () => {
      stringify({});
    })
    .add(`${name}: single property `, () => {
      stringify({a:1});
    })
    .add(`${name}: simple array    `, () => {
      stringify([{a:1}, {b:3, a:2}]);
    })
    .add(`${name}: package.json    `, () => {
      stringify(data);
    })
    .add(`${name}: package.json 10 `, () => {
      stringify(dataArray10);
    })
    .add(`${name}: package.json 100`, () => {
      stringify(dataArray100);
    })
    .add(`${name}: circularArray   `, () => {
      stringify(circular);
    })
    .add(`${name}: deep            `, () => {
      stringify(deep);
    })
    .on('cycle', event => {
      console.log(String(event.target));
    })

  suite.run();
};
