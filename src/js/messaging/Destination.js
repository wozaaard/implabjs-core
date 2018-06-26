define([ "dojo/_base/declare", "./Listener" ],

function(declare, Listener) {
    return declare(null, {
        _session : null,
        _destination : null,
        _listenerClass : null,

        constructor : function(session, destination, options) {
            if (!session)
                throw new Error("A session is required");
            if (!destination)
                throw new Error("A destination is required");

            this._session = session;
            this._destination = destination;
            if (options) {
                if (options.listenerClass)
                    this._listenerClass = options.listenerClass;
            }
        },

        listen : function(callback) {
            var factory = this._listenerClass || Listener;
            var listener = new factory(this._session, this._destination, {
                listener : callback
            });
            listener.start();

            return listener;
        }

    });
});
