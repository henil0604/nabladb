import { randomUUID } from "crypto";
import NablaClient from "./NablaClient.js";
import { NablaCollectionOptions } from "./types/NablaCollection.js";
import Utils from "./Utils.js";


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

        if (!this.$CollectionJson.exists) {
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

    public async insert(data: any) {
        data._id = data._id || randomUUID();

        await this.$CollectionJson.update((content) => {
            const json = content.toJSON();
            json.documents[data._id] = data;
            return json;
        })

        return data;
    }
    public insertSync(data: any) {
        data._id = data._id || randomUUID();

        this.$CollectionJson.updateSync((content) => {
            const json = content.toJSON();
            json.documents[data._id] = data;
            return json
        })

        return data;
    }

    public async insertMany(dataGroup: any[]) {
        for await (const data of dataGroup) {
            await this.insert(data);
        }
    }
    public insertManySync(dataGroup: any[]) {
        for (const data of dataGroup) {
            this.insertSync(data);
        }
    }

    public async getAll() {
        const documents = (await this.$CollectionJson.read()).toJSON().documents
        return Utils.objectToArray(documents);
    }

    public getAllSync() {
        const documents = (this.$CollectionJson.readSync()).toJSON().documents
        return Utils.objectToArray(documents);
    }

    public async getMany(where?: any) {
        const docs = [];

        const allDocs = await this.getAll();

        for await (const doc of allDocs) {
            let valid = false;
            for (const key in where) {
                if (Object.prototype.hasOwnProperty.call(where, key)) {
                    const value = where[key];
                    if (value === doc[key]) {
                        valid = true;
                        continue;
                    }
                    valid = false;
                }
            }

            if (valid === true) {
                docs.push(doc);
            }
        }
        return docs;
    }
    public getManySync(where?: any) {
        const docs = [];

        const allDocs = this.getAllSync();

        for (const doc of allDocs) {
            let valid = false;
            for (const key in where) {
                if (Object.prototype.hasOwnProperty.call(where, key)) {
                    const value = where[key];
                    if (value === doc[key]) {
                        valid = true;
                        continue;
                    }
                    valid = false;
                }
            }

            if (valid === true) {
                docs.push(doc);
            }
        }
        return docs;
    }

    public async getFirst(where?: any) {
        const docs = await this.getMany(where);
        return (docs.length === 0) ? null : docs[0];
    }
    public getFirstSync(where?: any) {
        const docs = this.getManySync(where);
        return (docs.length === 0) ? null : docs[0];
    }

    public async deleteFirst(where?: any) {
        const doc = await this.getFirst(where);

        if (!doc) return null;

        await this.$CollectionJson.update((content) => {
            const json = content.toJSON();
            delete json.documents[doc._id];
            return json;
        })

        return doc;
    }
    public deleteFirstSync(where?: any) {
        const doc = this.getFirstSync(where);
        
        if (!doc) return null;

        this.$CollectionJson.updateSync((content) => {
            const json = content.toJSON();
            delete json.documents[doc._id];
            return json;
        })

        return doc;
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
    }

    public get $CollectionJson() {
        return this.Db.$CollectionDir.openFile(`${this.collectionName}.json`, { autoCreate: false });
    }

    public get Db() {
        return this.options.db;
    }

}

export default NablaCollection;