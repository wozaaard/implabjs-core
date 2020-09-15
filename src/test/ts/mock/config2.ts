import { fluent } from "../di/traits";
import { Bar } from "./Bar";
import { ChildServices, Services } from "./services";

export default fluent<ChildServices>()
    .provided<keyof Services>()
    .configure({
        bar: it => it
            .factory($ => new Bar({ foo: $("foo"), host: $("host") }, "bar"))
    });
