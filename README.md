paired-promise
==============

This is a learning implementation of much of Javascript Promises.

This is incomplete:

* It doesn't handle some of the edges, like flattening promises returned from lifted handler functions (that is, calling then on them itself if the function you pass to then returns a new promise)
* It doesn't force the functions to be called asynchronously, since that's not core to the concept and mostly just a thing Javascript promises do to keep non-promise-based asynchronous code from releasing zalgo and running things in surprising orders
* It is totally naive about how to handle undefined and null returned. Imagine me putting on sunglasses real slow and saying 'deal with it'.

That said, this is much of what promises _do_ to implement the interface they present to the world, and this is a very simple learning tool.

Enjoy! If this is useful to you, say hi!

Aria Stewart <aredridel@dinhe.net>
