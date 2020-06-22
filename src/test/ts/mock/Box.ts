import { Builder } from "../di/Annotations";
import { Bar } from "./Bar";
import { Foo } from "./Foo";

const builder = new Builder<Box<Bar>, { bar: Bar; foo: Foo; obj: object }>();

@builder.provides()
@builder.dependencies("bar")
export class Box<T> {
    private _value: T | undefined;

    constructor(value: T) {
        this._value = value;
    }

    @builder.inject("bar")
    setValue(value: T) {
        this._value = value;
    }


    @builder.inject("foo")
    setObj(value: object) {

    }

    getValue() {
        if (this._value === undefined)
            throw new Error("Trying to get a value from the empty box");

        return this._value;
    }
}