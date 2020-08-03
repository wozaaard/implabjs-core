import { configure } from "./services";

export const config = configure()
    .register("host", s => s.value("example.com"))
    .register("bar2", bar2 => Promise.all([import("./Foo"), import("./Bar")])
        .then(([{ Foo }, { Bar }]) => {
            const lifetime: any = undefined; // new HierarchyLifetime()
            bar2.factory((resolve, activate) => {
                const bar = new Bar({
                    foo: activate(lifetime, () => new Foo()),
                    nested: {
                        lazy: resolve("foo", { lazy: true })
                    },
                    host: resolve("host")
                }, "some text");
                bar.setName(resolve("host"));
                return bar;
            });
        })
    );
