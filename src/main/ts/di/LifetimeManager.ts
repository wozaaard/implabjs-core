import { IDestroyable, MapOf } from "../interfaces";
import { argumentNotNull, isDestroyable } from "../safe";
import { ILifetimeManager, ILifetime } from "./interfaces";
import { ActivationContext } from "./ActivationContext";

function safeCall(item: () => void) {
    try {
        item();
    } catch {
        // silence!
    }
}

const emptyLifetime: ILifetime = {
    has() {
        return false;
    },

    enter() {

    },

    get() {
        throw new Error("The specified item isn't registered with this lifetime manager");
    },

    store() {
        // does nothing
    }

};

let nextId = 0;

export class LifetimeManager implements IDestroyable, ILifetimeManager {
    private _cleanup: (() => void)[] = [];
    private _cache: MapOf<any> = {};
    private _destroyed = false;

    private _pending: MapOf<boolean> = {};

    initialize(): ILifetime {
        const self = this;
        const id = ++nextId;
        return {
            has() {
                return (id in self._cache);
            },

            get() {
                const t = self._cache[id];
                if (t === undefined)
                    throw new Error(`The item with with the key ${id} isn't found`);
                return t;
            },

            enter() {
                if (self._pending[id])
                    throw Error(`Cyclic reference detected: the item with the key ${id} is already activating.`);
                self._pending[id] = true;
            },

            store(item: any, cleanup?: (item: any) => void) {
                argumentNotNull(id, "id");
                argumentNotNull(item, "item");

                if (this.has())
                    throw new Error(`The item with with the key ${id} already registered with this lifetime manager`);
                delete self._pending[id];

                self._cache[id] = item;

                if (self._destroyed)
                    throw new Error("Lifetime manager is destroyed");
                if (cleanup) {
                    self._cleanup.push(() => cleanup(item));
                } else if (isDestroyable(item)) {
                    self._cleanup.push(() => item.destroy());
                }
            }
        };
    }

    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            this._cleanup.forEach(safeCall);
            this._cleanup.length = 0;
        }
    }

    static readonly empty: ILifetimeManager = {
        initialize(): ILifetime {
            return emptyLifetime;
        }
    };

    static readonly hierarchyLifetime: ILifetimeManager = {
        initialize(context: ActivationContext<any>): ILifetime {
            return context.getContainer().getLifetimeManager().initialize(context);
        }
    };

    static readonly contextLifetime: ILifetimeManager = {
        initialize(context: ActivationContext<any>): ILifetime {
            const id = String(++nextId);
            return {
                enter() {
                    if (context.visit(id))
                        throw new Error("Cyclic reference detected");
                },
                get() {
                    return context.get(id);
                },
                has() {
                    return context.has(id);
                },
                store(item: any) {
                    context.store(id, item);
                }
            };
        }
    };

    static singletonLifetime(typeId: string): ILifetimeManager {
        return {
            initialize() {
                return emptyLifetime;
            }
        };
    }
}
