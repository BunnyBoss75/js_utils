# Bunny Utils

This repository was created to write various interesting functions/classes to improve my hard skills.
So far, this will be a collection of little-related things. To write them, I use different ideas
from different libraries (I will add links to the libraries that inspired me)
and write my own implementations based on them.


## Stringify

Implementation of JSON.stringify.
### Features:
* symbol supports
* cycle reference save
* stable key order for deterministic result (except symbols because they may have same names)
* well configurable indent
* more functionality replacer

## API
<details>
<summary>API</summary>
example:

```javascript
const stringify = require('bunny-utils').stringify;

const result = stringify({b: 123, a: {}}, {newLine: true, indend: 2, keyValueIndent: 1});
/*

{
  "a": {},
  "b": 123
}

*/
```

`stringify()` takes two parameters: value to stringify and options.
Options are optionals. Result always is a string unlike `JSON.stringify()`
can return `undefined`. Value is any. Options should be an object with optional properties:
* `replacer` - function, default `null`. This function will be called for every value during stringify
recursively. Should return an object with properties `key` and `value`
that will be used as new key and value for stringify. If there is an array - key will be `null`
and returning key will be ignored. Default is `null`
* `comparator` - boolean or function, default `true`. In case if boolean: true - use default comparator
that use `localeCompare` of string, false - don't use comparison. If function - it will be passed as callback
to `Array.sort()`, so it takes two arguments string or symbol and return number. If number > 0 - first
element after second, if number < 0 - second element after first, if number = 0 - ignore element order
* `newLine` - boolean, default `false`. If true - pretty json with line breaks
* `indent` - number, default `0`. Specify indent for every new nesting level
* `keyValueIndent` - number, default `0`. Specify indent between key and value. For example common pretty json has 1
* `ignoreCycles` - boolean, default `true`. If `true` - every cycle will be replaced with string "\_\_cycle__"
if `false` - throw error for first cycle. Consider that for avoiding infinite loop we mast track cycles,
so set this option to `false` doesn't increase performance
* `ignoreSymbols` - boolean, default `false`. If `false` - also stringify symbols by using `symbol.toString()`. If `true` - ignore
symbol keys
</details>

### Inspired libraries:
* https://github.com/ljharb/json-stable-stringify
* https://github.com/ljharb/jsonify
* https://github.com/BridgeAR/safe-stable-stringify

## LRU Cache (in development)

Implementation of lru-cache using doubly linked list.
Memory: O(n), set/get/has/delete: O(1) where n - count of elements
Inspired libraries:
* https://github.com/rsms/js-lru (main idea)
