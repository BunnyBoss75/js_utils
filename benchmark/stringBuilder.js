const Benchmark = require('benchmark');

const testString = '`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+ASDFGHJKL:"ZXCVBNM<>?\n\t😎`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+ASDFGHJKL:"ZXCVBNM<>?\n\t';
const bigTestString = testString.repeat(10);
const smallTestString = testString.substring(0, 10);

module.exports = (name, Builder) => {
  const suite = new Benchmark.Suite(name);
  suite
    .add(`${name}: test string 100            `, () => {
      const builder = new Builder();
      for (let i = 0; i < 100; ++i) {
        builder.addString(testString);
      }
      builder.toString();
    })
    .add(`${name}: test string parts 1000     `, () => {
      const builder = new Builder();
      for (let i = 0; i < 1000; ++i) {
        builder.addString(testString.substring(0, i % testString.length));
      }
      builder.toString();
    })
    .add(`${name}: test string parts 100000   `, () => {
      const builder = new Builder();
      for (let i = 0; i < 100000; ++i) {
        builder.addString(testString.substring(0, i % testString.length));
      }
      builder.toString();
    })
    .add(`${name}: test string parts 1000000  `, () => {
      const builder = new Builder();
      for (let i = 0; i < 1000000; ++i) {
        builder.addString(testString.substring(0, i % testString.length));
      }
      builder.toString();
    })
    .on('cycle', event => {
      console.log(String(event.target));
    })

  suite.run();
};
