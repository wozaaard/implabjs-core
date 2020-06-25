import { config } from "./config";

const service = config.build("barBox");

@service.consume(config.dependency("bar"))
export class Box<T> {
    private _value: T | undefined;

    constructor(value: T) {
        this._value = value;
    }

    @service.inject("bar")
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