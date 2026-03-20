/**
 * Generic Database Repository - Providing abstracted helper functions for Mongoose models.
 */

/**
 * Finds multiple documents based on filter.
 * @param {Object} params - model, filter, select, populate, lean, options.
 */
export const find = async ({
    model,
    filter = {},
    select = undefined,
    populate = [],
    lean = true,
    options = {}
} = {}) => {
    let query = model.find(filter, null, options).select(select);
    if (populate.length) query = query.populate(populate);
    if (lean) query = query.lean();
    return await query;
};

/**
 * Finds a single document based on filter.
 */
export const findOne = async ({
    model,
    filter = {},
    select = undefined,
    populate = [],
    lean = true,
    options = {}
} = {}) => {
    let query = model.findOne(filter, null, options).select(select);
    if (populate.length) query = query.populate(populate);
    if (lean) query = query.lean();
    return await query;
};

/**
 * Finds a single document by its ID.
 */
export const findById = async ({
    model,
    id,
    select = undefined,
    populate = [],
    lean = true,
    options = {}
} = {}) => {
    let query = model.findById(id, null, options).select(select);
    if (populate.length) query = query.populate(populate);
    if (lean) query = query.lean();
    return await query;
};

/**
 * Creates a new document using model.create().
 */
export const create = async ({
    model,
    data = {},
    options = { validateBeforeSave: true }
} = {}) => {
    return await model.create(data, options);
};

/**
 * Creates a single document.
 */
export const createOne = async ({
    model,
    data = {},
} = {}) => {
    return await model.create(data);
};

/**
 * Finds a document by filter and updates it.
 */
export const findOneAndUpdate = async ({
    model,
    filter = {},
    data = {},
    options = { new: true, runValidators: true },
    select = undefined,
    populate = [],
    lean = true
} = {}) => {
    let query = model.findOneAndUpdate(filter, data, options).select(select);
    if (populate.length) query = query.populate(populate);
    if (lean) query = query.lean();
    return await query;
};

/**
 * Finds a document by ID and updates it.
 */
export const findByIdAndUpdate = async ({
    model,
    id,
    data = {},
    options = { new: true, runValidators: true },
    select = undefined,
    populate = [],
    lean = true
} = {}) => {
    let query = model.findByIdAndUpdate(id, data, options).select(select);
    if (populate.length) query = query.populate(populate);
    if (lean) query = query.lean();
    return await query;
};

/**
 * Finds a document by filter and deletes it.
 */
export const findOneAndDelete = async ({
    model,
    filter = {},
    options = {},
    select = undefined
} = {}) => {
    return await model.findOneAndDelete(filter, options).select(select);
};

/**
 * Finds a document by ID and deletes it.
 */
export const findByIdAndDelete = async ({
    model,
    id,
    options = {},
    select = undefined
} = {}) => {
    return await model.findByIdAndDelete(id, options).select(select);
};

/**
 * Updates a single document.
 */
export const updateOne = async ({
    model,
    filter = {},
    data = {},
    options = {}
} = {}) => {
    return await model.updateOne(filter, data, options);
};

/**
 * Updates multiple documents.
 */
export const updateMany = async ({
    model,
    filter = {},
    data = {},
    options = {}
} = {}) => {
    return await model.updateMany(filter, data, options);
};

/**
 * Deletes multiple documents based on filter.
 */
export const deleteMany = async ({
    model,
    filter = {},
    options = {}
} = {}) => {
    return await model.deleteMany(filter, options);
};
