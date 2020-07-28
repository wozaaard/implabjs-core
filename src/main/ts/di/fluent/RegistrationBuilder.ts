import { ServiceRecordBuilder, ExtractDependency, RegistrationVisitor, ServiceRegistration } from "./interfaces";
import { ActivationType } from "../interfaces";

export class RegistrationBuilder<T, S extends object> implements ServiceRegistration {
    private _activationType: ActivationType = "call";

    private _overrides: { [m in keyof S]?: (...args: any) => void } | undefined;


    override<K extends keyof S>(name: K, builder: S[K], raw: true): this;
    override<K extends keyof S>(name: K, builder: (t: ServiceRecordBuilder<S[K], S>) => void): this;
    override<K extends keyof S, V>(name: S[K] extends ExtractDependency<V, S> ? K : never, value: V): this;
    override<K extends keyof S>(name: K, builder: S[K] | ((t: ServiceRecordBuilder<S[K], S>) => void), raw: boolean = false) {
        if (!this._overrides)
            this._overrides = {};
        if (raw) {
            
        } else if (builder instanceof Function) {
            
        } else {

        }
        return this;
    }

    activate(activation: ActivationType) {
        this._activationType = activation;
        return this;
    }
    inject<M extends keyof T, P extends any[]>(member: T[M] extends (...params: ExtractDependency<P, S>) => any ? M : never, ...params: P) {
        return this;
    }

    visit(visitor: RegistrationVisitor) {
        
    }
}
