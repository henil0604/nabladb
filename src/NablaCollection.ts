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
            !this.Db.$CollectionsDir.exists ? NablaClient.log(2, "Creating collections Directory") && this.Db.$CollectionsDir.createSync() : 0;

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

        NablaClient.log(3, `Updating {${this.$CollectionJson.filename}}`)
        await this.$CollectionJson.update((content) => {
            const json = content.toJSON();
            NablaClient.log(4, `Inserting document`)
            json.documents[data._id] = data;
            return json;
        })

        NablaClient.log(2, `Inserted {${data._id}} in {${this.path}}`, "success")

        return data;
    }
    public insertSync(data: any) {
        data._id = data._id || randomUUID();

        NablaClient.log(3, `Updating {${this.$CollectionJson.filename}}`)
        this.$CollectionJson.updateSync((content) => {
            const json = content.toJSON();
            NablaClient.log(4, `Inserting document`)
            json.documents[data._id] = data;
            return json
        })

        NablaClient.log(2, `Inserted {${data._id}} in {${this.path}}`, "success")

        return data;
    }

    public async insertMany(dataGroup: any[]) {
        NablaClient.log(3, `Inserting {${dataGroup.length}} Documents`);
        const inserted = [];
        for await (const data of dataGroup) {
            const doc = await this.insert(data);
            inserted.push(doc);
        }
        NablaClient.log(2, `Inserted {${inserted.length}} Documents in {${this.path}}`, "success");
        return inserted;
    }

    public insertManySync(dataGroup: any[]) {
        NablaClient.log(3, `Inserting {${dataGroup.length}} Documents`);
        const inserted = [];
        for (const data of dataGroup) {
            const doc = this.insertSync(data);
            inserted.push(doc);
        }
        NablaClient.log(2, `Inserted {${inserted.length}} Documents in {${this.path}}`, "success");
        return inserted;
    }

    public async getAll() {
        NablaClient.log(2, "Fetching All Documents");
        const documents = (await this.$CollectionJson.read()).toJSON().documents
        return Utils.objectToArray(documents);
    }
    public getAllSync() {
        NablaClient.log(2, "Fetching All Documents");
        const documents = (this.$CollectionJson.readSync()).toJSON().documents
        return Utils.objectToArray(documents);
    }

    public async getMany(where: any) {
        NablaClient.log(3, `Fetching Documents with {${Object.keys(where).length}} checks`);
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
                NablaClient.log(4, `Matched: {${doc._id}}`);
                docs.push(doc);
            }
        }
        NablaClient.log(2, `Found {${docs.length}} out of {${allDocs.length}}`, "success");
        return docs;
    }
    public getManySync(where: any) {
        NablaClient.log(3, `Fetching Documents with {${Object.keys(where).length}} checks`);
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
                NablaClient.log(4, `Matched: ${doc._id}`);
                docs.push(doc);
            }
        }
        NablaClient.log(2, `Found {${docs.length}} out of {${allDocs.length}}`, "success");
        return docs;
    }

    public async getFirst(where: any) {
        const docs = await this.getMany(where);
        return (docs.length === 0) ? null : docs[0];
    }
    public getFirstSync(where: any) {
        const docs = this.getManySync(where);
        return (docs.length === 0) ? null : docs[0];
    }

    public async deleteFirst(where: any) {
        NablaClient.log(3, `Deleting First document matching {${Object.keys(where).length}} conditions`, "warn");
        const doc = await this.getFirst(where);

        if (!doc) return null;

        NablaClient.log(3, `Updating {${this.$CollectionJson.filename}}`)
        await this.$CollectionJson.update((content) => {
            const json = content.toJSON();
            NablaClient.log(3, `Deleting document`);
            delete json.documents[doc._id];
            return json;
        })

        NablaClient.log(2, `Deleted {${doc._id}} from {${this.path}}`, "warn")
        return doc;
    }
    public deleteFirstSync(where: any) {
        NablaClient.log(3, `Deleting First document matching {${Object.keys(where).length}} conditions`, "warn");
        const doc = this.getFirstSync(where);

        if (!doc) return null;

        NablaClient.log(3, `Updating {${this.$CollectionJson.filename}}`)
        this.$CollectionJson.updateSync((content) => {
            const json = content.toJSON();
            NablaClient.log(3, `Deleting document`);
            delete json.documents[doc._id];
            return json;
        })

        NablaClient.log(2, `Deleted {${doc._id}} from {${this.path}}`, "warn")
        return doc;
    }

    public async deleteMany(where: any) {
        const docs = await this.getMany(where);
        NablaClient.log(3, `Deleting {${docs.length}} documents from {${this.path}}`, "warn")
        for await (const doc of docs) {
            await this.deleteFirst({
                _id: doc._id
            })
        }
        NablaClient.log(2, `Deleted {${docs.length}} documents from {${this.path}}`, "warn")
        return docs;
    }
    public deleteManySync(where: any) {
        const docs = this.getManySync(where);
        NablaClient.log(3, `Deleting {${docs.length}} documents from {${this.path}}`, "warn")
        for (const doc of docs) {
            this.deleteFirstSync({
                _id: doc._id
            })
        }
        NablaClient.log(2, `Deleted {${docs.length}} documents from {${this.path}}`, "warn")
        return docs;
    }

    public async updateFirst(where: any, data: any) {
        NablaClient.log(3, `Updating First document's {${Object.keys(data).length}} properties, matching {${Object.keys(where).length}} conditions`);

        const doc = await this.getFirst(where);
        let updatedDoc = doc;
        NablaClient.log(4, `Updating {${this.$CollectionJson.filename}}`);
        await this.$CollectionJson.update(content => {
            const json = content.toJSON()

            NablaClient.log(4, `Rewriting {${doc._id}}`);
            json.documents[doc._id] = {
                ...doc,
                ...data,
                _id: doc._id // prevents _id changes
            }

            updatedDoc = json.documents[doc._id]
            return json;
        })

        NablaClient.log(2, `Updated {${Object.keys(data).length}} properties of {${doc._id}} in {${this.path}}`);
        return updatedDoc;
    }
    public updateFirstSync(where: any, data: any) {
        NablaClient.log(3, `Updating First document's {${Object.keys(data).length}} properties, matching {${Object.keys(where).length}} conditions`);

        const doc = this.getFirstSync(where);
        let updatedDoc = doc;
        NablaClient.log(4, `Updating {${this.$CollectionJson.filename}}`);
        this.$CollectionJson.updateSync(content => {
            const json = content.toJSON()

            NablaClient.log(4, `Rewriting {${doc._id}}`);
            json.documents[doc._id] = {
                ...doc,
                ...data,
                _id: doc._id // prevents _id changes
            }

            updatedDoc = json.documents[doc._id]
            return json;
        })

        NablaClient.log(2, `Updated {${Object.keys(data).length}} properties of {${doc._id}} in {${this.path}}`);
        return updatedDoc;
    }

    public async updateMany(where: any, data: any) {
        const docs = await this.getMany(where);
        NablaClient.log(3, `Updating {${docs.length}} documents`)
        const updatedDocs = [];
        for await (const doc of docs) {
            const updatedDoc = await this.updateFirst({
                _id: doc._id
            }, data);
            updatedDocs.push(updatedDoc);
        }
        NablaClient.log(2, `Updated {${docs.length}} documents`, "success")
        return updatedDocs;
    }
    public updateManySync(where: any, data: any) {
        const docs = this.getManySync(where);
        NablaClient.log(3, `Updating {${docs.length}} documents`)
        const updatedDocs = [];
        for (const doc of docs) {
            const updatedDoc = this.updateFirstSync({
                _id: doc._id
            }, data);
            updatedDocs.push(updatedDoc);
        }
        NablaClient.log(2, `Updated {${docs.length}} documents`, "success")
        return updatedDocs;
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
        return this.Db.$CollectionsDir.openFile(`${this.collectionName}.json`, { autoCreate: false });
    }

    public get Db() {
        return this.options.db;
    }

    private get path() {
        return `${this.Db.dbName}.${this.collectionName}`;
    }

}

export default NablaCollection;