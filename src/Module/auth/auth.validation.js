import Joi from 'joi';
import { genderEnume } from '../../common/enums/user.enume.js';
import { generalValidationFaild } from '../../common/validation.js';

export const signup = {
    body: Joi.object({

        firstName: generalValidationFaild.firstName,

        lastName: Joi.string()
            .trim()
            .min(2)
            .max(20)
            .pattern(/^[A-Za-z]+$/)
            .required()
            .messages({
                'string.empty': 'Last name is required',
                'string.pattern.base': 'Last name must contain only letters',
                'string.min': 'Last name must be at least 2 characters',
                'string.max': 'Last name must be at most 20 characters'
            }),

        email: Joi.string()
            .trim()
            .lowercase()
            .email({ tlds: { allow: false } })
            .required()
            .messages({
                'string.email': 'Invalid email format',
                'string.empty': 'Email is required'
            }),

        password: Joi.string()
            .min(8)
            .max(30)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
            .required()
            .messages({
                'string.pattern.base':
                    'Password must contain uppercase, lowercase, number and special character',
                'string.min': 'Password must be at least 8 characters',
                'string.max': 'Password must be at most 30 characters'
            }),

        phone: Joi.string()
            .pattern(/^01[0125][0-9]{8}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid Egyptian phone number',
                'string.empty': 'Phone number is required'
            }),

        gender: Joi.number()
            .valid(...Object.values(genderEnume))
            .required()
            .messages({
                'any.only': 'Invalid gender value'
            }),

        address: Joi.object({
            country: Joi.string().trim().min(2).required(),
            city: Joi.string().trim().min(2).required(),
            street: Joi.string().trim().min(3).required()
        })
            .required()
            .messages({
                'object.base': 'Address must be an object'
            })
    })
};

export const login = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .required(),

    password: Joi.string()
        .min(8)
        .required()
})
    .required()
    .options({ abortEarly: false, allowUnknown: false });

export const confirmEmail = {
    body: Joi.object({
        email: generalValidationFaild.email.required(),
        otp: generalValidationFaild.otp.required()
    })
};


export const resendConfirmEmail = {
    body: Joi.object({
        email: generalValidationFaild.email.required(),
    })
};

export const resetForgetPassword = {
    body: Joi.object({
        email: generalValidationFaild.email.required(),
        password: generalValidationFaild.password.required(),
        confirmationPassword: Joi.string().valid(Joi.ref('password')).required(),
        otp: generalValidationFaild.otp.required()
    })
};