const mongoose = require('mongoose');

const validateObjectId = (id, modelName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return Promise.reject(new Error(`The provided ID for '${modelName}' is not a valid format.`));
    }
    return mongoose.model(modelName).findById(id).then(doc => {
        if (!doc) {
            return Promise.reject(new Error(`No ${modelName} found with the ID: ${id}`));
        }
        return true;
    });
};

module.exports = {
    validateObjectId
};
