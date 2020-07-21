import { IDestroyable, MapOf } from "../interfaces";
import { argumentNotNull, isDestroyable } from "../safe";
import { ILifetimeManager } from "./interfaces";

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

    has(id: string) {
        return id in this._cache;
    }

    get(id: string) {
        const t = this._cache[id];
        if (t === undefined)
            throw new Error(`The item with with the key ${id} isn't found`);
        return t;
    }

    register(id: string, item: any, cleanup?: (item: any) => void) {
        argumentNotNull(id, "id");
        argumentNotNull(item, "item");
        if (this.has(id))
            throw new Error(`The item with with the key ${id} already registered with this lifetime manager`);
        this._cache[id] = item;

        if (this._destroyed)
            throw new Error("Lifetime manager is destroyed");
        if (cleanup) {
            this._cleanup.push(() => cleanup(item));
        } else if (isDestroyable(item)) {
            this._cleanup.push(() => item.destroy());
        }
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
