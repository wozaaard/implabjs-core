import {
    PartialServiceMap,
    ActivationType,
    ContainerKeys,
    ContainerResolve
} from "./interfaces";

import { argumentNotEmptyString, isPrimitive, isPromise, delegate, argumentOfType, argumentNotNull, get, primitive } from "../safe";
import { AggregateDescriptor } from "./AggregateDescriptor";
import { ValueDescriptor } from "./ValueDescriptor";
import { Container } from "./Container";
import { ReferenceDescriptor } from "./ReferenceDescriptor";
import { TypeServiceDescriptor } from "./TypeServiceDescriptor";
import { FactoryServiceDescriptor } from "./FactoryServiceDescriptor";
import { TraceSource } from "../log/TraceSource";
import { ConfigError } from "./ConfigError";
import { Cancellation } from "../Cancellation";
import { makeResolver } from "./ResolverHelper";
import { ICancellation } from "../interfaces";
import { isDescriptor } from "./traits";
import { LazyReferenceDescriptor } from "./LazyReferenceDescriptor";
import { LifetimeManager } from "./LifetimeManager";

export interface RegistrationScope<S extends object> {

    /** сервисы, которые регистрируются в контексте активации и таким образом
     * могут переопределять ранее зарегистрированные сервисы. за это свойство
     * нужно платить, кроме того порядок активации будет влиять на результат
     * разрешения зависимостей.
     */
    services?: RegistrationMap<S>;
}

/**
 * Базовый интефейс конфигурации сервисов
 */
export interface ServiceRegistration<T, S extends object> extends RegistrationScope<S> {

    activation?: ActivationType;

    params?: any;

    inject?: object | object[];

    cleanup?: ((instance: T) => void) | string;
}

export interface TypeRegistration<C extends new (...args: any[]) => any, S extends object> extends ServiceRegistration<InstanceType<C>, S> {
    $type: string | C;
    params?: Registration<ConstructorParameters<C>, S>;
}

export interface StrictTypeRegistration<C extends new (...args: any[]) => any, S extends object> extends ServiceRegistration<InstanceType<C>, S> {
    $type: C;
    params?: Registration<ConstructorParameters<C>, S>;
}

export interface FactoryRegistration<F extends (...args: any[]) => any, S extends object> extends ServiceRegistration<ReturnType<F>, S> {
    $factory: string | F;
}

export interface ValueRegistration<T> {
    $value: T;
    parse?: boolean;
}

export interface DependencyRegistration<S extends object, K extends ContainerKeys<S> = ContainerKeys<S>> extends RegistrationScope<S> {
    $dependency: K;
    lazy?: boolean;
    optional?: boolean;
    default?: ContainerResolve<S, K>;
}

export interface LazyDependencyRegistration<S extends object, K extends ContainerKeys<S> = ContainerKeys<S>> extends DependencyRegistration<S, K> {
    lazy: true;
}

export type Registration<T, S extends object> = T extends primitive ? T :
    (
        T |
        { [k in keyof T]: Registration<T[k], S> } |
        TypeRegistration<new (...args: any[]) => T, S> |
        FactoryRegistration<(...args: any[]) => T, S> |
        ValueRegistration<any> |
        DependencyRegistration<S, keyof S>
    );

export type RegistrationMap<S extends object> = {
    [k in keyof S]?: Registration<S[k], S>;
};

const _activationTypes: { [k in ActivationType]: number; } = {
    singleton: 1,
    container: 2,
    hierarchy: 3,
    context: 4,
    call: 5
};

export function isTypeRegistration(x: any): x is TypeRegistration<new () => any, any> {
    return (!isPrimitive(x)) && ("$type" in x);
}

export function isFactoryRegistration(x: any): x is FactoryRegistration<() => any, any> {
    return (!isPrimitive(x)) && ("$factory" in x);
}

export function isValueRegistration(x: any): x is ValueRegistration<any> {
    return (!isPrimitive(x)) && ("$value" in x);
}

export function isDependencyRegistration<S extends object>(x: any): x is DependencyRegistration<S, keyof S> {
    return (!isPrimitive(x)) && ("$dependency" in x);
}

