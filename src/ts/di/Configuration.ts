import { ServiceRegistration, TypeRegistration, FactoryRegistration, ServiceMap, Descriptor, isDescriptor, isDependencyRegistration, DependencyRegistration, ValueRegistration, ActivationType, isValueRegistration, isTypeRegistration, isFactoryRegistration } from "./interfaces";
import { isNullOrEmptyString, argumentNotEmptyString, isPrimitive } from "../safe";
import { AggregateDescriptor } from "./AggregateDescriptor";
import { ValueDescriptor } from "./ValueDescriptor";
import { ServiceDescriptorParams } from "./ServiceDescriptor";
import { Container } from "./Container";
import { Constructor } from "../interfaces";

interface MapOf<T> {
    [key: string]: T;
}

type _key = string | number;

export class Configuration {

    _hasInnerDescriptors = false;

    _container: Container;

    _path: Array<_key>;

    async _visitRegistrations(data, name: _key) {
        this._path.push(name);

        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            throw new Error("Configuration must be a simple object");

        const o: ServiceMap = {};
        const keys = Object.keys(data);

        const res = await Promise.all(keys.map(k => this._visit(data[k], k)));
        keys.forEach((k, i) => {
            o[k] = isDescriptor(res[i]) ? res[i] : new AggregateDescriptor(res[i]);
        });

        this._path.pop();

        return o;
    }

    async _visit(data, name: string): Promise<any> {
        if (isPrimitive(data) || isDescriptor(data))
            return data;

        if (isDependencyRegistration(data)) {
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

    async _resolveType(moduleName: string, typeName: string): Promise<Constructor> {

    }

    async _visitObject(data: object, name: _key): Promise<object> {
        this._path.push(name);
        this._path.pop();
    }

    async _visitArray(data: any[], name: _key): Promise<any[]> {
        this._path.push(name);
        this._path.pop();
    }

    async _makeServiceParams(data: ServiceRegistration) {
        const opts: any = {};
        if (data.services)
            opts.services = await this._visitRegistrations(data.services, "services");

        if (data.inject) {
            if (data.inject instanceof Array) {
                this._path.push("inject");
                opts.inject = Promise.all(data.inject.map((x, i) => this._visitObject(x, i)));
                this._path.pop();
            } else {
                opts.inject = [this._visitObject(data.inject, "inject")];
            }
        }

        if (data.params)
            opts.params = await this._visit(data.params, "params");

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
    }

    async _visitValueRegistration(item: ValueRegistration, name: _key) {
        this._path.push(name);
        this._path.pop();
    }

    async _visitDependencyRegistration(item: DependencyRegistration, name: _key) {
        this._path.push(name);
        this._path.pop();
    }

    async _visitTypeRegistration(item: TypeRegistration, name: _key) {
        argumentNotEmptyString(item.$type, "item.$type");
    }

    async _visitFactoryRegistration(item: FactoryRegistration, name: _key) {
        argumentNotEmptyString(item.$factory, "item.$type");
    }
}
