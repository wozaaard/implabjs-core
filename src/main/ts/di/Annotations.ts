import { TypeRegistration } from "./Configuration";
import { ExtractDependency } from "./fluent/interfaces";
import { RegistrationBuilder } from "./fluent/RegistrationBuilder";

export class AnnotaionBuilder<T, S extends object> {
    wire<P extends any[]>(...args: P) {
        return <C extends new (...args: ExtractDependency<P, S>) => T>(constructor: C) => {

        };
    }

    inject<P extends any[]>(...args: P) {
        return <X extends { [m in M]: (...args: any) => any }, M extends keyof (T | X)>(
            target: X,
            memberName: M,
            descriptor: TypedPropertyDescriptor< T[M] extends ((...args: ExtractDependency<P, S>) => any) ? any : never >
        ) => {

        };
    }

    getDescriptor(): TypeRegistration<new () => T, S> {
        throw new Error();
    }

    getRegistrationBuilder(): RegistrationBuilder<T, S> {
        throw new Error();
    }

}
