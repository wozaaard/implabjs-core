var rjs = require('requirejs');

rjs.config({
    baseUrl: '.',
    nodeRequire: require
});


rjs(['./tests/plan']);