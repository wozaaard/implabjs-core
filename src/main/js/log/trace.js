define(["./TraceSource"], function (TraceSource_1) {
    'use strict';

    var TraceSource = TraceSource_1.TraceSource;

    return {

        on: function (filter, cb) {
            if (arguments.length == 1) {
                cb = filter;
                filter = undefined;
            }
            var test;
            if (filter instanceof RegExp) {
                test = function (chId) {
                    return filter.test(chId);
                };
            } else if (filter instanceof Function) {
                test = filter;
            } else if (filter) {
                test = function (chId) {
                    return chId == filter;
                };
            }

            if (test) {
                TraceSource.on(function (source) {
                    if (test(source.id))
                        source.on(cb);
                });
            } else {
                TraceSource.on(function (source) {
                    source.on(cb);
                });
            }
        },

        load: function (id, require, cb) {
            if (id) {
                cb(TraceSource.get(id));
            } else if (require.module && require.module.mid) {
                cb(TraceSource.get(require.module.mid));
            } else {
                require(['module'], function (module) {
                    cb(TraceSource.get(module && module.id));
                });
            }
        },

        dynamic: true,
    };
});