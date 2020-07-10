import { configure } from "./services";
import { Foo } from "./Foo";
import { Bar } from "./Bar";

export const config = configure()
    .register("bar", { $from: import("./Bar"), service: "service" })
    .register("box", { $from: import("./Box") })
    .register("host", "example.com")
    .register("foo", {
        $type: Foo
    })
    .register("bar2", {
        $type: Bar,
        params: []
    });
