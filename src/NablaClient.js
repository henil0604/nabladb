const Filic = require("filic");

const helperModulesLog = require("@helper-modules/log")
helperModulesLog.setDefaultPrefix("[NablaDb]");

class NablaClient {

    constructor (options) {
        this.options = NablaClient.Types.NablaClientOptions.parse(options);
        NablaClient.VERBOSE = this.options.verbose

        this._init();
    }

    _init() {
        NablaClient.log(1, "Initializing")

        NablaClient.log(3, "Checking if nabla.json exists and has content")
        // checks if nabla.json exists and has content, if not add content
        if (this.$NablaJson.exists === false || this.$NablaJson.content === "") {
            NablaClient.log(3, "Adding required content to {nabla.json}")
            this.$NablaJson.write({
                dbs: {},
            });
        }

        NablaClient.log(2, "Creating {nabla.json}")
        // Create nabla.json
        this.$NablaJson.create();


        NablaClient.log(3, "Checking if required properties are in {nabla.json}")
        // check if required properties are there in nabla.json file
        this.$NablaJson.update(content => {
            NablaClient.log(4, "Reading content from {nabla.json}")
            const json = content.json();
            if (!json.dbs) {
                json.dbs = {};
            }
            return json;
        });

        NablaClient.log(2, "Creating db Directory")
        // creates db directory
        this.$DbDir.create();

        NablaClient.log(3, "Iterating Through Databases")
        // Iterating Through Databases
        NablaClient.log(4, "Reading content from {nabla.json}")
        let dbs = this.$NablaJson.content.json().dbs;

        NablaClient.log(3, "Looping through database list")
        for (const dbName in dbs) {
            const db = dbs[dbName];

            NablaClient.log(4, `Opening Database: {${dbName}}`)
            let dbInstance = this.db({
                dbName: dbName,
                autoCreate: false
            })

            NablaClient.log(4, `Checking if {${dbName}.json} exists`)
            if (this.$DbDir.open(`file:${dbName}.json`, { autoCreate: false }).exists === false) {
                NablaClient.log(4, `Deleting {${dbName}}. found it incomplete`)
                dbInstance.delete()
            }
        }

    }

    db(options) {
        NablaClient.log(4, `Adding client to the options`);
        options.client = this;

        NablaClient.log(4, `Parsing Options`);
        options = NablaClient.Types.NablaDbOptions.parse(options);

        NablaClient.log(4, `Creating Database Instance`);
        return new NablaClient.NablaDb(options);
    }


    get $Root() {
        return new Filic(this.options.root)
    }

    get $NablaJson() {
        return this.$Root.open("file:nabla.json", { autoCreate: false });
    }

    get $DbDir() {
        return this.$Root.open("dir:db", { autoCreate: false });
    }

    static get log() {

        const log = (verboseLevel = NablaClient.VERBOSE, ...args) => {

            if (typeof verboseLevel === 'string') {
                return helperModulesLog(verboseLevel, ...args);
            }

            if (NablaClient.VERBOSE === 0) {
                return null;
            }

            if (verboseLevel <= NablaClient.VERBOSE) {
                return helperModulesLog(...args)
            }
            return null;
        }


        return log;
    }

    static VERBOSE = 0;

    static get NablaDb() {
        return require("./NablaDb");
    }

    static get NablaCollection() {
        return require("./NablaCollection");
    }

    static get Types() {
        return require("./Types");
    }

}

module.exports = NablaClient;