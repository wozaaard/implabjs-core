import { Container } from "../Container";
import { argumentNotNull, each, isPrimitive, isPromise } from "../../safe";
import { DescriptorBuilder } from "./DescriptorBuilder";
import { RegistrationBuilder, FluentRegistrations } from "./interfaces";
import { Cancellation } from "../../Cancellation";

export class FluentConfiguration<S extends object, Y extends keyof S = keyof S> {

    _builders: { [k in keyof S]?: RegistrationBuilder<S, S[k]> } = {};

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

    apply(target: Container<S>, ct = Cancellation.none) {

        let pending = 1;

        return new Promise((resolve, reject) => {
            function guard(v: void | Promise<void>) {
                if (isPromise(v))
                    v.catch(reject);
            }

            function complete() {
                if (!--pending)
                    resolve();
            }
            each(this._builders, (v, k) => {
                pending++;
                const d = new DescriptorBuilder<S, any>(target,
                    result => {
                        target.register(k, result);
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
