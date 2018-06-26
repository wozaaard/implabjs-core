define([ "dojo/_base/declare", "../safe" ], function(declare, safe) {
    return declare(
        null,
        {
            _params : null,

            _repositories : null,

            constructor : function(opts) {
                this._params = opts || {};
                this._repositories = {};
            },

            getRepository : function(name) {
                safe.argumentNotEmptyString(name, "name");
                var repo = this._repositories[name];
                if (!repo) {
                    repo = this._params[name];
                    if (!repo)
                        throw new Error("The repository '" + name +
                            "' isn't found");
                    if (repo instanceof Function)
                        repo = new repo(); // factory method or constructor
                    if (repo.initialize) {
                        repo.initialize({
                            dataContext : this
                        });
                    } else if (repo.setDataContext) {
                        repo.setDataContext(this);
                    }
                    this._repositories[name] = repo;
                }

                return repo;
            },

            dispose : function() {
                for( var name in this._repositories) {
                    var r = this._repositories[name];
                    if (r.dispose)
                        r.dispose();
                }
            }
        });
});