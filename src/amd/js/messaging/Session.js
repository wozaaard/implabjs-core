define([
    "dojo/_base/declare",
    "dojo/request",
    "./Destination",
    "dojo/Evented",
    "dojo/Deferred",
    "../log/_LogMixin"
], function (declare, request, Destination, Evented, Deferred, _LogMixin) {

    var cls = declare(
        [Evented, _LogMixin], {
            _id: null,
            _baseUrl: null,
            _destinations: null,
            _timeout: 100000,
            _clients: null,
            _started: null,
            _starting: false,

            constructor: function (baseUrl, options) {
                if (!baseUrl)
                    throw new Error("baseUrl is required");
                options = options || {};

                this._baseUrl = baseUrl.replace(/\/*$/, "");
                this._destinations = {};
                this._pending = [];
                this._clients = {};
                if (options.timeout)
                    this._timeout = options.timeout;

                this._started = new Deferred();
            },

            start: function () {
                if (this._starting)
                    return this._started;
                this._starting = true;

                var me = this;
                me.log("START");
                request(this._baseUrl, {
                    method: "POST",
                    handleAs: "json"
                }).then(function (result) {
                    me._id = result;
                    me._emitConnected();
                    me._poll();
                    me._started.resolve(me);
                }, function (error) {
                    me._emitError(error);
                    me._started.reject(me);
                });
                return me._started.promise;
            },

            createClient: function (options) {
                if (!options || !options.destination || !options.mode)
                    throw new Error("Invalid argument");

                var me = this;

                return me._started
                    .then(function () {
                        var url = me._makeUrl(me._id);
                        me.log(
                            "CREATE mode=${0}, destination=${1}",
                            options.mode,
                            options.destination);

                        return request(url, {
                                method: "POST",
                                data: {
                                    mode: options.mode,
                                    destination: options.destination
                                },
                                handleAs: 'json'
                            })
                            .then(function (id) {
                                me.log(
                                    "CLIENT id=${0}, mode=${1}, destination=${2}",
                                    id,
                                    options.mode,
                                    options.destination);
                                me._clients[id] = options.client ?
                                    options.client :
                                    function () {
                                        me.warn(
                                            "The client id=${0}, mode=${1}, destination=${2} isn't accepting mesages",
                                            id,
                                            options.mode,
                                            options.destination);
                                    };
                                return id;
                            });
                    });

            },

            deleteClient: function (options) {
                if (!options || !options.clientId)
                    throw new Error("Invalid argument");

                var me = this,
                    id = options.clientId;

                return me._started.then(function () {
                    var url = me._makeUrl(me._id, options.clientId);

                    me.log("DELETE CLIENT ${0}", options.clientId);

                    return request(url, {
                        method: "DELETE",
                        handleAs: 'json'
                    }).then(function () {
                        me.log("CLIENT DELETED ${0}", options.clientId);
                        me._clients[id] = undefined;
                    });
                });
            },

            _poll: function () {
                var me = this,
                    url = this._makeUrl(this._id);
                me.log("POLL timeout=${0}", me._timeout);
                request(url, {
                    method: "GET",
                    handleAs: "json",
                    query: {
                        timeout: me._timeout
                    }
                }).then(function (response) {
                    me._handlePoll(response);
                    me._poll();
                }, function (err) {
                    me.error("POLL faield with ${0}", err);
                    me._emitError(err);
                });
            },

            _handlePoll: function (response) {
                if (!response) {
                    this.log("POLL response undefined, looks like a bug");
                    return;
                }
                if (!response.results || !response.results.length) {
                    this.log("POLL response is empty");
                    return;
                }

                var results = response.results;
                this.log("POLL got ${0} results", results.length);

                for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    var client = this._clients[result.clientId];
                    if (!client) {
                        // TODO this could happen due to client isn't
                        // registered yet
                        this.error("Unknown client ${0}", result.clientId);
                        continue;
                    }
                    client.call(this, result);
                }
            },

            _emitError: function (err) {
                this.emit("error", err);
            },

            _emitConnected: function () {
                var me = this;
                me.log("CONNECTED");
                me.emit("connected");
            },

            _makeUrl: function () {
                var parts = [this._baseUrl];
                for (var i = 0; i < arguments.length; i++)
                    parts.push(arguments[i].replace(/\/*$/, ""));
                return parts.join('/');
            },

            queue: function (name) {
                return this._getDestination("queue://" + name);
            },

            topic: function (name) {
                return this._getDestination("topic://" + name);
            },

            _getDestination: function (uri) {
                if (uri in this._destinations)
                    return this._destinations[uri];

                var dest = new Destination(this, uri);
                this._destinations[uri] = dest;
                return dest;
            },

            toString: function () {
                return ["[", "SESSION ", this._id, "]"].join(" ");
            }
        });

    cls.connect = function (url, options) {
        var session = new cls(url, options);
        return session.start();
    };

    return cls;
});