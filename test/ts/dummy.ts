import * as tape from 'tape';

tape('simple', function(t){
    t.pass("sync assert");
    setTimeout(() => {
        t.pass("async assert");

        // end should be called after the last assertion
        t.end();
    }, 100);
});