const mongoose = require('mongoose');

/**
 * Custom validator for express-validator to check if a value is a valid MongoDB ObjectId
 * and if a document with that ID exists in the specified collection.
 *
 * This function is designed to be used within the `.custom()` method of express-validator.
 * It returns a Promise, which is how custom async validators work. If the promise rejects,
 * express-validator treats it as a validation failure.
 *
 * @param {string} id The ID string to validate.
 * @param {string} modelName The name of the Mongoose model (as a string) to check against.
 *                           This must match the name used in `mongoose.model('ModelName', schema)`.
 * @returns {Promise<boolean>} Resolves to `true` if the ID is valid and the document exists.
 *                           Rejects with an Error if the ID format is invalid or the document is not found.
 *
 * @example
 * // In a route file:
 * const { body } = require('express-validator');
 * const { validateObjectId } = require('../middleware/validation');
 *
 * router.post(
 *   '/',
 *   [ body('doctorId').custom(id => validateObjectId(id, 'Doctor')) ], // 'Doctor' is the model name
 *   // ... controller
 * );
 */
const validateObjectId = (id, modelName) => {
    // 1. First, check if the ID has a valid format.
    // This is a quick synchronous check to fail early for malformed IDs.
    if (!mongoose.Types.ObjectId.isValid(id)) {
        // Rejecting the promise signals a validation failure to express-validator.
        return Promise.reject(new Error(`The provided ID for '${modelName}' is not a valid format.`));
    }

    // 2. If the format is valid, check for the document's existence in the database.
    // This is an asynchronous operation.
    return mongoose.model(modelName).findById(id).then(doc => {
        if (!doc) {
            // If the document is null (not found), reject the promise.
            return Promise.reject(new Error(`No ${modelName} found with the ID: ${id}`));
        }
        // If the document is found, resolve the promise. `true` is a conventional success value.
        return true;
    });
};

module.exports = {
    validateObjectId
};