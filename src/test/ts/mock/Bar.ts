import { Foo } from "./Foo";
// import { config } from "./config";

// const service = config.build("bar");

// @service.consume({
//     f: config.dependency("foo"),
//     nested: {
//         lazy: config.lazy("foo")
//     }
// })
export class Bar {
    barName = "bar";

    _v: Foo | undefined;

    constructor(_opts: {
        foo: Foo;
        nested: {
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
