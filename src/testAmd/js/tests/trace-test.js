define(["require", "tape"], function(require, tape) {
    "use strict";
    var sourceId = '73a633f3-eab8-49b0-8601-07cae710f234';
    var sourceId2 = '3ba9c7cd-ed77-437b-9a2f-1cbeb1226b5b';
    tape('Load TraceSource for the module', function(t) {
        require(["../log/trace!" + sourceId, "../log/TraceSource"], function(trace, TraceSource_1) {
            var TraceSource = TraceSource_1.TraceSource;
            t.equal(trace && trace.id, sourceId, "trace should be taken from the loader plugin parameter");

            var count = 0;

            var h = TraceSource.on(function(x) {
                if(x.id == sourceId || x.id == sourceId2)
                    count++;
            });

            t.equal(count, 1, "should see created channel immediatelly");
            t.equal(trace, TraceSource.get(sourceId), "should get same TraceSource from registry");
            t.equal(count, 1);

            TraceSource.get(sourceId2);

            t.equal(count, 2);

            h.destroy();

            t.end();
        });
    });
});