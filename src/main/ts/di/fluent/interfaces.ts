import { primitive } from "../../safe";
import { ActivationType } from "../interfaces";
import { AnnotaionBuilder } from "../Annotations";
import { LazyDependencyRegistration, DependencyRegistration } from "../Configuration";
import { Container } from "../Container";

export interface DependencyOptions<T> {
    optional?: boolean;
    default?: T;
}

export interface LazyDependencyOptions<T> extends DependencyOptions<T> {
    lazy: true;
}

export type ExtractService<K, S> = K extends keyof S ? S[K] : K;

export type ExtractDependency<D, S> = D extends { $dependency: infer K } ?
    D extends { lazy: true } ? () => ExtractService<K, S> : ExtractService<K, S> :
    D extends { $type: new (...args: any[]) => infer I } ? I :
    D extends { $factory: (...args: any[]) => infer R } ? R :
    WalkDependencies<D, S>;

export type WalkDependencies<D, S> = D extends primitive ? D :
    { [K in keyof D]: ExtractDependency<D[K], S> };

export type ServiceModule<T, S extends object, M extends keyof any = "service"> = {
    [m in M]: AnnotaionBuilder<T, S>;
};

export interface ServiceRecordBuilder<T, S extends object> {
    type<P extends any[], C extends new (...args: ExtractDependency<P, S>) => T>(
        target: C, ...params: P): ConstructorBuilder<C, S>;
    factory<P extends any[], F extends (...args: ExtractDependency<P, S>) => T>(
        target: F, ...params: P): FactoryBuilder<F, S>;
    wired<M extends keyof any>(module: ServiceModule<T, S, M>, m: M): RegistrationBuilder<T, S>;
    wired(module: ServiceModule<T, S>): RegistrationBuilder<T, S>;
}

export interface RegistrationVisitor<S extends object> {
    visitDependency(): void;

    visitObject(): void;

    visitTypeRegistration(): void;

    visitFactoryRegistration(): void;

}

export interface RegistrationBuilder<T, S extends object> {
    override<K extends keyof S>(name: K, builder: S[K], raw: true): this;
    override<K extends keyof S>(name: K, builder: (t: ServiceRecordBuilder<S[K], S>) => void): this;
    override<K extends keyof S, V>(name: S[K] extends ExtractDependency<V, S> ? K : never, value: V): this;

    activate(activation: ActivationType): this;
    inject<M extends keyof T, P extends any[]>(member: T[M] extends (...params: ExtractDependency<P, S>) => any ? M : never, ...params: P): this;

    visit(visitor: RegistrationVisitor<S>): void;
}

export interface ConstructorBuilder<C extends new (...args: any[]) => any, S extends object> extends RegistrationBuilder<InstanceType<C>, S> {
    $type: C;
}

export interface FactoryBuilder<F extends (...args: any[]) => any, S extends object> extends RegistrationBuilder<ReturnType<F>, S> {
    $factory: F;
}

export interface ConfigBuilder<S extends object, Y extends keyof S = keyof S> {
    register<K extends Y>(name: K, builder: (t: ServiceRecordBuilder<S[K], S>) => void | Promise<void>): ConfigBuilder<S, Exclude<Y, K>>;
    register<K extends Y, V>(name: S[K] extends ExtractDependency<V, S> ? K : never, value: V): ConfigBuilder<S, Exclude<Y, K>>;
    register<K extends Y>(name: K, value: S[K], raw: true): ConfigBuilder<S, Exclude<Y, K>>;

    apply(container: Container<S>): Promise<void>;
}

interface ServicesDeclaration<S extends object> {
    build<T>(this: void): ServiceRecordBuilder<T, S>;
    annotate<T>(this: void): AnnotaionBuilder<T, S>;

    dependency<K extends keyof S>(this: void, name: K, opts: LazyDependencyOptions<S[K]>): LazyDependencyRegistration<S, K>;
    dependency<K extends keyof S>(this: void, name: K, opts?: DependencyOptions<S[K]>): DependencyRegistration<S, K>;

    configure(): ConfigBuilder<S>;
}

export declare function declare<S extends object>(): ServicesDeclaration<S>;