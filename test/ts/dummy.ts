import * as tape from 'tape';
import * as uuid from '@implab/core/Uuid';

tape('simple', function(t){
    t.pass("sync assert");
    setTimeout(() => {
        t.pass("async assert");
        t.comment(uuid());
        t.ok(uuid() != uuid());
        // end should be called after the last assertion
        t.end();
    }, 100);
});