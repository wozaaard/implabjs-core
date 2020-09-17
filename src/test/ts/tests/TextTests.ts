import { StringBuilder } from "../text/StringBuilder";
import { test } from "./TestTraits";
import { MockConsole } from "../mock/MockConsole";
import { ConsoleWriter } from "../log/ConsoleWriter";
import { Uuid } from "../Uuid";

test("String builder", async t => {
    const sb = new StringBuilder();

    sb.write("hello");
    t.equals(sb.toString(), "hello", "Write simple text");

    sb.write(", ");
    sb.write("world!");
    t.equals(sb.toString(), "hello, world!", "Append text");

    sb.clear();
    t.equals(sb.toString(), "", "Clear");

    sb.write(1);
    t.equals(sb.toString(), "1", "Write number");

    sb.clear();
    sb.writeValue(0.123);
    t.equals(sb.toString(), "0.123", "Format number");

    sb.clear();
    sb.writeValue(new Date("2019-01-02T00:00:00.000Z"));
    t.equals(sb.toString(), "2019-01-02T00:00:00.000Z", "Format date (ISO)");

    sb.clear();
    sb.write("{0}", "hello");
    t.equals(sb.toString(), "hello", "Simple format text");

    sb.write(", {0}!", "world");
    t.equals(sb.toString(), "hello, world!", "Append formatted text");

    sb.clear();
    sb.write("abc: {0:json}; {0.length}; {0.1} {{olo}}", ["a", "b", "c"]);
    t.equals(sb.toString(), 'abc: [\n  "a",\n  "b",\n  "c"\n]; 3; b {olo}', "Format string with spec");

    sb.clear();
    t.throws(() => sb.write("}", 0), "Should die on bad format: '}'");
    t.throws(() => sb.write("{", 0), "Should die on bad format: '{'");
    t.throws(() => sb.write("{}", 0), "Should die on bad format: '{}'");
    t.throws(() => sb.write("{:}", 0), "Should die on bad format: '{:}'");
    t.throws(() => sb.write("{{0}", 0), "Should die on bad format: '{{0}'");

});

test("ConsoleWriter", t => {
    const mockConsole = new MockConsole();
    const writer = new ConsoleWriter(mockConsole);

    writer.setLogLevel("log");

    writer.writeLine("Hello, world!");

    t.equals(mockConsole.getBuffer().length, 1, "One line should be written");
    t.equals(mockConsole.getBuffer()[0].level, "log", "LogLevel should be 'log'");
    t.deepEqual(mockConsole.getBuffer()[0].data, ["Hello, world!"], "The buffer should contain single string");

    mockConsole.clear();
    writer.setLogLevel("debug");
    writer.write("Bring ");
    writer.write("the {0}!", "light");
    t.equals(mockConsole.getBuffer().length, 0, "No line should be written");
    writer.writeLine();

    t.equals(mockConsole.getBuffer().length, 1, "One line should be written");
    t.equals(mockConsole.getBuffer()[0].level, "debug", "LogLevel should be 'log'");
    t.deepEqual(mockConsole.getBuffer()[0].data, ["Bring the light!"], "Should concatenate string parts together");

    mockConsole.clear();
    writer.writeLine("It's {0} o'clock, lets have some {1}!", { h: 5}, { title: "tee" });

    t.deepEqual(mockConsole.getBuffer()[0].data, ["It's ", { h: 5}, " o'clock, lets have some ", { title: "tee" }, "!"], "Non string parts should be psassed as is");

    mockConsole.clear();
    writer.writeLine("{0} or {1} to {2}", {i: 25}, 6, 4);
    t.deepEqual(mockConsole.getBuffer()[0].data, [{i: 25}, " or 6 to 4"], "25 or 6 to 4");

    mockConsole.clear();
    writer.writeLine("{0} or {1} to {2}! Let's have some {3}", 25, 6, 4, { product: "tee" } );
    t.deepEqual(mockConsole.getBuffer()[0].data, ["25 or 6 to 4! Let's have some ", { product: "tee" }], "Should handle many text chunks and object at the end");

});

test("Uuid test", (t, log) => {
    const id = Uuid();
    log.log("uuid = {0}", id);
    t.assert(id, "Should generate uuid");
    t.notEqual(id, Uuid(), "uuid should never match");

});