export function isActivationType(x: string): x is ActivationType {
    return typeof x === "string" && x in _activationTypes;
}

const trace = TraceSource.get("@implab/core/di/Configuration");
async function mapAll(data: any[], map?: (v: any, k: number) => any): Promise<any[]>;
async function mapAll(data: any, map?: (v: any, k: string) => any): Promise<any>;
async function mapAll(data: any, map?: (v: any, k: any) => any): Promise<any> {
    if (data instanceof Array) {
        return Promise.all(map ? data.map(map) : data);
    } else {
        const keys = Object.keys(data);

        const o: any = {};

        await Promise.all(keys.map(async k => {
            const v = map ? map(data[k], k) : data[k];
            o[k] = isPromise(v) ? await v : v;
        }));

        return o;
    }
}

export type ModuleResolver = (moduleName: string, ct?: ICancellation) => any;

export class Configuration<S extends object> {

    _hasInnerDescriptors = false;

    readonly _container: Container<S>;

    _path: Array<string>;

    _configName: string | undefined;

    _require: ModuleResolver | undefined;

    constructor(container: Container<S>) {
        argumentNotNull(container, "container");
        this._container = container;
        this._path = [];
    }

    async loadConfiguration(moduleName: string, contextRequire?: any, ct = Cancellation.none) {
        argumentNotEmptyString(moduleName, "moduleName");

        trace.log(
            "loadConfiguration moduleName={0}, contextRequire={1}",
            moduleName,
            contextRequire ? typeof (contextRequire) : "<nil>"
        );

        this._configName = moduleName;

        const r = await makeResolver(undefined, contextRequire);

        const config = await r(moduleName, ct);

        await this._applyConfiguration(
            config,
            await makeResolver(moduleName, contextRequire),
            ct
        );
    }

    async applyConfiguration(data: RegistrationMap<S>, contextRequire?: any, ct = Cancellation.none) {
        argumentNotNull(data, "data");

        await this._applyConfiguration(data, await makeResolver(void (0), contextRequire), ct);
    }

    async _applyConfiguration(data: RegistrationMap<S>, resolver?: ModuleResolver, ct = Cancellation.none) {
        trace.log("applyConfiguration");

        this._configName = "$";

        if (resolver)
            this._require = resolver;

        let services: PartialServiceMap<S>;

        try {
            services = await this._visitRegistrations(data, "$");
        } catch (e) {
            throw this._makeError(e);
        }

        this._container.register(services);
    }

    _makeError(inner: any) {
        const e = new ConfigError("Failed to load configuration", inner);
        e.configName = this._configName || "<inline>";
        e.path = this._makePath();
        return e;
    }

    _makePath() {
        return this._path
            .reduce(
                (prev, cur) => typeof cur === "number" ?
                    `${prev}[${cur}]` :
                    `${prev}.${cur}`
            )
            .toString();
    }

    async _resolveType(moduleName: string, localName: string) {
        trace.log("resolveType moduleName={0}, localName={1}", moduleName, localName);
        try {
            const m = await this._loadModule(moduleName);
            return localName ? get(localName, m) : m;
        } catch (e) {
            trace.error("Failed to resolve type moduleName={0}, localName={1}", moduleName, localName);
            throw e;
        }
    }

    _loadModule(moduleName: string) {
        trace.debug("loadModule {0}", moduleName);
        if (!this._require)
            throw new Error("Module loader isn't specified");

        return this._require(moduleName);
    }

    async _visitRegistrations(data: RegistrationMap<S>, name: string) {
        this._enter(name);

        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            throw new Error("Configuration must be a simple object");

        const services = await mapAll(data, async (v, k) => {
            const d = await this._visit(v, k.toString());
            return isDescriptor(d) ? d : new AggregateDescriptor(d);
        }) as PartialServiceMap<S>;

        this._leave();

        return services;
    }

    _enter(name: string) {
        this._path.push(name.toString());
        trace.debug(">{0}", name);
    }

    _leave() {
        const name = this._path.pop();
        trace.debug("<{0}", name);
    }

