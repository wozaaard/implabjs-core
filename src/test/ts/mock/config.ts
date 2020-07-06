import { config } from "./services";

config()
    .register("bar", import("./Bar"))
    .register("box", import("./Box"))
    .register("foo", import("./Foo"), "Foo");
