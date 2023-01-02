import { NablaClientOptions } from './types/NablaClient.js'
import * as Path from 'path';
import { DEFAULT_NABLA_DB_ROOT_FOLDER_NAME, DEFAULT_NABLA_JSON_FILE_CONTENTS } from './const.js';
import helperModulesLog from "@helper-modules/log";
import Filic from 'filic';
import NablaDb from './NablaDb.js';
import { NablaDbOptions } from './types/NablaDb.js';

helperModulesLog.setDefaultPrefix("[NablaDb]");

class NablaClient {

    public static VERBOSE = 0;
    public options: NablaClientOptions;

    constructor(options?: NablaClientOptions) {
        this.options = options;

        this._init();
    }

    private _init() {

        // Option Default Filling
        this.options.root = this.options.root || Path.join(process.cwd(), DEFAULT_NABLA_DB_ROOT_FOLDER_NAME)
        this.options.verbose = this.options.verbose ?? 0;
        this.options.autoInit = this.options.autoInit || true;

        // setting verbose level
        NablaClient.VERBOSE = this.options.verbose;

        if (this.options.autoInit) {
            this.init();
        }

    }

    public init() {

        NablaClient.log(1, "Initializing")

        NablaClient.log(3, "Checking if nabla.json exists and has content")
        // checks if nabla.json exists and has content, if not add content
        if (this.$NablaJson.exists === false || this.$NablaJson.readRawSync() === "") {
            NablaClient.log(3, "Creating {nabla.json}")
            this.$NablaJson.createSync();
            NablaClient.log(4, "Adding required content to {nabla.json}")
            this.$NablaJson.writeSync(DEFAULT_NABLA_JSON_FILE_CONTENTS);
        }


        NablaClient.log(3, "Checking if required properties are in {nabla.json}")
        // check if required properties are there in nabla.json file
        this.$NablaJson.updateSync((content) => {
            NablaClient.log(4, "Reading content from {nabla.json}")
            const json = content.toJSON();
            for (const key in DEFAULT_NABLA_JSON_FILE_CONTENTS) {
                if (json[key] === undefined) {
                    json[key] = DEFAULT_NABLA_JSON_FILE_CONTENTS[key];
                }
            }
            return json;
        });


        // creates db directory
        !this.$DbsDir.exists ? NablaClient.log(2, "Creating db Directory") && this.$DbsDir.createSync() : 0;

    }

    public db(dbName: string, options?: NablaDbOptions) {
        if (!options) {
            options = {
                client: this
            };
        }
        options.client = this;
        return new NablaDb(dbName, options)
    }

    get $Root() {
        return Filic.create(this.options.root)
    }
    get $NablaJson() {
        return this.$Root.openFile("nabla.json", { autoCreate: false });
    }
    get $DbsDir() {
        return this.$Root.openDir("dbs", { autoCreate: false });
    }

    public static log(verboseLevel = NablaClient.VERBOSE, ...args) {

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


}

export default NablaClient;