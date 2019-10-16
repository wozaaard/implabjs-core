var rjs = require('requirejs');

rjs.config({
    baseUrl: '.',
    packages: [{
        name: "dojo",
        location: "node_modules/dojo"
    }],
    nodeRequire: require
});


rjs(['./tests/plan']);