/*
interesting algorithms:
  10 - DMC + uABS (hard)
  11 - LZMA custom (LZ77 + 10) (complicated)
  12 - PPMd + rANS
  13 - Context Mixing + uABS (hard)
 */

/*
header byte:
00 - version 1
version 1 header 6 bit:
2 - if 0 - compressed to single block (raw json) next - byte - compression header
- compression header next - will be the same to all blocks
4-7 - n - number of blocks
then - n varint numbers - length (in bytes) of blocks
then - n - type of blocks (4 bit each), zero followed to full byte

compression header byte:
4bit - compression -
  1 - store
  -none-
  2 - Palette Bit-Pack + Uniform/Adaptive Range Coder (4 bytes)
  -1 uniform/adaptive (more than 100 symbols)
  -0 - 3 bit pallet length (2-9), 0 - 6 bit pallet length (10 - 73)
  3 - LZ4
  -none-
  4 - deflate
  -none-
  5 - LZP + uABS flags + FSE literals (fast)
  -2, 3, 4, 5 previous bytes for hash - 2 bit (64 kb no hash, 512 kb, 1 mb, 4 mb)
  6 - Adaptive Frequency Model (order 1,2) + rANS (fast PPM)
  - 2 bit order (0, 1, 2, 3)
  7 - MTF(0,1,2,3(hash)) + RLE + FSE/rANS (simple)
  - 1 bit - FSE/rANS
  - 2 bit - order (0,1,2,3)
  8 - LZ77 + rANS (custom deflate)
  9 - BWT(block size, max 4mb) + MTF + RLE + FSE/rANS
  -1 bit 0 - FSE or 1 - rANS
  -3 bit - block size (16kb, 32kb, 64kb, 128kb, 256kb, 512kb, 1mb, 4mb)
4bit - additional data for algorithm (if applicable)

Palette Bit-Pack - palette symbols, then data encoded as indexes
Uniform/Adaptive Range Coder - Range Coder with 1/n probabilities / adaptive probabilities staring from 1/n
  (count meets up to 256, then divide all by 2 with round up)
Adaptive Frequency Model - tables of previous meets (probabilities)

LZ4 - byte aligned LZ77 without entropy
LZP - guess symbol (hash with collisions, need to specify order and matched table size) - 1, not guessed - 0 and literal
  Flags and literals - mixed
FSE - implementation tANS (list of probabilities)
rANS - adaptive real ANS with multiplication
uABS - optimized bit ANS with static probability (1 byte number probability of 0)
 */

/*
0 primitive
1 string
2 bool
2 array (ending with end)
3 array types equal (store size) (bytes the same for object ref)
4 object (keys, values, ending with end)
5 ref keys (obj) (n types followed)
6 ref keys + types (obj or array) (just read schema from dictionary and only subtypes from stream)
7 ref keys + types - recursive - full schema match
8 end
 */

/*
each stream - separate block with common header with type of block, compression algorithm and size
streams:
schema dict + end + schema
schema
bool
null mask
primitive tags
string tags
string variation
binary dict + null + binary data
just binary data
string dict + null + string data
just string data
reference (schema/binary/string)
 */

/*
bool values:
false
true
 */

/*
primitive tags:
1 - false
2 - true
3-7 - ZigZag 8,16,32,64,128 bit
8-12 - decimal 8(2),16(3),32(4),64(5),128(6) bit(exponent) (all - use (n/10)*9 + (n%10) for mantissa)
13-17 - float 8,16,32,64,128 bit
18 - varint decimal (varint e (first bit sign), varint m)
19 - big int (1 bit sign + varint length) + data
20 - date (64 bit int microseconds utc)
21-22 - ref 8,16 bit (16 bit starts from 256)
 */

/*
string tags:
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
255 - next - varint encoding utf code point
 */

/*
variation stream:
0 - lower case
1 - upper case
2 - first letter upper
3 - add at the end _
4 - add at the end .
 */

// TODO: finish ideas with referencing schema

// TODO: postgres variant for numbers (int, refs, maybe float)
// TODO: use brotli dictionary for string compression
// TODO: use little-endian
// TODO: try Huffman, than maybe MTF with map of previous byte (for more than 5 kb) or two bytes (for more than 1-5 Mb)
// TODO: use Neural Context Mixing + ANS for max compression in the future
// use dictionary for all (types dict (end) schemas (just ended), binary (number 0), binary (two-bites 0), string dict (empty string) strings)

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
