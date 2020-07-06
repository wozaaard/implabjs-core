import { Bar } from "./Bar";
import { define, dependency } from "./services";

// export service descriptor
// через service передается информация о типе зависимости
// даже если это шаблон.
export const service = define<Box<Bar>>();

@service.declare(dependency("bar"))
export class Box<T> {
    private _value: T | undefined;

    constructor(value: T) {
        this._value = value;
    }

    @service.inject(dependency("bar"))
    setValue(value: T) {
        this._value = value;
        return value;
    }

    setObj(value: any) {

    }

    getValue() {
        if (this._value === undefined)
            throw new Error("Trying to get a value from the empty box");

        return this._value;
    }
}
