import {
    ServiceRegistration,
    TypeRegistration,
    FactoryRegistration,
    ServiceMap,
    isDescriptor,
    isDependencyRegistration,
    DependencyRegistration,
    ValueRegistration,
    ActivationType,
    isValueRegistration,
    isTypeRegistration,
    isFactoryRegistration
} from "./interfaces";

import { argumentNotEmptyString, isPrimitive, isPromise, delegate, argumentOfType, argumentNotNull, get } from "../safe";
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

const trace = TraceSource.get("@implab/core/di/Configuration");

async function mapAll(data: any | any[], map?: (v: any, k: number | string) => any): Promise<any> {
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

export class Configuration<S> {

    _hasInnerDescriptors = false;

    _container: Container<S>;

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

    async applyConfiguration(data: object, contextRequire?: any, ct = Cancellation.none) {
        argumentNotNull(data, "data");

        await this._applyConfiguration(data, await makeResolver(void (0), contextRequire), ct);
    }

    async _applyConfiguration(data: object, resolver?: ModuleResolver, ct = Cancellation.none) {
        trace.log("applyConfiguration");

        this._configName = "$";

        if (resolver)
            this._require = resolver;

        let services: ServiceMap;

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

    async _visitRegistrations(data: any, name: string) {
        this._enter(name);

        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            throw new Error("Configuration must be a simple object");

        const o: ServiceMap = {};
        const keys = Object.keys(data);

        const services = await mapAll(data, async (v, k) => {
            const d = await this._visit(v, k.toString());
            return isDescriptor(d) ? d : new AggregateDescriptor(d);
        }) as ServiceMap;

        this._leave();

        return services;
    }

    _enter(name: keyof any) {
        this._path.push(name.toString());
        trace.debug(">{0}", name);
    }

    _leave() {
        const name = this._path.pop();
        trace.debug("<{0}", name);
    }

    async _visit<T>(data: T, name: string) {
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

        return this._visitObject(data as T & object, name);
    }

    async _visitObject<T extends object>(data: T, name: string) {
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

    _makeServiceParams<T, P>(data: ServiceRegistration<T, P, S>) {
        const opts: any = {
            owner: this._container
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
            if (typeof (data.activation) === "string") {
                switch (data.activation.toLowerCase()) {
                    case "singleton":
                        opts.activation = ActivationType.Singleton;
                        break;
                    case "container":
                        opts.activation = ActivationType.Container;
                        break;
                    case "hierarchy":
                        opts.activation = ActivationType.Hierarchy;
                        break;
                    case "context":
                        opts.activation = ActivationType.Context;
                        break;
                    case "call":
                        opts.activation = ActivationType.Call;
                        break;
                    default:
                        throw new Error("Unknown activation type: " +
                            data.activation);
                }
            } else {
                opts.activation = Number(data.activation);
            }
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
        const d = new ReferenceDescriptor<S, K>({
            name: data.$dependency,
            lazy: data.lazy,
            optional: data.optional,
            default: data.default,
            services: data.services && await this._visitRegistrations(data.services, "services")
        });
        this._leave();
        return d;
    }

    async _visitTypeRegistration<T, P>(data: TypeRegistration<T, P, S>, name: string) {
        argumentNotNull(data.$type, "data.$type");
        this._enter(name);

        const opts = this._makeServiceParams(data);
        if (data.$type instanceof Function) {
            opts.type = data.$type;
        } else {
            const [moduleName, typeName] = data.$type.split(":", 2);
            opts.type = this._resolveType(moduleName, typeName);
        }

        const d = new TypeServiceDescriptor(
            await mapAll(opts)
        );

        this._leave();

        return d;
    }

    async _visitFactoryRegistration<T, P>(data: FactoryRegistration<T, P, S>, name: string) {
        argumentOfType(data.$factory, Function, "data.$factory");
        this._enter(name);

        const opts = this._makeServiceParams(data);
        opts.factory = data.$factory;

        const d = new FactoryServiceDescriptor(
            await mapAll(opts)
        );

        this._leave();
        return d;
    }
}
