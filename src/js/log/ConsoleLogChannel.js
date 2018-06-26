define(
    [ "dojo/_base/declare", "../text/format" ],
    function(declare, format) {
        return declare(
            null,
            {
                name : null,

                constructor : function(name) {
                    this.name = name;
                },

                log : function() {
                    console.log(this._makeMsg(arguments));
                },

                warn : function() {
                    console.warn(this._makeMsg(arguments));
                },

                error : function() {
                    console.error(this._makeMsg(arguments));
                },

                _makeMsg : function(args) {
                    return this.name ? this.name + " " +
                        format.apply(null, args) : format.apply(null, args);
                }
            });
    });