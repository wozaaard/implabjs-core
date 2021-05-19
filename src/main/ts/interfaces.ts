export interface Constructor<T = {}> {
    new(...args: any[]): T;
    prototype: T;
}

export type PromiseOrValue<T> = T | PromiseLike<T>;

export type Factory<T = {}> = (...args: any[]) => T;

export type Predicate<T = any> = (x: T) => boolean;

export type MatchingMemberKeys<T, U> = { [K in keyof T]: T[K] extends U ? K : never}[keyof T];

export type NotMatchingMemberKeys<T, U> = { [K in keyof T]: T[K] extends U ? never : K}[keyof T];

export type ExtractMembers<T, U> = Pick<T, MatchingMemberKeys<T, U>>;

export type ExcludeMembers<T, U> = Pick<T, NotMatchingMemberKeys<T, U>>;

export interface MapOf<T> {
    [key: string]: T;
}

export interface IDestroyable {
    destroy(): void;
}

export interface IRemovable {
    remove(): void;
}

/**
 * Interface for the cancellation token. Cancellation token is
 * a marker indicating that the cancellation was requested, it
 * is up to the operation to decide whether to interrupt or
 * to complete its execution.
 *
 * This interface defines several methods of interaction with
 * the cancellation i.e. either to poll its status or to react
 * through the callback.
 */
export interface ICancellation {
    /**
     * Throws an exception if the cancellation has been requested,
     * otherwise does nothing.
     */
    throwIfRequested(): void;

    /**
     * Checks whether the cancellation is requested.
     * @returns true is the cancellation has been requested,
     *   otherwise returns false.
     */
    isRequested(): boolean;

    /**
     * Checks the ability of the token to be signaled.
     *
     * @returns true if the token is able to request
     *   the cancellation, false otherwise.
     */
    isSupported(): boolean;

    /**
     * Registers the callback to be called when the cancellation
     * is requested.
     *
     * @param cb The callback which receives the reason of the
     *   cancellation.
     * @returns The subscription, after the operation is completed
     *   it should unregister the callback to free resources by
     *   calling the `destroy()` method of the subscription.
     */
    register(cb: (e: any) => void): IDestroyable;
}

/**
 * Интерфейс поддерживающий асинхронную активацию
 */
export interface IActivatable {
    /**
     * @returns Boolean indicates the current state
     */
    isActive(): boolean;

    /**
     * Starts the component activation
     * @param ct cancellation token for this operation
     */
    activate(ct?: ICancellation): Promise<void>;

    /**
     * Starts the component deactivation
     * @param ct cancellation token for this operation
     */
    deactivate(ct?: ICancellation): Promise<void>;

    /**
     * Sets the activation controller for this component
     * @param controller The activation controller
     *
     * Activation controller checks whether this component
     * can be activated and manages the active state of the
     * component
     */
    setActivationController(controller: IActivationController): void;

    /** Indicates whether this component has an activation controller */
    hasActivationController(): boolean;

    /**
     * Gets the current activation controller for this component
     */
    getActivationController(): IActivationController;
}

export interface IActivationController {
    activating(component: IActivatable, ct?: ICancellation): Promise<void>;

    activated(component: IActivatable, ct?: ICancellation): Promise<void>;

    deactivating(component: IActivatable, ct?: ICancellation): Promise<void>;

    deactivated(component: IActivatable, ct?: ICancellation): Promise<void>;

    deactivate(ct?: ICancellation): Promise<void>;

    activate(component: IActivatable, ct?: ICancellation): Promise<void>;

    hasActive(): boolean;

    getActive(): IActivatable;
}

export interface IAsyncComponent {
    getCompletion(): Promise<void>;
}

export interface ICancellable {
    cancel(reason?: any): void;
}

export interface IObservable<T> {
    on(next: (x: T) => void, error?: (e: any) => void, complete?: () => void): IDestroyable;
    next(ct?: ICancellation): Promise<T>;
}

export interface IObserver<T> {
    next(event: T): void;

    error(e: any): void;

    complete(): void;
}

export interface TextWriter {
    write(obj: any): void;
    write(format: string, ...args: any[]): void;

    writeLine(obj?: any): void;
    writeLine(format: string, ...args: any[]): void;

    writeValue(value: any, spec?: string): void;
}
