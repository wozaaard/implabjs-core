import { Services } from "./services";
import { fluent } from "../di/traits";

export default fluent<Services>().register({
    host: it => it.value("example.com"),

    bar2: it => Promise.all([import("./Foo"), import("./Bar")])
        .then(([{ Foo }, { Bar }]) => it
            .lifetime("container")
            .override({
                host: it2 => it2.value("simple.org"),
                foo: it2 => it2.value(new Foo())
            })
            .factory(resolve => {
                const bar = new Bar({
                    foo: new Foo(),
                    nested: {
                        lazy: resolve("foo", { lazy: true })
                    },
                    host: resolve("host")
                }, "some text");
                bar.setName(resolve("host"));
                return bar;
            })
        )
});
