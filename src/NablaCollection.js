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
    insert(data) {
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