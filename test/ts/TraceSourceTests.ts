import * as TraceSource from '@implab/core/log/TraceSource'
import * as tape from 'tape';

const sourceId = 'test/TraceSourceTests';

tape('', t => {
    let trace = TraceSource.get(sourceId);

    trace.level = TraceSource.DebugLevel;

    let h = trace.on((sender,level,msg) => {
        t.equal(sender, trace, "sender should be the current trace source");
        t.equal(TraceSource.DebugLevel, level, "level should be debug level");
        t.equal(msg, "Hello, World!", "The message should be formatted correctly");

        t.end();
    });

    trace.debug("Hello, {0}!", "World");

    h.destroy();
});