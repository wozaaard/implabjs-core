import { TraceSource, DebugLevel } from "@implab/core/log/TraceSource";
import * as tape from "tape";
import { TapeWriter, test } from "./TestTraits";
import { MockConsole } from "./mock/MockConsole";
import { ConsoleLogger } from "@implab/core/log/writers/ConsoleLogger";
import { ConsoleWriter } from "@implab/core/log/ConsoleWriter";

const sourceId = "test/TraceSourceTests";

tape("trace message", t => {
    const trace = TraceSource.get(sourceId);

    trace.level = DebugLevel;

    const h = trace.events.on(ev => {
        t.equal(ev.source, trace, "sender should be the current trace source");
        t.equal(ev.level, DebugLevel, "level should be debug level");
        t.equal(ev.toString(), "Hello, World!", "The message should be a formatted message");

        t.end();
    });

    trace.debug("Hello, {0}!", "World");

    h.destroy();
});

tape("trace event", t => {
    const trace = TraceSource.get(sourceId);

    trace.level = DebugLevel;

    const event = {
        name: "custom event"
    };

    const h = trace.events.on(ev => {
        t.equal(ev.source, trace, "sender should be the current trace source");
        t.equal(ev.level, DebugLevel, "level should be debug level");
        t.equal(ev.message, event, "The message should be the specified object");

        t.end();
    });

    trace.traceEvent(DebugLevel, event);

    h.destroy();
});

tape("tape comment writer", async t => {
    const writer = new TapeWriter(t);

    TraceSource.on(ts => {
        writer.writeEvents(ts.events);
    });

    const trace = TraceSource.get(sourceId);
    trace.level = DebugLevel;

    trace.log("Hello, {0}!", "World");
    trace.log("Multi\n  line");
    trace.warn("Look at me!");
    trace.error("DIE!");

    writer.destroy();

    trace.log("You shouldn't see it!");

    t.comment("DONE");

    t.end();
});

test("console writer", (t, trace) => {

    const mockConsole = new MockConsole();
    const writer = new ConsoleWriter(mockConsole);
    const consoleLog = new ConsoleLogger(writer);
    consoleLog.writeEvents(trace.events);

    trace.log("Hello, world!");
    t.deepEqual(mockConsole.getLine(0), ["console writer: Hello, world!"], "Log one string");

    trace.log({ foo: "bar" });
    t.deepEqual(mockConsole.getLine(1), ["console writer: ", { foo: "bar" }], "Log an object");

    trace.log("json: {0:json}", { foo: "bar" });
    t.deepEqual(mockConsole.getLine(2), ['console writer: json: {\n  "foo": "bar"\n}'], "should convert to string substitutions with spec");
});
