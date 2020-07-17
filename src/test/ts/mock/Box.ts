import { Bar } from "./Bar";
import { annotate, dependency } from "./services";

// export service descriptor
// через service передается информация о типе зависимости
// даже если это шаблон.
export const service = annotate<Box<Bar>>();

@service.wire()
export class Box<T> {
    private _value: T | undefined;

    constructor(value?: T) {
        this._value = value;
    }

    @service.inject(dependency("bar"))
    setValue(value: T) {
        this._value = value;
        return value;
    }

    getValue() {
        if (this._value === undefined)
            throw new Error("Trying to get a value from the empty box");

        return this._value;
    }
}
