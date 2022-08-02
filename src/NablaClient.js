
const { NablaClientOptions } = require("./Types");

const helperModulesLog = require("@helper-modules/log")
helperModulesLog.setDefaultPrefix("[NablaDb]");

class NablaClient {

    constructor (options) {
        this.options = NablaClientOptions.parse(options);
        NablaClient.VERBOSE = this.options.verbose

        NablaClient.log(1, "Initializing...")
    }

    db() {

    }

    static get log() {

        const log = (verboseLevel = verbose, ...args) => {

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

}

module.exports = NablaClient;