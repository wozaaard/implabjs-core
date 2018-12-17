"use strict";
define([], function () {
    var slice = Array.prototype.slice;
    var override = function (method) {
        var proxy;

        /** @this target object */
        proxy = function () {
            var me = this;
            var inherited = (this.getInherited && this.getInherited(proxy.nom, {
                callee: proxy
            })) || function () {};

            return method.apply(me, [function () {
                return inherited.apply(me, arguments);
            }].concat(slice.apply(arguments)));
        };

        proxy.method = method;
        proxy.overrides = true;

        return proxy;
    };

    override.before = function (method) {
        var proxy;

        /** @this target object */
        proxy = function () {
            var me = this;
            var inherited = (this.getInherited && this.getInherited(proxy.nom, {
                callee: proxy
            })) || function () {};


            method.apply(me, arguments);
            return inherited.apply(me, arguments);
        };

        proxy.method = method;
        proxy.overrides = true;

        return proxy;
    };

    override.after = function (method) {
        var proxy;

        /** @this target object */
        proxy = function () {
            var me = this;
            var inherited = (this.getInherited && this.getInherited(proxy.nom, {
                callee: proxy
            })) || function () {};

            inherited.apply(me, arguments);

            return method.apply(me, arguments);
        };

        proxy.method = method;
        proxy.overrides = true;

        return proxy;
    };

    override.hide = function (method) {
        method.overrides = false;
        return method;
    };

    return override;
});