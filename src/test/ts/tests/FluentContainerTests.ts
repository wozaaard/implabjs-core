import { test } from "./TestTraits";
import { fluent } from "../di/traits";
import { Bar } from "../mock/Bar";
import { Container } from "../di/Container";
import { Foo } from "../mock/Foo";
import { Box } from "../mock/Box";
import { delay } from "../safe";

test("Simple fluent config", async t => {
    const config = fluent<{ host: string; bar: Bar; foo: Foo }>()
        .register({
            host: it => it.value("example.com"),
            bar: it => it.factory(resolve => new Bar({ host: resolve("host") }, "s-bar")),
            foo: it => import("../mock/Foo").then(m => it.lifetime("container").factory(() => new m.Foo()))
        });

    const container = new Container<{ host: string; bar: Bar; foo: Foo; }>();
    await config.apply(container);

    t.equal(container.resolve("host"), "example.com", "The value should be resolved");
    t.assert(container.resolve("bar"), "The service should de activated");
    t.equal(container.resolve("foo"), container.resolve("foo"), "The service should be activated once");
});

test("Nested async configuration", async t => {
    const container = await new Container<{
        foo: Foo;
        box: Box<Foo>
    }>().fluent({
        foo: it => delay(0).then(() => it.factory(() => new Foo())),
        box: it => it.lifetime("context").factory($dependency => new Box($dependency("foo")))
    });

    t.assert(container.resolve("box").getValue(), "The dependency should be set");
    t.equals(container.resolve("box").getValue(), container.resolve("box").getValue(), "The service should be activated once")
});

test("Bad fluent config", async t => {
    try {
        await new Container<{
            foo: Foo;
            box: Box<Foo>
        }>().fluent({
            foo: it => delay(0).then(() => it.factory(() => new Foo())),
            box: it => it.lifetime("context")
                .override("foo", () => { throw new Error("bad override"); })
                .factory($dependency => new Box($dependency("foo")))
        });
        t.fail("Should throw");
    } catch (e) {
        t.pass("The configuration should fail");
        t.equal(e.message, "bad override", "the error should pass");
    }
});
