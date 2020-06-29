import { test } from "./TestTraits";
import { Container } from "../di/Container";
import { ReferenceDescriptor } from "../di/ReferenceDescriptor";
import { AggregateDescriptor } from "../di/AggregateDescriptor";
import { ValueDescriptor } from "../di/ValueDescriptor";
import { Foo } from "../mock/Foo";
import { Bar } from "../mock/Bar";
import { isNull } from "../safe";
import { Descriptor } from "../di/interfaces";

test("Container register/resolve tests", async t => {
    const container = new Container();

    const connection1 = "db://localhost";

    t.throws(
        () => container.register("bla-bla", "bla-bla" as any),
        "Do not allow to register anything other than descriptors"
    );

    t.doesNotThrow(
        () => container.register("connection", new ValueDescriptor(connection1)),
        "register ValueDescriptor"
    );

    t.equals(container.resolve("connection"), connection1, "resolve string value");

    t.doesNotThrow(
        () => container.register(
            "dbParams",
            new AggregateDescriptor({
                timeout: 10,
                connection: new ReferenceDescriptor({ name: "connection" })
            })
        ),
        "register AggregateDescriptor"
    );

    const dbParams = container.resolve("dbParams");
    t.equals(dbParams.connection, connection1, "should get string value 'dbParams.connection'");
});

test("Container configure/resolve tests", async t => {

    const container = new Container();

    await container.configure({
        foo: {
            $type: Foo
        },

        box: {
            $type: Bar,
            params: {
                $dependency: "foo"
            }
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
    t.pass("should configure from js object");

    const f1 = container.resolve("foo");

    t.assert(!isNull(f1), "foo should be not null");

    t.throws(() => container.resolve("bar"), "should not resolve dependency 'db'");

});

test("Load configuration from module", async t => {
    const container = new Container();

    await container.configure("../mock/config1", { contextRequire: require });
    t.pass("The configuration should load");

    const f1 = container.resolve("foo");

    t.assert(!isNull(f1), "foo should be not null");

    const b1 = container.resolve("bar") as Bar;

    t.assert(!isNull(b1), "bar should not be null");
    t.assert(!isNull(b1._v), "bar.foo should not be null");
});
