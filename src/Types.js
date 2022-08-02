const { z } = require("zod");

let Types = {};

Types.NablaClientOptions = z.object({
    verbose: z.number().min(0).max(4).optional().default(0)
}).optional().default({})



module.exports = Types;