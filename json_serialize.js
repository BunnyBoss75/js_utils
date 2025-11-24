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
string tags:
0 - null
1-2 - ref 8,16 bit (16 bit starts from 256)
3 - utf string
4 - custom encoding string
5 - symbol (same as utf string)
6 - regexp (same as utf string)
 */

/*
string custom encoding:
0 - string end
(95) - 32-126 ascii
(159) al,an,at,by,de,ed,en,er,es,id,in,is,it,le,ly,nd,nt,on,re,st,th,to,up,age,api,app,com,day,dis,end,env,for,has,ing,ion,key,log,max,min,new,num,pay,per,pro,ref,row,set,str,sub,sys,tag,tax,ter,url,ver,auth,body,code,cost,data,date,file,form,from,hour,info,item,last,link,list,main,ment,meta,mode,name,next,open,page,path,rate,role,size,text,time,type,unit,user,year,admin,count,email,error,event,first,group,image,index,level,limit,login,month,order,param,phone,price,query,start,state,table,title,token,total,value,access,action,active,amount,client,column,config,create,delete,device,header,method,minute,offset,option,parent,public,result,script,second,source,status,target,address,balance,content,current,decimal,default,expired,message,product,project,request,service,success,version,category,currency,duration,location,password,quantity,response,timestamp,transaction
255 - next - variant encoding utf code point
 */

/*
variation stream:
0 - lower case
1 - upper case
2 - first letter upper
3 - add at the end _
4 - add at the end .
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
// TODO: try Huffman, than maybe MTF with map of previous byte (for more than 5 kb) or two bytes (for more than 1-5 Mb)
// TODO: use Neural Context Mixing + ANS for max compression in the future
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
