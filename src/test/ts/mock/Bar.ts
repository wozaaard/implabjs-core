import { Foo } from "./Foo";
import { define, dependency } from "./services";

export const service = define<Bar>();

@service.declare({
    foo: dependency("foo"),
    nested: {
        lazy: dependency("foo", { lazy: true })
    },
    host: "value"
})
export class Bar {
    barName = "bar";

    _v: Foo | undefined;

    constructor(_opts?: {
        foo?: Foo;
        nested?: {
            lazy: () => Foo
        },
        host: string
    }) {

        if (_opts && _opts.foo)
            this._v = _opts.foo;
    }

    getFoo() {
        if (this._v === undefined)
            throw new Error("The foo isn't set");
        return this._v;
    }
}
