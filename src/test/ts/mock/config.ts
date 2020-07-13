import { configure, dependency, Services, $type } from "./services";
import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { Box } from "./Box";


export const config = configure()
    .register("bar", { $from: import("./Bar"), service: "service" })
    // .register("box", { $from: import("./Box") })
    .register("host", "example.com")
    // .registerType("bar2", Bar, [{ foo: dependency("foo"), host: "" }]);
    .register("bar2", $type(Bar,
        {
            foo: $type(Foo)
                .override("host", "foo.example.com")
                .inject("setName", dependency("host"))
                .activate("context"),
            host: ""
        },
        "")
    )
    .registerType("box", Box, dependency("bar"));

