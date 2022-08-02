const NablaClient = require("./NablaClient");


const { z } = require("zod");
const path = require("path");

let Types = {};

Types.NablaClientOptions = z.object({
    verbose: z.number().min(0).max(4).optional().default(0),
    root: z.string()
        .optional()
        .default(
            path.resolve(process.cwd(), ".nabladb")
        )
}).optional().default({});

Types.NablaDbOptions = z.object({
    client: z.instanceof(NablaClient),
    dbName: z.string().regex(/^[a-zA-Z0-9_-]*$/, "Invalid Database Name"),
    autoCreate: z.boolean().optional().default(true),
}).optional().default({});

Types.NablaCollectionOptions = z.object({
    db: z.instanceof(NablaClient.NablaDb),
    collectionName: z.string().regex(/^[a-zA-Z0-9_-]*$/, "Invalid Collection Name"),
    autoCreate: z.boolean().optional().default(true),
}).optional().default({});


module.exports = Types;