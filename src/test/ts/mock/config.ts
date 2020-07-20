import { configure, dependency, build } from "./services";

export const config = configure()
    .register("bar", async s => s.wired(await import("./Bar"), "service"))
    .register("box", s => import("./Box").then(m => s.wired(m)))
    .register("host", "example.com")
    // .registerType("bar2", Bar, [{ foo: dependency("foo"), host: "" }]);
    .register("bar2", async s => s.type((await import("./Bar")).Bar,
        {
            foo: build().type((await import("./Foo")).Foo)
                .activate("context"),
            nested: { lazy: dependency("foo", { lazy: true }) },
            host: dependency("host")
        },
        "")
        .inject("setName", dependency("host"))
    );
