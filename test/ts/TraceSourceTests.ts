import * as TraceSource from '@implab/core/log/TraceSource'
import * as tape from 'tape';
import * as ConsoleWriter from '@implab/core/log/writers/ConsoleWriter';

const sourceId = 'test/TraceSourceTests';

tape('trace message', t => {
    let trace = TraceSource.get(sourceId);

    trace.level = TraceSource.DebugLevel;

    let h = trace.on((ev) => {
        t.equal(ev.source, trace, "sender should be the current trace source");
        t.equal(ev.level, TraceSource.DebugLevel, "level should be debug level");
        t.equal(ev.arg, "Hello, World!", "The message should be a formatted message");

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

    let h = trace.on((ev) => {
        t.equal(ev.source, trace, "sender should be the current trace source");
        t.equal(ev.level, TraceSource.DebugLevel, "level should be debug level");
        t.equal(ev.arg, event, "The message should be the specified object");

        t.end();
    });

    trace.traceEvent(TraceSource.DebugLevel, event);

    h.destroy();
});

tape('console writer', async t => {
    let writer = new ConsoleWriter();

    let trace = TraceSource.get(sourceId);
    trace.level = TraceSource.DebugLevel;

    let p = writer.write(trace);

    trace.log("Hello, {0}!", 'World');
    trace.warn("Look at me!");
    trace.error("DIE!");

    console.log("DONE");

    t.end();
});