// TODO: add possibility to add specific mapping to value. For example replace value with ref('a'), and during decoding
//       return ref('a') and ask to place a value instead of it.

/*
0 null
1 false
2 true
3 int8
4 int16
5 int32
6 int64
7 int128
8 float16
9 float32
11 float64
12 float128
13 number ref
12 string
11 string ref
13 array
13 array types equal
14 object
15 object key ref
16 object key-types ref
17 store next value to schema/value list
 */

/*
{a:{b:1,b1:2,b2:3},c:"2"}
  -(obj)[2](obj)[3](int)(int)(int)(str)
  -(obj)[2](obj)(str)[3](int)(int)(int)
[{a:{b:1,b1:2,b2:3},c:"2"},{a:{b:1,b2:3},c:"2"}]
  -(arr)(obj)(obj)(int)(int)(int)(end)(str)(end)(obj_ref_kt)(int)(int)(end)(end)
  -["a"]["b"][1]["b1"][2]["b2"][3]["c"]["2"][1]["b"][1]["b2"][3]["2"]
  -(arr)(def_obj_kt)(obj)(str)(end)(int)(int)(int)(end)(obj_ref)(int)(int)(end)(end)
  -["a"]["c"]["b"][1]["b1"][2]["b2"][3]["2"][0]["b"][1]["b2"][3]["2"]
 */

const recursiveUniqValueWalker = (map, value) => {
  switch (typeof value) {
    case 'string':
      map.set()
  }
};

const serialize = (obj, options) => {
  const uniqValueMap = recursiveUniqValueWalker(new Map(), obj);
};

module.exports = {
  serialize,
}
