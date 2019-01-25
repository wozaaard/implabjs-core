define(
    [ "dojo/_base/declare", "dojo/_base/lang", "dojo/Evented", "../log/_LogMixin" ],

    function(declare, lang, Evented, _LogMixin) {
        return declare([ Evented, _LogMixin ], {
            _session : null,
            _destination : null,
            _id : null,

            constructor : function(session, destination) {
                this._destination = destination;
                this._session = session;
            },

            getDestination : function() {
                return this._destination;
            },

            start : function() {
                var me = this;
                return me._session.createClient(me.prepareOptions({})).then(
                    function(id) {
                        me._id = id;
                        return me;
                    });
            },

            prepareOptions : function(options) {
                var me = this;
                options.mode = me.getMode();
                options.destination = me.getDestination();
                options.client = function(msg) {
                    me.process(msg);
                };
                return options;
            },

            process : function() {
                this.warn("Messages are not acceped by this client");
            },

            stop : function() {
                var me = this;
                if (me._id) {
                    me.log("stop");
                    return me._session.deleteClient({'clientId': me._id}).then(function() {
                        me._id = null;
                        return me;
                    });
                }
            },

            toString : function() {
                return "["
                    + [
                        this.getMode().toUpperCase(),
                        this.getDestination(),
                        this._id ].join(',') + "]";
            }
        });
    });