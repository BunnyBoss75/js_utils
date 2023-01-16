# JS Utils

This repository was created to write various interesting functions/classes to improve my hard skills.
So far, this will be a collection of little-related things. To write them, I use different ideas
from different libraries (I will add links to the libraries that inspired me)
and write my own implementations based on them.


## Stringify

Implementation of JSON.stringify with support for Symbol
<br>TODO: improve performance, add stable sort for object keys


## LRU Cache (in development)

Implementation of lru-cache using doubly linked list.
Memory: O(n), set/get/has/delete: O(1) where n - count of elements
Inspired libraries:
* https://github.com/rsms/js-lru (main idea)
