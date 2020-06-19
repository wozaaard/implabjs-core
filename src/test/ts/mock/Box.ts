import { Builder } from "../di/Annotations";
import { Bar } from "./Bar";
import { Foo } from "./Foo";

export interface Injector<T> {
    setValue(value: T);
}

const builder = new Builder<Box<any>, { bar: Bar; foo: Foo}>();

@builder.provides("barBox")
export class Box<T> implements Injector<T> {
    private _value: T;

    @builder.inject("bar")
    setValue(value: T) {
        this._value = value;
    }

    getValue() {
        return this._value;
    }
}
