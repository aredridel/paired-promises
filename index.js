var Promise = module.exports = function Promise(impl) {
    if (typeof impl != 'function') throw new Error("Must provide a function to Promise");
    if (!(this instanceof Promise)) throw new Error("you must call Promise with new");

    this.watchers = [];
    this.catchers = [];

    try {
        impl(this.resolve.bind(this), this.reject.bind(this)); // I DGAF about performance.
    } catch (e) {
        this.reject(e);
    }
};

Promise.prototype = {
    then: function (lifted, catcher) {
        if (lifted) this.watchers.push(lifted);
        if (catcher) this.catchers.push(catcher);

        if (this.value) {
            this.resolve(this.value);
        }

        if (this.error) {
            this.reject(this.error);
        }
    },

    resolve: function (value) {
        this.value = value;
        var watchers = this.watchers;
        this.watchers = [];
        watchers.forEach(function (handler) {
            handler(value);
        });
    },

    reject: function (error) {
        this.error = error;
        var catchers = this.catchers;
        this.catchers = [];
        catchers.forEach(function (catcher) {
            catcher(error);
        });
    }
};
