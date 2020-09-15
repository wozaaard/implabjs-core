import { Services } from "./services";
import { fluent } from "../di/traits";
import { Box } from "./Box";

export default fluent<Services>().configure({
    host: it => it.value("example.com"),

    foo: it => import("./Foo").then(({ Foo }) => it
        .factory(() => new Foo())
    ),

    box: it => it
        .factory($dependency => new Box($dependency("foo")))
});
