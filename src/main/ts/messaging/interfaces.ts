import { ICancellation } from "../interfaces";

/** interface for message consumers, used to recieve messages from a single endpoint.
 */
export interface IConsumer<T> {
    /** Reads the next message from the destination for which the consumer was created.
     * @param options A provider specific options.
     * @param ct The cancellation token for this operation.
     * @returns A recieved message or a promise. If message is prefetched it will
     * be returned immediately, otherwise a promise is returned.
     */
    read(options?: object, ct?: ICancellation): T | Promise<T>;
}

/** Interface for message produsers, used to send messages to the endpoints.
 * The producer can be bound to the particular destination or a destination
 * can be specified as an additional option during post if supported.
 */
export interface IProducer<T> {
    /** Sends a message
     * @param msg The message to send.
     * @param options A provider specific options
     * @param ct The cancellation token for this operation
     */
    post(msg: T, options?: object, ct?: ICancellation): void | Promise<void>;
}

export interface ISession {
    start(ct: ICancellation): void;

    createConsumer<T = any>(destination: string, options?: object): IConsumer<T>;
    createProducer<T = any>(destination: string, options?: object): IProducer<T>;
}
