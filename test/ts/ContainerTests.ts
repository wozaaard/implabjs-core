import { test, TapeWriter } from "./TestTraits";
import { Container } from "@implab/core/di/Container";
import { ReferenceDescriptor } from "@implab/core/di/ReferenceDescriptor";
import { AggregateDescriptor } from "@implab/core/di/AggregateDescriptor";
import { ValueDescriptor } from "@implab/core/di/ValueDescriptor";
import { TraceSource, DebugLevel } from "@implab/core/log/TraceSource";
import { Foo } from "./mock/Foo";
import { Bar } from "./mock/Bar";
import { isNull } from "@implab/core/safe";

test("Container register/resolve tests", async t => {
    const writer = new TapeWriter(t);

    TraceSource.on(ts => {
        ts.level = DebugLevel;
        writer.writeEvents(ts.events);
    });

    const container = new Container();

    const connection1 = "db://localhost";

    container.register("connection", new ValueDescriptor(connection1));

    t.equals(container.getService("connection"), connection1);

    container.register(
        "dbParams",
        new AggregateDescriptor({
            timeout: 10,
            connection: new ReferenceDescriptor({ name: "connection" })
        })
    );

    const dbParams = container.getService("dbParams");
    t.equals(dbParams.connection, connection1, "should get connection");

    writer.destroy();
});

test("Container configure/resolve tests", async t => {
    const writer = new TapeWriter(t);

    TraceSource.on(ts => {
        ts.level = DebugLevel;
        writer.writeEvents(ts.events);
    });

    const container = new Container();

    await container.configure({
        foo: {
            $type: Foo
        },

        bar: {
            $type: Bar,
            params: {
                db: {
                    provider: {
                        $dependency: "db"
                    }
                }
            }
        }
    });

    const f1 = container.resolve("foo");
    t.assert(!isNull(f1), "foo should be not null");

    const b1 = container.resolve("bar");

    writer.destroy();
});
