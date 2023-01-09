import { NablaDbOptions } from './types/NablaDb.js';
import NablaClient from './NablaClient.js';
import { NablaCollectionOptions } from './types/NablaCollection.js';
import NablaCollection from './NablaCollection.js';
declare class NablaDb {
    options: NablaDbOptions;
    dbName: string;
    constructor(dbName: string, options?: NablaDbOptions);
    private _init;
    create(): this;
    delete(): this;
    collection(collectionName: string, options?: NablaCollectionOptions): NablaCollection;
    get exists(): boolean;
    get $DbDir(): import("filic/lib/Directory.js").default;
    get $CollectionsDir(): import("filic/lib/Directory.js").default;
    get $DbJson(): import("filic/lib/File.js").default;
    get Client(): NablaClient;
}
export default NablaDb;
