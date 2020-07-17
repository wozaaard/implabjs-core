import { configure, dependency, build } from "./services";
import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { Box } from "./Box";

export const config = configure()
    .register("bar", s => s
        .wired(import("./Bar"), "service")
        .inject("setName", "heell")
    )
    .register("box", s => s.wired(import("./Box")))
    .register("host", "example.com")
    // .registerType("bar2", Bar, [{ foo: dependency("foo"), host: "" }]);
    .register("bar2", s => s.type(Bar,
        {
            foo: build().type(Foo)
                .activate("context"),
            nested: { lazy: dependency("foo", {lazy: true}) },
            host: dependency("host")
        },
        "")
        .inject("setName", dependency("host"))
    )
    .register("box", s => s
        .type(Box, dependency("bar"))
        .activate("context")
    );

