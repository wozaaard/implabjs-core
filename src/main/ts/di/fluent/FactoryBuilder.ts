import { RegistrationBuilder } from "./RegistrationBuilder";

export class FactoryBuilder<F extends (...args: any[]) => any, S extends object> extends RegistrationBuilder<ReturnType<F>, S> {
    $factory: F;

    _params: any;

    constructor(target: F, params: any) {
        super();

        this.$factory = target;
        this._params = params;
    }
}
