import NablaClient from "./NablaClient.js";
import { NablaCollectionOptions } from "./types/NablaCollection.js";


class NablaCollection {
    public collectionName: string
    public options: NablaCollectionOptions;

    public constructor(collectionName: string, options?: NablaCollectionOptions) {
        this.collectionName = collectionName;
        this.options = options;

        this._init();
    }

    private _init() {
        // Option Default Filling
        this.options.autoCreate = this.options.autoCreate || true

        NablaClient.log(3, `Checking to autoCreate options`);
        // Creating database
        if (this.options.autoCreate && this.exists === false) {
            !this.Db.$CollectionDir.exists ? NablaClient.log(2, "Creating collections Directory") && this.Db.$CollectionDir.createSync() : 0;

            NablaClient.log(3, `Could not find database, creating it`);
            this.create();
        }
    }

    public create() {
        NablaClient.log(4, `Checking for existence`);
        if (this.exists) {
            NablaClient.log(1, `Collection {${this.collectionName}} Already Exists`, 'warn');
            return this;
        }

        NablaClient.log(1, `Creating Collection: {${this.collectionName}}`);

        NablaClient.log(3, `Creating {${this.$CollectionJson.filename}}`);
        // Creating <collection>.<db>.json
        this.$CollectionJson.createSync();

        NablaClient.log(3, `writing on {${this.$CollectionJson.filename}}`);
        // writing to <collection>.<db>.json file
        this.$CollectionJson.writeSync({
            collectionName: this.collectionName,
            dbName: this.Db.dbName,
            createdAt: Date.now(),
            documents: {}
        })

        NablaClient.log(3, `updating {${this.Db.$DbJson.filename}} file`);
        // Updating nabla.json
        this.Db.$DbJson.updateSync(content => {
            NablaClient.log(4, `Reading from {${this.Db.$DbJson.filename}}`);
            let json = content.toJSON();
            NablaClient.log(4, `writing new Collection information on {${this.Db.$DbJson.filename}}`);
            json.collections[this.collectionName] = {
                collectionName: this.collectionName,
            }
            return json;
        })

        NablaClient.log(1, `Collection Created: {${this.collectionName}}`, 'success');

        return this;
    }

    public delete() {

        if (!this.exists) {
            NablaClient.log(1, `Collection {${this.collectionName}} Does not Exists`, 'warn');
            return this;
        }

        NablaClient.log(1, `Deleting Collection: {${this.collectionName}}`, 'warn');

        NablaClient.log(3, `Deleting {${this.$CollectionJson.filename}}`, 'warn');
        // deletes <collection>.<db>.json file
        this.$CollectionJson.deleteSync();

        NablaClient.log(3, `Deleting Database information from {${this.Db.$DbJson.filename}}`, 'warn');
        // delete db info from nabla.json
        this.Db.$DbJson.update((content) => {
            NablaClient.log(4, `Reading content from {${this.Db.$DbJson.filename}}`);
            let json = content.toJSON();
            let collection = json.collections[this.collectionName];
            if (collection) {
                NablaClient.log(4, `Deleting {${this.collectionName}} from {${this.Db.$DbJson.filename}}`, 'warn');
                delete json.collections[this.collectionName];
            }
            return json;
        })

        NablaClient.log(1, `Collection Deleted: {${this.collectionName}}`, 'success')

        return this;
    }

    public get exists() {

        if (!this.Db.exists) {
            return false;
        }

        let condition1 = this.Db.$DbJson.readSync().toJSON()?.collections[this.collectionName] === undefined ? false : true;

        let condition2 = this.$CollectionJson.exists;

        if (condition1 === false && condition2 === true) {
            this.delete();
        }

        return condition1 && condition2;
        return false;
    }

    public get $CollectionJson() {
        return this.Db.$CollectionDir.openFile(`${this.collectionName}.json`, { autoCreate: false });
    }

    public get Db() {
        return this.options.db;
    }
}

export default NablaCollection;