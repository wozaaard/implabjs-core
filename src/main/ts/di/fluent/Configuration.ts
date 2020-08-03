import { Container } from "../Container";
import { argumentNotNull, each } from "../../safe";
import { DescriptorBuilder } from "./DescriptorBuilder";

enum State {
    ready,

    pending
}

export class Configuration<S extends object, Y extends keyof S = keyof S> {

    private _state = State.ready;

    _completion: PromiseLike<void> = Promise.resolve();

    _builders: { [k in keyof S]?: (service: DescriptorBuilder<S[k], S>) => void } = {};

    register<K extends Y>(name: K, builder: (service: DescriptorBuilder<S[K], S>) => void): Configuration<S, Exclude<Y, K>> {
        argumentNotNull(builder, "builder");

        return this;
    }

    private _moveStart() {
        if (this._state !== State.ready)
            throw new Error("Invalid operation");

        this._state = State.pending;
    }

    private _moveDone() {
        this._state = State.ready;
    }

    apply(target: Container<S>) {
        this._moveStart();

        let pending = 1;

        this._completion = new Promise((resolve, reject) => {
            each(this._builders, (v, k) => {
                pending++;
                const d = new DescriptorBuilder<any, S>(target, result => {
                    target.register(k, result);
                    if (!--pending)
                        resolve();
                });

                try {
                    v(d);
                } catch (e) {
                    reject(e);
                }
            });
        }).then(() => this._moveDone());
    }

}
