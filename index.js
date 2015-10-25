var debug = require('debuglog')('paired-promises');
var assert = require('assert');

// The main interface to making a new promise is a constructor that takes a
// function with the 'guts' of the promise. `impl` here takes two arguments: an
// 'resolve' function, which it calls if it has a value to give, and a 'reject'
// function, which it calls if it has an error to give instead.
var P = module.exports = function P(impl) {
    if (typeof impl != 'function') throw new Error("Must provide a function to Promise");
    if (!(this instanceof P)) throw new Error("you must call Promise with new");

    // The list of things that want to be told if this promise resolves, that
    // is, the `impl` function calls its `resolve` parameter.
    this.watchers = [];

    // The list of things that want to be told if this promise is rejected,
    // that is, the `impl` function calls its `reject` parameter.
    this.catchers = [];

    try {
        // So impl can also throw, and we need to catch that and pretend it was
        // a call to the reject function instead.
        impl(this.resolve.bind(this), this.reject.bind(this)); // I DGAF about performance.

        // A note about function.bind: It's slow. usually I don't care about
        // slow if clarity is improved. Bind is so slow that even so, I take
        // note. But this is a learning repo and how to bind 'this' in a
        // function is not an interesting part of this demo. :)

    } catch (e) {

        // So if impl throws, here we turn it into a rejection.
        this.reject(e);
    }
};

P.prototype = {
    // `then` is the main interface to using a promise: to get its value, you
    // call then on the promise, and it will call back with the value. There's
    // a lot of surprising analogies between `promise.then` and things in other
    // languages.
    //
    // It's a bit like the `*` (pointer dereference) operator in C and C++, in
    // that it gets the value of something indirectly.
    //
    // It's a bit like the Maybe monad in Haskell, in that there are two paths
    // through it, and errors are carried along toward the place where the
    // result is used.
    //
    // the term "lift" in `lifted` comes from Haskell-style functional
    // programming -- a function is "lifted" when it's wrapped up in a monad.
    // What that means exactly isn't important in Javascript or to understand
    // promises really, but there's a term of art here and we're using it.
    //
    // Catcher is similar to lifted, but it's for the error path.
    //
    // `lifted` will be called with the result of the promise if there is one,
    // and catcher will be called with an error if there is one. Only one of
    // the two will be called. Either may be null.
    //
    // If there is a lifted or catcher function, its value will be used as the
    // result of the promise that `then` returns if it gets called. (one of the
    // two will).
    //
    // If there is not a lifted or catcher function, the value of the previous
    // promise is carried forward.
    //
    // This function is where a lot of the meat of promises is set up. It's an
    // awful lot of description for something pretty simple.
    then: function (lifted, catcher) {
        // So then actually returns a new promise -- this is what allows
        // chaining -- thing.then(fn).then(fn2)
        //
        // The `chainedPromiseImpl` function is bound to the promise that
        // `then` was called on, just so you can read this clearly.
        var next = new P(function chainedPromiseImpl(resolve, reject) {

            // In here, we link the success path of the previous promise
            // (`this`) to the next promise (`next`)
            this.watchers.push(function afterPreviousPromiseFires(val) {
                // This function we're in now gets called later, when there is
                // a value to the promise.
                if (lifted) {
                    try {
                        // So we call lifted, and use its value if we have one.
                        //
                        // If that throws, we reject this `next` promise.
                        resolve(lifted(val));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    // lifted was null, so just pass the previous value along.
                    resolve(val);
                }
            });

            // And here, we link the error path, just like above.
            this.catchers.push(function handleErrorFromPreviousPromise(err) {
                if (catcher) {
                    try {
                        // A catcher can return a replacement value in the
                        // event of an error -- if it returns one, use it.
                        resolve(catcher(err));
                    } catch (e) {
                        // But if the catcher itself throws, we pass that error
                        // onward.
                        reject(e);
                    }
                } else {

                    // And if there was no catcher, we pass the previous error
                    // onward.
                    reject(err);
                }
            });
        }.bind(this));

        // So at this point, watchers and catchers both have at least one handler. Promises can be dereferenced multiple times, so it's an array, but at least our stuff has to be here.
        //
        // This implies that `new P(impl)` calls `impl` synchronously.
        assert(this.watchers.length > 0, 'have a watcher');
        assert(this.catchers.length > 0, 'have a catcher');

        // So if `then` was called on a promise that already had resolved, we
        // call its callback immediately. We just call our resolve helper
        // method with that value, just as if the value was coming in for the
        // first time. It'll fire any waiting watchers.
        if (this.value) {
            this.resolve(this.value);
        }

        // `this.value` and `this.error` can't both be things at the same time,
        // but here we reject if there was a waiting error. Either this or the
        // resolve above will happen, not both.
        if (this.error) {
            this.reject(this.error);
        }

        // And here we return the next promise for future chaining.
        return next;

    },

    // `resolve` gives this promise a value, and fires any waiting watchers.
    resolve: function (value) {
        debug("Resolving with %j", value);
        this.value = value;
        var watchers = this.watchers;

        // We clear the watchers: each is guaranteed to only be called once, so
        // we remove them.
        this.watchers = [];

        // Call those watchers. We had to make a temporary copy since the
        // handler could have added more handlers.
        watchers.forEach(function (handler) {
            debug("Called resolver");
            handler(value);
        });
    },

    // `reject` gives this promise an error instead of a value, and fires
    // catchers rather than watchers. It's otherwise like `resolve`.
    reject: function (error) {
        debug("Rejecting with %j", error);
        this.error = error;
        var catchers = this.catchers;
        this.catchers = [];
        catchers.forEach(function (catcher) {
            debug("Called catcher");
            catcher(error);
        });
    }
};
