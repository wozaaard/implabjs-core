define(["./declare", "./log/trace!"], function (declare, trace) {
    trace.warn("THIS MODULE IS DEPRECATED! use uri-js or similar alternatives.");
    
    function parseURI(uri) {
        var schema, host, port, path, query, hash, i;
        if (typeof (uri) == "string") {
            if ((i = uri.indexOf(":")) >= 0 &&
                uri.substr(0, i).match(/^\w+$/)) {
                schema = uri.substr(0, i);
                uri = uri.substr(i + 1);
            }

            if (uri.indexOf("//") === 0) {
                uri = uri.substr(2);
                if ((i = uri.indexOf("/")) >= 0) {
                    host = uri.substr(0, i);
                    uri = uri.substr(i);
                } else {
                    host = uri;
                    uri = "";
                }
            }

            if ((i = uri.indexOf("?")) >= 0) {
                path = uri.substr(0, i);
                uri = uri.substr(i + 1);

            } else {
                path = uri;
                uri = "";

                if ((i = path.indexOf("#")) >= 0) {
                    hash = path.substr(i + 1);
                    path = path.substr(0, i);
                }
            }

            if ((i = uri.indexOf("#")) >= 0) {
                query = uri.substr(0, i);
                hash = uri.substr(i + 1);
            } else {
                query = uri;
            }
        }

        if (host && (i = host.lastIndexOf(":")) >= 0) {
            port = host.substr(i + 1);
            host = host.substr(0, i);
        }

        return {
            schema: schema,
            host: host,
            port: port,
            path: path,
            query: query,
            hash: hash
        };
    }

    function makeURI(options) {
        var uri = [];

        if (options.schema)
            uri.push(options.schema, ":");
        if (options.host)
            uri.push("//", options.host);
        if (options.host && options.port)
            uri.push(":", options.port);

        if (options.path) {
            if (options.host && options.path[0] != "/")
                uri.push("/");
            uri.push(options.path);
        } else if (options.host) {
            uri.push("/");
        }

        if (options.query)
            uri.push("?", options.query);
        if (options.hash)
            uri.push("#", options.hash);

        return uri.join("");
    }

    function reducePath(parts) {
        var balance = 0,
            result = [],
            isRoot;

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            switch (part) {
                case "..":
                    if (balance > 0) {
                        result.pop();
                    } else {
                        if (isRoot)
                            throw new Error("Unbalanced path: " + parts);

                        result.push(part);
                    }
                    balance--;
                    break;
                case ".":
                    break;
                case "":
                    if (i === 0) {
                        isRoot = true;
                        result.push(part);
                    }
                    break;
                default:
                    result.push(part);
                    balance++;
                    break;
            }
        }

        return result.join("/");
    }

    var meta = {
        schema: null,
        host: null,
        port: null,
        path: null,
        query: null,
        hash: null
    };

    var URI = declare(null, {
        constructor: function (opts) {
            trace.warn("This class is deprecated use uri-js or similar");
            if (typeof (opts) == "string")
                opts = parseURI(opts);
            for (var p in meta)
                if (p in opts)
                    this[p] = opts[p];
        },

        clone: function () {
            return new URI(this);
        },

        combine: function (rel) {
            var me = this;

            if (typeof (rel) === "string")
                rel = new URI(rel);
            else
                rel = rel.clone();

            // //some.host:123/path?q=a#123
            if (rel.host)
                return rel;

            // /abs/path?q=a#123
            if (rel.path && rel.path[0] == "/") {
                if (me.host) {
                    rel.schema = me.schema;
                    rel.host = me.host;
                    rel.port = me.port;
                }
                return rel;
            }

            var base = me.clone();

            // rel/path?a=b#cd
            if (rel.path) {
                var segments = base.getSegments();
                segments.pop();
                segments.push.apply(segments, rel.getSegments());

                base.path = reducePath(segments);
            }

            // ?q=a#123
            if (rel.query)
                base.query = rel.query;
            if (rel.hash)
                base.hase = rel.hash;

            return base;
        },

        optimize: function () {
            this.path = reducePath(this.getSegments());
        },

        getSegments: function () {
            if (typeof (this.path) === "string")
                return this.path.split("/");
            else
                return [];
        },

        toString: function () {
            var uri = [],
                me = this;

            if (me.schema)
                uri.push(me.schema, ":");
            if (me.host)
                uri.push("//", me.host);
            if (me.host && me.port)
                uri.push(":", me.port);

            if (me.path) {
                if (me.host && me.path[0] != "/")
                    uri.push("/");
                uri.push(me.path);
            } else if (me.host) {
                uri.push("/");
            }

            if (me.query)
                uri.push("?", me.query);
            if (me.hash)
                uri.push("#", me.hash);

            return uri.join("");
        }

    });

    URI.combine = function (base, rel) {
        if (typeof (base) === "string")
            base = new URI(base);
        return base.combine(rel).toString();
    };

    return URI;
});