import { IDestroyable, MapOf } from "../interfaces";
import { argumentNotNull, isDestroyable, argumentNotEmptyString, isRemovable } from "../safe";
import { ILifetime, ServiceContainer } from "./interfaces";
import { ActivationContext } from "./ActivationContext";

function safeCall(item: () => void) {
    try {
        item();
    } catch {
        // silence!
    }
}

const emptyLifetime: ILifetime = Object.freeze({
    has() {
        return false;
    },

    initialize() {

    },

    get() {
        throw new Error("The specified item isn't registered with this lifetime manager");
    },

    store() {
        // does nothing
    },

    toString() {
        return `[object EmptyLifetime]`;
    }

});

const unknownLifetime: ILifetime = Object.freeze({
    has() {
        return false;
    },
    initialize() {
        throw new Error("Can't call initialize on the unknown lifetime object");
    },
    get() {
        throw new Error("The lifetime object isn't initialized");
    },
    store() {
        throw new Error("Can't store a value in the unknown lifetime object");
    },
    toString() {
        return `[object UnknownLifetime]`;
    }
});

let nextId = 0;

const singletons: any = {};

export class LifetimeManager implements IDestroyable {
    private _cleanup: (() => void)[] = [];
    private _cache: MapOf<any> = {};
    private _destroyed = false;

    private _pending: MapOf<boolean> = {};

    create(): ILifetime {
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

            initialize() {
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

    static empty(): ILifetime {
        return emptyLifetime;
    }

    static hierarchyLifetime() {
        let _lifetime = unknownLifetime;
        return {
            initialize(context: ActivationContext<any>) {
                if (_lifetime !== unknownLifetime)
                    throw new Error("Cyclic reference activation detected");

                _lifetime = context.getContainer().getLifetimeManager().create();
            },
            get() {
                return _lifetime.get();
            },
            has() {
                return _lifetime.has();
            },
            store(item: any, cleanup?: (item: any) => void) {
                return _lifetime.store(item, cleanup);
            },
            toString() {
                return `[object HierarchyLifetime, has=${this.has()}]`;
            }
        };
    }

    static contextLifetime() {
        let _lifetime = unknownLifetime;
        return {
            initialize(context: ActivationContext<any>) {
                if (_lifetime !== unknownLifetime)
                    throw new Error("Cyclic reference detected");
                _lifetime = context.createLifetime();
            },
            get() {
                return _lifetime.get();
            },
            has() {
                return _lifetime.has();
            },
            store(item: any) {
                _lifetime.store(item);
            },
            toString() {
                return `[object ContextLifetime, has=${this.has()}]`;
            }
        };
    }

    static singletonLifetime(typeId: string) {
        argumentNotEmptyString(typeId, "typeId");
        let pending = false;
        return {
            has() {
                return typeId in singletons;
            },
            get() {
                if (!this.has())
                    throw new Error(`The instance ${typeId} doesn't exists`);
                return singletons[typeId];
            },
            initialize() {
                if (pending)
                    throw new Error("Cyclic reference detected");
                pending = true;
            },
            store(item: any) {
                singletons[typeId] = item;
                pending = false;
            },
            toString() {
                return `[object SingletonLifetime, has=${this.has()}, typeId=${typeId}]`;
            }
        };
    }

    static containerLifetime(container: ServiceContainer<any>) {
        let _lifetime = unknownLifetime;
        return {
            initialize(context: ActivationContext<any>) {
                if (_lifetime !== unknownLifetime)
                    throw new Error("Cyclic reference detected");
                _lifetime = container.getLifetimeManager().create();
            },
            get() {
                return _lifetime.get();
            },
            has() {
                return _lifetime.has();
            },
            store(item: any) {
                _lifetime.store(item);
            },
            toString() {
                return `[object ContainerLifetime, has=${_lifetime.has()}]`;
            }
        };
    }
}
