import { NablaClientOptions } from './types/NablaClient.js';
import Filic from 'filic';
import NablaDb from './NablaDb.js';
import { NablaDbOptions } from './types/NablaDb.js';
declare class NablaClient {
    static VERBOSE: number;
    options: NablaClientOptions;
    constructor(options?: NablaClientOptions);
    private _init;
    init(): void;
    db(dbName: string, options?: NablaDbOptions): NablaDb;
    get $Root(): Filic;
    get $NablaJson(): import("filic/lib/File.js").default;
    get $DbsDir(): import("filic/lib/Directory.js").default;
    static log(verboseLevel?: number, ...args: any[]): any;
    static create(options?: NablaClientOptions): NablaClient;
}
export default NablaClient;
