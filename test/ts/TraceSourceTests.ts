import * as TraceSource from '../../build/dist/log/TraceSource'
import * as tape from 'tape';
import * as ConsoleWriter from '../../build/dist/log/writers/ConsoleWriter';
import { TapeWriter } from './TestTraits';

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

tape('tape comment writer', async t => {
    let writer = new TapeWriter(t);

    TraceSource.on(ts => {
        writer.writeEvents(ts);
    });

    let trace = TraceSource.get(sourceId);
    trace.level = TraceSource.DebugLevel;

    trace.log("Hello, {0}!", 'World');
    trace.log("Multi\n  line");
    trace.warn("Look at me!");
    trace.error("DIE!");

    writer.destroy();

    trace.log("You shouldn't see it!");

    t.comment("DONE");

    t.end();
});