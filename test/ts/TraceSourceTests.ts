import * as TraceSource from '@implab/core/log/TraceSource'
import * as tape from 'tape';

const sourceId = 'test/TraceSourceTests';

tape('trace message', t => {
    let trace = TraceSource.get(sourceId);

    trace.level = TraceSource.DebugLevel;

    let h = trace.on((sender,level,msg) => {
        t.equal(sender, trace, "sender should be the current trace source");
        t.equal(TraceSource.DebugLevel, level, "level should be debug level");
        t.equal(msg, "Hello, World!", "The message should be a formatted message");

        t.end();
    });

    trace.debug("Hello, {0}!", "World");

    h.destroy();
});

tape('trace event', t => {
    let trace = TraceSource.get(sourceId);

    trace.level = TraceSource.DebugLevel;

    let event = {
        name: "custom event"
    };

    let h = trace.on((sender,level,msg) => {
        t.equal(sender, trace, "sender should be the current trace source");
        t.equal(TraceSource.DebugLevel, level, "level should be debug level");
        t.equal(msg, event, "The message should be the specified object");

        t.end();
    });

    trace.traceEvent(TraceSource.DebugLevel, event);

    h.destroy();
});