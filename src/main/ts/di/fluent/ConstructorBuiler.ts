import { RegistrationBuilder } from "./RegistrationBuilder";

export class ConstructorBuilder<C extends new (...args: any[]) => any, S extends object>
    extends RegistrationBuilder<InstanceType<C>, S> {

    $type: C;

    _params: any;

    constructor(target: C, params: any) {
        super();
        this.$type = target;

        this._params = params;
    }

}
