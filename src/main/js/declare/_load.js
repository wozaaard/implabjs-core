define([], function () {
    'use strict';

    return {
        load: function (id, require, callback) {
            require(['dojo/_base/declare'], function (declare) {
                callback(declare);
            });
        }
    };

});