import { IDestroyable, MapOf } from "../interfaces";
import { argumentNotNull, isDestroyable } from "../safe";
import { ILifetimeManager, ILifetime } from "./interfaces";
import { ActivationContext } from "./ActivationContext";

function safeCall(item: () => void) {
    try {
        item();
    } catch {
        // silence
    }
}

export class LifetimeManager implements IDestroyable, ILifetimeManager {
    private _cleanup: (() => void)[] = [];
    private _cache: MapOf<any> = {};
    private _destroyed = false;

    initialize(id: string, context: ActivationContext<any>): ILifetime {
        const self = this;
        let pending = false;
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
                if (pending)
                    throw Error(`Cyclic reference detected: the item with the key ${id} is already activating.`);
                pending = true;
            },

            store(item: any, cleanup?: (item: any) => void) {
                argumentNotNull(id, "id");
                argumentNotNull(item, "item");

                if (this.has())
                    throw new Error(`The item with with the key ${id} already registered with this lifetime manager`);
                pending = false;

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
        has() {
            return false;
        },

        get() {
            throw new Error("The specified item isn't registered with this lifetime manager");
        },

        register() {
            // does nothing
        },

        destroy() {
            throw new Error("Trying to destroy empty lifetime manager, this is a bug.");
        }
    };
}
