var debug = require('debuglog')('paired-promises');
var assert = require('assert');

var P = module.exports = function P(impl) {
    if (typeof impl != 'function') throw new Error("Must provide a function to Promise");
    if (!(this instanceof P)) throw new Error("you must call Promise with new");

    this.watchers = [];
    this.catchers = [];

    try {
        impl(this.resolve.bind(this), this.reject.bind(this)); // I DGAF about performance.
    } catch (e) {
        this.reject(e);
    }
};

P.prototype = {
    then: function (lifted, catcher) {
        var next = new P(function (resolve, reject) {

            this.watchers.push(function (val) {
                if (lifted) {
                    try {
                        resolve(lifted(val));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    resolve(val);
                }
            });

            this.catchers.push(function (err) {
                if (catcher) {
                    try {
                        resolve(catcher(err));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(err);
                }
            });
        }.bind(this));

        assert(this.watchers.length > 0, 'have a watcher');
        assert(this.catchers.length > 0, 'have a catcher');

        if (this.value) {
            this.resolve(this.value);
        }

        if (this.error) {
            this.reject(this.error);
        }

        return next;

    },

    resolve: function (value) {
        debug("Resolving with %j", value);
        this.value = value;
        var watchers = this.watchers;
        this.watchers = [];
        watchers.forEach(function (handler) {
            debug("Called resolver");
            handler(value);
        });
    },

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
