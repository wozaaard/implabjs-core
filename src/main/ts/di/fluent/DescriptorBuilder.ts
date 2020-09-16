import { Resolver, RegistrationBuilder } from "./interfaces";
import { Descriptor, ILifetime, ActivationType, PartialServiceMap, ServiceContainer } from "../interfaces";
import { DescriptorImpl } from "./DescriptorImpl";
import { LifetimeManager } from "../LifetimeManager";
import { isString, each, isPrimitive, isPromise, oid } from "../../safe";

export class DescriptorBuilder<S extends object, T> {
    private readonly _container: ServiceContainer<S>;
    private readonly _cb: (d: Descriptor<S, T>) => void;

    private readonly _eb: (err: any) => void;

    private _lifetime = LifetimeManager.empty();

    private _overrides?: PartialServiceMap<S>;

    private _cleanup?: (item: T) => void;

    private _factory?: (resolve: Resolver<S>) => T;

    private _pending = 1;

    private _failed = false;

    constructor(container: ServiceContainer<S>, cb: (d: Descriptor<S, T>) => void, eb: (err: any) => void) {
        this._container = container;
        this._cb = cb;
        this._eb = eb;
    }

    build<T2>(): DescriptorBuilder<S, T2> {
        this._defer();
        return new DescriptorBuilder<S, T2>(this._container, () => this._complete(), err => this._fail(err));
    }

    override<K extends keyof S>(name: K, builder: RegistrationBuilder<S, S[K]>): this;
    override<K extends keyof S>(services: { [name in K]: RegistrationBuilder<S, S[K]> }): this;
    override<K extends keyof S>(nameOrServices: K | { [name in K]: RegistrationBuilder<S, S[K]> }, builder?: RegistrationBuilder<S, S[K]>): this {
        const overrides: PartialServiceMap<S> = this._overrides ?
            this._overrides :
            (this._overrides = {});

        const guard = (v: void | Promise<void>) => {
            if (isPromise(v))
                v.catch(err => this._fail(err));
        };

        if (isPrimitive(nameOrServices)) {
            if (builder) {
                this._defer();
                const d = new DescriptorBuilder<S, S[K]>(
                    this._container,
                    result => {
                        overrides[nameOrServices] = result;
                        this._complete();
                    },
                    err => this._fail(err)
                );

                try {
                    guard(builder(d));
                } catch (err) {
                    this._fail(err);
                }
            }
        } else {
            each(nameOrServices, (v, k) => this.override(k, v));
        }
        return this;
    }

    lifetime(lifetime: "singleton", typeId: string): this;
    lifetime(lifetime: ILifetime | Exclude<ActivationType, "singleton">): this;
    lifetime(lifetime: ILifetime | ActivationType, typeId?: string): this {
        if (isString(lifetime)) {
            this._lifetime = this._resolveLifetime(lifetime, typeId);
        } else {
            this._lifetime = lifetime;
        }
        return this;
    }

    cleanup(cb: (item: T) => void): this {
        this._cleanup = cb;
        return this;
    }

    factory(f: (resolve: Resolver<S>) => T): void {
        this._factory = f;
        this._complete();
    }

    value(v: T): void {
        this._cb({
            activate() {
                return v;
            }
        });
    }

    _resolveLifetime(activation: ActivationType, typeId?: string | object) {
        switch (activation) {
            case "container":
                return LifetimeManager.containerLifetime(this._container);
            case "hierarchy":
                return LifetimeManager.hierarchyLifetime();
            case "context":
                return LifetimeManager.contextLifetime();
            case "singleton":
                if (!typeId)
                    throw Error("The singleton activation requires a typeId");

                const _oid = isString(typeId) ? typeId : oid(typeId);

                return LifetimeManager.singletonLifetime(_oid);
            default:
                return LifetimeManager.empty();
        }
    }

    _defer() {
        this._pending++;
    }

    _complete() {
        if (--this._pending === 0) {
            if (!this._factory)
                throw new Error("The factory must be specified");

            this._cb(new DescriptorImpl<S, T>({
                lifetime: this._lifetime,
                factory: this._factory,
                overrides: this._overrides,
                cleanup: this._cleanup
            }));
        }
    }

    _fail(err: any) {
        if (!this._failed) {
            this._failed = true;
            this._eb.call(undefined, err);
        }
    }

}
