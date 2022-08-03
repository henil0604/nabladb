const NablaClient = require("./NablaClient");

const random = require("@helper-modules/random")

class NablaDb {

    constructor (options) {
        NablaClient.log(3, "Constructing NablaDb Instance")

        NablaClient.log(4, "Parsing NablaDb Options");
        this.options = NablaClient.Types.NablaDbOptions.parse(options);

        NablaClient.log(4, `Setting Initial id to null`);
        this.id = null;

        this._init();
    }

    _init() {

        NablaClient.log(3, `Checking if Database Exists`);
        // if database exists, fetch information
        if (this.exists) {
            NablaClient.log(4, `Fetching Required Information`);

            this.id = this.$DbJson.content.json().dbId
        }

        NablaClient.log(3, `Checking to autoCreate options`);
        // Creating database
        if (this.options.autoCreate && this.exists === false) {
            NablaClient.log(3, `Could not find database, creating it`);
            this.create();
        }

    }

    create() {
        NablaClient.log(4, `Checking for existence`);
        if (this.exists) return this;

        NablaClient.log(1, `Creating Database: {${this.dbName}}`);

        NablaClient.log(3, `Generating id for database`);
        // generating random uuid id
        let dbId = random.uuid();

        NablaClient.log(3, `Creating {${this.dbName}.json}`);
        // Creating <db>.json
        this.$DbJson.create();

        NablaClient.log(3, `writing on {${this.dbName}.json} file`);
        // writing to <db>.json file
        this.$DbJson.write({
            dbName: this.dbName,
            createdAt: Date.now(),
            dbId,
            collections: {}
        })

        NablaClient.log(3, `updating {nabla.json} file`);
        // Updating nabla.json
        this.Client.$NablaJson.update(content => {
            NablaClient.log(4, `Reading from {nabla.json}`);
            let json = content.json();
            NablaClient.log(4, `writing new Database information on {nabla.json}`);
            json.dbs[this.dbName] = {
                dbName: this.dbName,
                dbId,
            }
            return json;
        })

        NablaClient.log(3, `Assigning Database Id`);
        // assign databaseId
        this.id = dbId;
        NablaClient.log(2, `Database Created: {${this.dbName}}`, 'success');

        return this;
    }

    delete() {

        NablaClient.log(1, `Deleting Database: {${this.dbName}}`, 'warn');

        NablaClient.log(3, `Deleting {${this.dbName}.json}`, 'warn');
        // deletes <db>.json file
        this.$DbJson.delete();

        NablaClient.log(3, `Deleting Database information from {nabla.json}`, 'warn');
        // delete db info from nabla.json
        this.Client.$NablaJson.update((content) => {
            NablaClient.log(4, `Reading content from {nabla.json}`);
            let json = content.json();
            let db = json.dbs[this.dbName];
            if (db) {
                NablaClient.log(4, `Deleting {${this.dbName}} from {nabla.json}`, 'warn');
                delete json.dbs[this.dbName];
            }
            return json;
        })

        NablaClient.log(3, `Resetting id to null`);
        this.id = null;

        NablaClient.log(2, `Database Deleted: {${this.dbName}}`, 'success')

        return this;
    }

    collection(options) {
        NablaClient.log(4, `Parsing Options`);
        options.db = this;

        options = NablaClient.Types.NablaCollectionOptions.parse(options);

        NablaClient.log(4, `Creating Collection Instance`);
        return new NablaClient.NablaCollection(options);
    }

    get $DbJson() {
        return this.Client.$DbDir.open(`file:${this.dbName}.json`, { autoCreate: false })
    }

    get exists() {

        let condition1 = this.Client.$NablaJson.content.json()?.dbs[this.dbName] === undefined ? false : true;

        let condition2 = this.$DbJson.exists;

        if (condition2 === false && condition1 === true) {
            this.delete();
        }

        return condition1 && condition2;
    }

    get Client() {
        return this.options.client;
    }

    get dbName() {
        return this.options.dbName;
    }

}


module.exports = NablaDb;