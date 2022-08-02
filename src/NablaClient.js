
const { NablaClientOptions } = require("./Types");

const helperModulesLog = require("@helper-modules/log")
helperModulesLog.setDefaultPrefix("[NablaDb]");
let verbose = 0;

class NablaClient {

    constructor (options) {
        this.options = NablaClientOptions.parse(options);
        NablaClient.log.setVerbose(this.options.verbose)

        NablaClient.log(1, "Initializing...")
    }

    db() {

    }

    static get log() {

        const log = (verboseLevel = verbose, ...args) => {

            if (verbose === 0) {
                return null;
            }

            if (verboseLevel <= verbose) {
                return helperModulesLog(...args)
            }
            return null;
        }

        log.setVerbose = (newVerbose) => {
            verbose = newVerbose;
            return verbose;
        }

        return log;
    }

}

module.exports = NablaClient;