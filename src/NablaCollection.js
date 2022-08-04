const NablaClient = require("./NablaClient");

const random = require("@helper-modules/random")

class NablaCollection {

    constructor (options) {
        NablaClient.log(3, "Constructing NablaCollection Instance")

        NablaClient.log(4, "Parsing NablaCollection Options");
        this.options = NablaClient.Types.NablaCollectionOptions.parse(options);

        this.id = null;

        this._init();
    }

    _init() {
        NablaClient.log(3, `Checking if Database Exists`);
        // if collection exists, fetch information
        if (this.exists) {
            NablaClient.log(4, `Fetching Required Information`);

            this.id = this.Db.$DbJson.content.json().collections[this.collectionName];
        }

        NablaClient.log(3, `Checking to autoCreate options`);
        // Creating collection
        if (this.options.autoCreate && this.exists === false) {
            NablaClient.log(3, `Could not find collection, creating it`);
            this.create();
        }

    }

    create() {
        NablaClient.log(4, `Checking for existence`);
        if (this.exists) return this;

        NablaClient.log(1, `Creating collection: {${this.collectionName}}`);

        NablaClient.log(3, `Generating id for collection`);
        // generating random uuid id
        let collectionId = random.uuid();

        NablaClient.log(3, `Calling Db.create function`);
        // Creating <db>.json
        this.Db.create();

        NablaClient.log(3, `Updating {${this.Db.dbName}.json} file`);
        // updating <db>.json file
        this.Db.$DbJson.update(content => {
            NablaClient.log(4, `Reading from {${this.Db.dbName}.json}`);
            let json = content.json();

            NablaClient.log(4, `writing new collection information on {${this.Db.dbName}.json}`);
            json.collections[this.collectionName] = {
                collectionName: this.collectionName,
                createdAt: Date.now(),
                collectionId: collectionId,
                documents: {}
            }

            return json;
        })

        NablaClient.log(3, `Assigning Collection Id`);
        // assign collectionId
        this.id = collectionId;

        NablaClient.log(2, `Collection Created: {${this.collectionName}}`, 'success');
        return this;
    }

    delete() {
        NablaClient.log(1, `Deleting Collection: {${this.collectionName}}`, 'warn');

        NablaClient.log(4, `Updating {${this.Db.dbName}.json}`);
        // delete db info from <db>.json
        this.Db.$DbJson.update((content) => {
            NablaClient.log(4, `Reading content from {${this.Db.dbName}.json}`);
            let json = content.json();
            let collection = json.collections[this.collectionName];
            if (collection) {
                NablaClient.log(4, `Deleting {${this.collectionName}} from {${this.Db.dbName}.json}`);
                delete json.collections[this.collectionName];
            }
            return json;
        })

        NablaClient.log(3, `Resetting id to null`);
        this.id = null;

        NablaClient.log(2, `Collection Deleted: {${this.collectionName}}`, 'success');
        return this;
    }

    // Document Methods
    insertOne(data) {
        data = NablaClient.Types.NablaDocument.parse(data);

        data._documentId = random.uuid();

        this.Db.$DbJson.update((content) => {
            let json = content.json();

            let collection = json.collections[this.collectionName]

            let documents = collection.documents

            documents[data._documentId] = {
                ...data,
                _createdAt: Date.now(),
                _modifiedAt: Date.now(),
            }

            return json;
        })

        return data;
    }

    insertMany(data) {
        if (Array.isArray(data) === false) {
            throw new Error("NablaCollection.insertMany expects the first argument to be an array");
        }
        let inserted = [];

        for (let i = 0; i < data.length; i++) {
            let d = data[i];
            d = NablaClient.Types.NablaDocument.parse(d);

            inserted.push(this.insertOne(d));
        }

        return inserted;

    }

    getAll() {
        let documents = this.Db.$DbJson.content.json().collections[this.collectionName].documents;

        let arrayDocuments = [];

        for (const documentId in documents) {
            const document = documents[documentId];
            arrayDocuments.push(document);
        }

        return arrayDocuments;
    }

    getOne(findData) {
        findData = NablaClient.Types.NablaDocument.parse(findData);

        let found = null;

        let documents = this.getAll();

        for (let i = 0; i < documents.length; i++) {
            const document = documents[i];

            for (const findKey in findData) {
                if (Object.hasOwnProperty.call(findData, findKey)) {
                    const value = findData[findKey];

                    if (value === document[findKey]) {
                        found = document;
                        continue;
                    }
                    found = null;
                }

            }

            if (found !== null) {
                break;
            }
        }

        return found;
    }

    getMany(findData) {
        findData = NablaClient.Types.NablaDocument.parse(findData);

        let found = [];

        let documents = this.getAll();

        for (let i = 0; i < documents.length; i++) {
            const document = documents[i];
            let valid = false;

            for (const findKey in findData) {
                if (Object.hasOwnProperty.call(findData, findKey)) {
                    const value = findData[findKey];

                    if (value === document[findKey]) {
                        valid = true;
                        continue;
                    }
                    valid = false;
                }
            }

            if (valid) {
                found.push(document);
            }
        }

        return found;
    }

    updateOne(findData, updateData) {
        findData = NablaClient.Types.NablaDocument.parse(findData);
        updateData = NablaClient.Types.NablaDocument.parse(updateData);

        let found = this.getOne(findData);

        if (found === null) {
            return null;
        }

        let id = found._documentId;

        this.Db.$DbJson.update(content => {
            let json = content.json();

            let collection = json.collections[this.collectionName]
            let documents = collection.documents;

            documents[id] = {
                ...documents[id],
                ...updateData
            }

            return json;
        })

        return this.getOne({
            _documentId: id
        })
    }

    updateMany(findData, updateData) {
        findData = NablaClient.Types.NablaDocument.parse(findData);
        updateData = NablaClient.Types.NablaDocument.parse(updateData);

        let updated = [];

        let documents = this.getMany(findData);

        for (let i = 0; i < documents.length; i++) {
            const document = documents[i];

            let update = this.updateOne({
                _documentId: document._documentId
            }, updateData)

            updated.push(update);
        }

        return updated;
    }

    deleteOne(findData) {
        findData = NablaClient.Types.NablaDocument.parse(findData);
        let deleted = null;

        let found = this.getOne(findData);

        if (found === null) {
            return deleted;
        }

        let id = found._documentId;

        this.Db.$DbJson.update(content => {
            let json = content.json();

            let collection = json.collections[this.collectionName]
            let documents = collection.documents;

            deleted = documents[id];
            delete documents[id];

            return json;
        })

        return deleted;
    }

    deleteMany(findData) {
        findData = NablaClient.Types.NablaDocument.parse(findData);

        let deleted = [];

        let documents = this.getMany(findData);

        for (let i = 0; i < documents.length; i++) {
            const document = documents[i];

            let dl = this.deleteOne({
                _documentId: document._documentId
            })

            deleted.push(dl);
        }

        return deleted;
    }

    get exists() {
        let collection = this.Db.$DbJson.content.json().collections[this.collectionName];
        return collection === undefined ? false : true;
    }

    get Db() {
        return this.options.db;
    }

    get Client() {
        return this.Db.Client;
    }

    get dbName() {
        return this.Db.dbName;
    }

    get collectionName() {
        return this.options.collectionName;
    }

}


module.exports = NablaCollection;