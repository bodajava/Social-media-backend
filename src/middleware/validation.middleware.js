import { BadRequestError } from '../common/utils/index.js';

export const validation = (schema) => {
    return (req, res, next) => {
        const errors = [];

        if (schema.validate && typeof schema.validate === 'function') {
            const { error: validationError } = schema.validate(req.body, { abortEarly: false });
            if (validationError) {
                errors.push(...validationError.details.map(details =>{
                    return {details:details.message , path:details.path}
                }));
            }
        } else {
            const keys = Object.keys(schema);
            for (const key of keys) {
                if (schema[key] && typeof schema[key].validate === 'function') {
                    const dataToValidate = req[key] || {};
                    const { error: validationError } = schema[key].validate(dataToValidate, { abortEarly: false });
                    if (validationError) {
                        errors.push(...validationError.details.map(detail => detail.message));
                    }
                }
            }
        }

        if (errors.length > 0) {
            throw BadRequestError({ message: "Validation Error", extra: errors });
        }

        next();
    };
};
