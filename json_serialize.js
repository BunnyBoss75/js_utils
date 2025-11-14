/*
0 primitive
1 string
2 array (ending with end)
3 array types equal (store size) (bytes the same for object ref)
4 object (keys, values, ending with end)
5 object ref (00 - key, 01 - key-types, 10 - key recursive, 11 - key-types recursive)
6 store next value to schema/value list
7 end
 */

/*
number:
00xxxxxx - variant number ref
01xxxxxx - variant continue number ref
100xxxxx - 13bit ZigZag
101xxxxx - 21bit ZigZag
11000000 - 11101111 - 48 variants ZigZag
1111xxxx:
  1 - int32 (all ZigZag)
  2 - int64
  3 - int128
  4 - float16
  5 - float32
  6 - float64
  7 - float128
  8 - decimal16(3bit e) (all - use (n/10)*9 + (n%10) for mantissa)
  9 - decimal32(4bit e)
  10 - decimal64(5bit e)
  11 - decimal128(6bit e)
  12 - variant decimal (variant e, 2nd moth significant bit - sign, variant mantissa, )
  13 - big int - variant byte length and binary
  14 - null
  15 - true
  16 - false

string:
00xxxxxx - variant string ref
01xxxxxx - variant continue string ref
10xxxxxx - 6bit utf-8-length string
11000000 - 0x00 ended string (seems need to code utf-codes with variant)
11xxxxxx - list of common strings:
id,type,name,url,data,status,error,message,value,user,size,key,path,body,api_key

 */

// TODO: add all common strings
// TODO: finish ideas with referencing schema

// TODO: use variant from postgres (1 from byte - continue to read number)
// TODO: terminate 0 for strings
// TODO: postgres variant for numbers (int, refs, maybe float)
// TODO: use brotli dictionary for string compression
// TODO: use little-endian
// TODO: 2nd version: use FSE, code additional bits with context

/*
{a:{b:1,b1:2,b2:3},c:"2"}
  -(obj)[2](obj)[3](int)(int)(int)(str)
  -(obj)[2](obj)(str)[3](int)(int)(int)
[{a:{b:1,b1:2,b2:3},c:"2"},{a:{b:1,b2:3},c:"2"}]
  -(arr)(obj)(obj)(int)(int)(int)(end)(str)(end)(obj_ref_kt)(int)(int)(end)(end)
  -["a"]["b"][1]["b1"][2]["b2"][3]["c"]["2"][1]["b"][1]["b2"][3]["2"]

  -(arr)(def_obj_kt)(obj)(str)(end)(int)(int)(int)(end)(obj_ref)(int)(int)(end)(end)
  -["a"]["c"]["b"][1]["b1"][2]["b2"][3]["2"][0]["b"][1]["b2"][3]["2"]

  -(arr)(def_obj_kt)(obj)(str)(end)(int)(int)(int)(end)(obj_ref)(int)(int)(end)(end)
  -["a"]["c"]["b"]["b1"]["b2"]["2"]["b"]["b2"]["2"] + refs
  -[1][2][3][0][1][3] + refs

  -(arr_e)01(obj)(obj)(int)(int)(int)(end)(str)(end)(obj)(int)(int)(end)
  -"a","c","b","b1","b2","2","b","b2","2"
  -[2][1][2][3][1][3]
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
