define([ "dojo/_base/declare", "dojo/_base/lang", "./Client" ],

function(declare, lang, Client) {
    return declare([ Client ], {
        _listener : null,

        constructor : function(session, destination, options) {
            if (!options || !options.listener)
                throw new Error("A listener is required");
            this._listener = options.listener;
            if (options.transform)
                this._transform = options.transform;
        },

        getMode : function() {
            return "listener";
        },

        process : function(result) {
            switch (result.type) {
            case "message":
                try {
                    this._handleMessage(result.message);
                } catch (ex) {
                    var err = new Error("Failed to handle message");
                    err.envelope = result.message;
                    err.innerException = ex;
                    this._handleError(err);
                }
                break;
            case "error":
                this._handleError(result.error);
                break;
            }

        },

        _transform : function(envelope) {
            return envelope;
        },

        _handleMessage : function(envelope) {
            this.log(
                "MESSAGE type = ${0}, headers = ${2}: ${1}",
                envelope.bodyType,
                envelope.body,
                JSON.stringify(envelope.headers));
            var data = this._transform(envelope);
            this._listener(data);
            this.emit("message", data);
        },

        _handleError : function(ex) {
            if (ex.innerException)
                this.error(
                    "ERROR: ${0} -> ${1}",
                    ex.message,
                    ex.innerException.message);
            else
                this.error("ERROR: ${0}", ex.message);
            this.emit("error", ex);
        }
    });
});