    async _visit(data: any, name: string): Promise<any> {
        if (isPrimitive(data) || isDescriptor(data))
            return data;

        if (isDependencyRegistration<S>(data)) {
            return this._visitDependencyRegistration(data, name);
        } else if (isValueRegistration(data)) {
            return this._visitValueRegistration(data, name);
        } else if (isTypeRegistration(data)) {
            return this._visitTypeRegistration(data, name);
        } else if (isFactoryRegistration(data)) {
            return this._visitFactoryRegistration(data, name);
        } else if (data instanceof Array) {
            return this._visitArray(data, name);
        }

        return this._visitObject(data, name);
    }

    async _visitObject(data: any, name: string) {
        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            return new ValueDescriptor(data);

        this._enter(name);

        const v = await mapAll(data, delegate(this, "_visit"));

        // TODO: handle inline descriptors properly
        // const ex = {
        //     activate(ctx) {
        //         const value = ctx.activate(this.prop, "prop");
        //         // some code
        //     },
        //     // will be turned to ReferenceDescriptor
        //     prop: { $dependency: "depName" }
        // };

        this._leave();
        return v;
    }

    async _visitArray(data: any[], name: string) {
        if (data.constructor &&
            data.constructor.prototype !== Array.prototype)
            return new ValueDescriptor(data);

        this._enter(name);

        const v = await mapAll(data, delegate(this, "_visit"));
        this._leave();

        return v;
    }

    _makeServiceParams(data: ServiceRegistration<any, S>) {
        const opts: any = {
        };
        if (data.services)
            opts.services = this._visitRegistrations(data.services, "services");

        if (data.inject) {
            this._enter("inject");
            opts.inject = mapAll(
                data.inject instanceof Array ?
                    data.inject :
                    [data.inject],
                delegate(this, "_visitObject")
            );
            this._leave();
        }

        if ("params" in data)
            opts.params = data.params instanceof Array ?
                this._visitArray(data.params, "params") :
                this._visit(data.params, "params");

        if (data.activation) {
            opts.activation = this._getLifetimeManager(data.activation);
        }

        if (data.cleanup)
            opts.cleanup = data.cleanup;

        return opts;
    }

    async _visitValueRegistration<T>(data: ValueRegistration<T>, name: string) {
        this._enter(name);
        const d = data.parse ? new AggregateDescriptor(data.$value) : new ValueDescriptor(data.$value);
        this._leave();
        return d;
    }

    async _visitDependencyRegistration<K extends keyof S>(data: DependencyRegistration<S, K>, name: string) {
        argumentNotEmptyString(data && data.$dependency, "data.$dependency");
        this._enter(name);
        const options = {
            name: data.$dependency,
            optional: data.optional,
            default: data.default,
            services: data.services && await this._visitRegistrations(data.services, "services")
        };
        const d = data.lazy ? new LazyReferenceDescriptor<S, K>(options) : new ReferenceDescriptor<S, K>(options);
        this._leave();
        return d;
    }

    async _visitTypeRegistration(data: TypeRegistration<new () => any, S>, name: string) {
        argumentNotNull(data.$type, "data.$type");
        this._enter(name);

        const opts = this._makeServiceParams(data);
        if (data.$type instanceof Function) {
            opts.type = data.$type;
        } else {
            const [moduleName, typeName] = data.$type.split(":", 2);
            opts.type = this._resolveType(moduleName, typeName);
        }

        const d = new TypeServiceDescriptor<S, any, any[]>(
            await mapAll(opts)
        );

        this._leave();

        return d;
    }

    async _visitFactoryRegistration(data: FactoryRegistration<() => any, S>, name: string) {
        argumentOfType(data.$factory, Function, "data.$factory");
        this._enter(name);

        const opts = this._makeServiceParams(data);
        opts.factory = data.$factory;

        const d = new FactoryServiceDescriptor<S, any, any[]>(
            await mapAll(opts)
        );

        this._leave();
        return d;
    }

    _getLifetimeManager(activation: ActivationType) {
        switch (activation) {
            case "container":
                return this._container.getLifetimeManager();
            case "hierarchy":
                return LifetimeManager.hierarchyLifetime;
            case "context":
                return LifetimeManager.contextLifetime;
            case "singleton":
                return LifetimeManager.singletonLifetime;
            default:
                return LifetimeManager.empty;
        }
    }
}
