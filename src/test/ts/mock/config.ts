import { config } from "./services";

config()
    .register("bar", import("./Bar"))
    .register("box", import("./Box"), "service");
    //.register("foo", import("./Foo"), "Foo");
