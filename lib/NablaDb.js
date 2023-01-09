import NablaClient from './NablaClient.js';
import NablaCollection from './NablaCollection.js';
class NablaDb {
    options;
    dbName;
    constructor(dbName, options) {
        this.dbName = dbName;
        this.options = options;
        this._init();
    }
    _init() {
        // Option Default Filling
        this.options.autoCreate = this.options.autoCreate || true;
        NablaClient.log(3, `Checking to autoCreate options`);
        // Creating database
        if (this.options.autoCreate && this.exists === false) {
            NablaClient.log(3, `Could not find database, creating it`);
            this.create();
        }
    }
    create() {
        NablaClient.log(4, `Checking for existence`);
        if (this.exists) {
            NablaClient.log(1, `Database {${this.dbName}} Already Exists`, 'warn');
            return this;
        }
        NablaClient.log(1, `Creating Database: {${this.dbName}}`);
        NablaClient.log(3, `Creating {${this.$DbJson.filename}}`);
        // Creating <db>.json
        this.$DbJson.createSync();
        NablaClient.log(3, `writing on {${this.$DbJson.filename}}`);
        // writing to <db>.json file
        this.$DbJson.writeSync({
            dbName: this.dbName,
            createdAt: Date.now(),
            collections: {}
        });
        NablaClient.log(3, `updating {nabla.json} file`);
        // Updating nabla.json
        this.Client.$NablaJson.updateSync(content => {
            NablaClient.log(4, `Reading from {nabla.json}`);
            let json = content.toJSON();
            NablaClient.log(4, `writing new Database information on {nabla.json}`);
            json.dbs[this.dbName] = {
                dbName: this.dbName,
            };
            return json;
        });
        NablaClient.log(1, `Database Created: {${this.dbName}}`, 'success');
        return this;
    }
    delete() {
        if (!this.$DbDir.exists) {
            NablaClient.log(1, `Database {${this.dbName}} Does not Exists`, 'warn');
            return this;
        }
        NablaClient.log(1, `Deleting Database: {${this.dbName}}`, 'warn');
        NablaClient.log(3, `Deleting {${this.$DbDir.dirname}}`, 'warn');
        // deletes <db> folder
        this.$DbDir.deleteSelfSync({ recursive: true, force: true });
        NablaClient.log(3, `Deleting Database information from {nabla.json}`, 'warn');
        // delete db info from nabla.json
        this.Client.$NablaJson.update((content) => {
            NablaClient.log(4, `Reading content from {nabla.json}`);
            let json = content.toJSON();
            let db = json.dbs[this.dbName];
            if (db) {
                NablaClient.log(4, `Deleting {${this.dbName}} from {nabla.json}`, 'warn');
                delete json.dbs[this.dbName];
            }
            return json;
        });
        NablaClient.log(1, `Database Deleted: {${this.dbName}}`, 'success');
        return this;
    }
    collection(collectionName, options) {
        if (!options) {
            options = {
                db: this
            };
        }
        options.db = this;
        return new NablaCollection(collectionName, options);
    }
    get exists() {
        let condition1 = this.Client.$NablaJson.readSync().toJSON()?.dbs[this.dbName] === undefined ? false : true;
        let condition2 = this.$DbJson.exists;
        if (condition1 === false && condition2 === true) {
            this.delete();
        }
        return condition1 && condition2;
    }
    get $DbDir() {
        return this.Client.$DbsDir.openDir(`${this.dbName}`, { autoCreate: false });
    }
    get $CollectionsDir() {
        return this.$DbDir.openDir(`collections`, { autoCreate: false });
    }
    get $DbJson() {
        return this.$DbDir.openFile(`${this.dbName}.json`, { autoCreate: false });
    }
    get Client() {
        return this.options.client;
    }
}
export default NablaDb;
