import { argumentNotNull, each, isPrimitive, isPromise } from "../../safe";
import { DescriptorBuilder } from "./DescriptorBuilder";
import { RegistrationBuilder, FluentRegistrations, ContainerConfiguration } from "./interfaces";
import { Cancellation } from "../../Cancellation";
import { ServiceContainer } from "../interfaces";

export class FluentConfiguration<S extends object, Y extends keyof S = keyof S> {

    _builders: { [k in keyof S]?: RegistrationBuilder<S, S[k]> } = {};

    provided<K extends Y>(): FluentConfiguration<S, Exclude<Y, K>> {
        return this;
    }

    register<K extends Y>(name: K, builder: RegistrationBuilder<S, S[K]>): FluentConfiguration<S, Exclude<Y, K>>;
    register<K extends Y>(config: FluentRegistrations<K, S>): FluentConfiguration<S, Exclude<Y, K>>;
    register<K extends Y>(nameOrConfig: K | FluentRegistrations<K, S>, builder?: RegistrationBuilder<S, S[K]>): FluentConfiguration<S, Exclude<Y, K>> {
        if (isPrimitive(nameOrConfig)) {
            argumentNotNull(builder, "builder");
            this._builders[nameOrConfig] = builder;
        } else {
            each(nameOrConfig, (v, k) => this.register(k, v));
        }

        return this;
    }

    configure(config: FluentRegistrations<Y, S>): ContainerConfiguration<S> {
        return this.register(config);
    }

    apply<S2 extends object>(target: ServiceContainer<S2>, ct = Cancellation.none) {

        let pending = 1;

        const _t2 = target as unknown as ServiceContainer<S2 & S>;

        return new Promise<ServiceContainer<S2 & S>>((resolve, reject) => {
            function guard(v: void | Promise<void>) {
                if (isPromise(v))
                    v.catch(reject);
            }

            function complete() {
                if (!--pending)
                    resolve(_t2);
            }
            each(this._builders, (v, k) => {
                pending++;
                const d = new DescriptorBuilder<S2 & S, any>(_t2,
                    result => {
                        _t2.register(k, result);
                        complete();
                    },
                    reject
                );

                try {
                    guard(v(d, ct));
                } catch (e) {
                    reject(e);
                }
            });
            complete();
        });
    }

}
