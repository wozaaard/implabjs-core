define(["tape", "../Uuid"], function(tape, Uuid) {
    "use strict";
    tape('uuid', function(t) {
        t.notEqual(Uuid(),Uuid());
        t.end();
    });
});