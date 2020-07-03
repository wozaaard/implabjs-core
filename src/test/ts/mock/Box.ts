import { services } from "../di/Annotations";
import { Bar } from "./Bar";

// declare required dependencies
const config = services<{
     bar: Bar;
}>();

// export service descriptor
export const service = config.build<Box<Bar>>();

@service.consume(config.dependency("bar"))
export class Box<T> {
    private _value: T | undefined;

    constructor(value: T) {
        this._value = value;
    }

    // @service.inject("bar")
    setValue(value: T) {
        this._value = value;
    }

    setObj(value: object) {

    }

    getValue() {
        if (this._value === undefined)
            throw new Error("Trying to get a value from the empty box");

        return this._value;
    }
}
