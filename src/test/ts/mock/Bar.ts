import { Foo } from "./Foo";
import { build } from "./config";

const service = build<Bar>();

@service.consume({
    foo: service.get("foo"),
    nested: {
        lazy: service.lazy("foo")
    }
})
export class Bar {
    barName = "bar";

    _v: Foo | undefined;

    constructor(_opts?: {
        foo?: Foo;
        nested?: {
            lazy: () => Foo
        }
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
