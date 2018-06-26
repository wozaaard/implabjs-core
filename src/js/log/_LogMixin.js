define([ "dojo/_base/declare" ],

function(declare) {
    var cls = declare(null, {
        _logChannel : null,

        _logLevel : 1,

        constructor : function(opts) {
            if (typeof opts == "object") {
                if ("logChannel" in opts)
                    this._logChannel = opts.logChannel;
                if ("logLevel" in opts)
                    this._logLevel = opts.logLevel;
            }
        },

        getLogChannel : function() {
            return this._logChannel;
        },

        setLogChannel : function(v) {
            this._logChannel = v;
        },

        getLogLevel : function() {
            return this._logLevel;
        },

        setLogLevel : function(v) {
            this._logLevel = v;
        },

        log : function(format) {
            if (this._logChannel && this._logLevel > 2)
                this._logChannel.log.apply(this._logChannel, arguments);
        },
        warn : function(format) {
            if (this._logChannel && this._logLevel > 1)
                this._logChannel.warn.apply(this._logChannel, arguments);
        },
        error : function(format) {
            if (this._logChannel && this._logLevel > 0)
                this._logChannel.error.apply(this._logChannel, arguments);
        },

        /**
         * Used to by widgets
         */
        startup : function() {
            var me = this, parent;
            if (!me.getLogChannel()) {
                parent = me;
                while (parent = parent.getParent()) {
                    if (parent.getLogChannel) {
                        me.setLogChannel(parent.getLogChannel());
                        if(parent.getLogLevel)
                            me.setLogLevel(parent.getLogLevel());
                        break;
                    }
                }
            }
            this.inherited(arguments);
        }
    });
    return cls;
});