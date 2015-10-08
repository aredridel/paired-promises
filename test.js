
var tap = require('tap');

var P = require('./');

tap.test('can instantiate promise', function (t) {
    var p = new P(function () {
    });

    t.ok(p);
    t.end();
});

tap.test('instantiating promise without implementation fails', function (t) {
    t.plan(1);
    try {
        var p = new P();
        t.fail('should not get here');
    } catch (e) {
        t.ok(e);
    }

    t.end();
});

tap.test('instantiating promise without new fails', function (t) {
    t.plan(1);
    try {
        var p = P(function () {});
        t.fail('should not get here');
    } catch (e) {
        t.ok(e);
    }

    t.end();
});

tap.test('promises have the interface', function (t) {
    var p = new P(function () {
    });

    t.equal(typeof p.then, 'function');
    t.equal(typeof p.resolve, 'function');
    t.equal(typeof p.reject, 'function');
    t.end();
});

tap.test('Promises call back', function (t) {
    t.plan(2);

    var p = new P(function (y, n) {
        setImmediate(function () {
            y('It works!');
        });
    });

    var count = 0;
    p.then(function (success) {
        t.equal(success, 'It works!');
        count ++;

        if (count == 2) {
            t.end();
        }
    });
    p.then(function (success) {
        t.equal(success, 'It works!');
        count ++;

        if (count == 2) {
            t.end();
        }
    });
});

tap.test('Promises error back', function (t) {
    t.plan(1);

    var p = new P(function (y, n) {
        setImmediate(function () {
            n('It fails!');
        });
    });

    p.then(null, function (err) {
        t.equal(err, 'It fails!');
        t.end();
    });
});

tap.test('Promises can be dereferened later', function (t) {
    t.plan(2);

    var p = new P(function (y, n) {
        y('It works!');
    });

    p.then(function (success) {
        t.equal(success, 'It works!');

        p.then(function (success) {
            t.equal(success, 'It works!');
            t.end();
        });
    });
});
