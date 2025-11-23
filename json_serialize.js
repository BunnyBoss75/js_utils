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
streams:
schema
primitive tags
string tags
string variation
binary dict + null + binary data (number/string/schema refs, numbers)
string dict + null + string data
 */

/*
primitive tags:
0 - null
1 - false
2 - true
3-7 - ZigZag 8,16,32,64,128 bit
8-12 - decimal 8(2),16(3),32(4),64(5),128(6) bit(exponent) (all - use (n/10)*9 + (n%10) for mantissa)
13-17 - float 8,16,32,64,128 bit
18 - variant decimal (variant e (1 bit sign), variant m)
19 - big int (variant length + 1 bit sign) + data
20 - date (64 bit int microseconds utc)
21-22 - ref 8,16 bit (16 bit starts from 256)
 */

/*
(use 64 dict during lz77 ref)
string tags:
0 - null
1-2 - ref 8,16 bit (16 bit starts from 256)
3 - utf string
4 - symbol (same as utf string)
5 - regexp (same as utf string)
 */

/*
string encodings:
0 - custom:
  0 - string end
  1 - \t
  2 - \n
  3 - \r
  95 - 32-126 ascii
  (154) al,an,at,de,ea,ed,en,er,es,ha,he,hi,id,in,is,it,le,ly,nd,nt,of,on,ou,re,st,th,to,age,and,api,day,end,env,for,has,ing,ion,key,log,max,min,pay,per,row,tax,ter,the,url,ver,auth,body,card,code,cost,data,date,file,hour,href,html,http,info,item,link,ment,meta,mode,name,next,page,path,rate,role,sale,size,text,time,tion,type,unit,user,uuid,week,year,count,email,error,event,group,image,index,level,limit,order,param,phone,price,query,start,table,title,token,total,value,action,active,actual,amount,client,column,config,header,method,minute,number,offset,option,parent,result,second,source,status,string,target,address,balance,comment,content,created,decimal,deposit,expired,message,product,project,request,service,success,updated,version,category,complete,currency,discount,duration,location,password,quantity,settings,reference,timestamp,confidence,withdrawal,description,destination,transaction
  255 - next - variant encoding utf code point
 */

/*
variation stream:
0 - lower case
1 - upper case
2 - first letter upper
3 - add _
5 - add .
 */


/*
primitive:
1111xxxx:
  1 - int32 (all ZigZag)
  3 - float16
  4 - float32
  5 - float64
  6 - float128
  7 - decimal16(3bit e) (all - use (n/10)*9 + (n%10) for mantissa)
  8 - decimal32(4bit e)
  9 - variant decimal (variant e, 2nd moth significant bit - sign, variant mantissa, )
  10 - true
  11 - false
11111111 - null
 */

// TODO: add all common strings
// TODO: finish ideas with referencing schema

// TODO: use variant from postgres (1 from byte - continue to read number)
// TODO: terminate 0 for strings
// TODO: postgres variant for numbers (int, refs, maybe float)
// TODO: use brotli dictionary for string compression
// TODO: use little-endian
// TODO: 2nd version: use FSE, code additional bits with context
// TODO: compress only json without any extensions
// use dictionary for all (types dict (end) schemas (just ended), binary (number 0), binary (two-bites 0), string dict (empty string) strings)

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
