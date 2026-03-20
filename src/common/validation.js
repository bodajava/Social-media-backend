import Joi from "joi"
import { Types } from "mongoose"

import { genderEnume } from './enums/user.enume.js';

export const generalValidationFaild = {
    id: Joi.string().custom((values, helpers) => {
        return Types.ObjectId.isValid(values) ? true : helpers.message("Invalid ID format.")
    }),

    firstName: Joi.string().trim().min(2).max(20).pattern(/^[A-Za-z]+$/).required().messages({
        'string.empty': 'First name is required',
        'string.pattern.base': 'First name must contain only letters',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name must be at most 20 characters'
    }),

    lastName: Joi.string().trim().min(2).max(20).pattern(/^[A-Za-z]+$/).required().messages({
        'string.empty': 'Last name is required',
        'string.pattern.base': 'Last name must contain only letters',
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name must be at most 20 characters'
    }),

    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required().messages({
        'string.email': 'Invalid email format',
        'string.empty': 'Email is required'
    }),

    password: Joi.string().min(8).max(30).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).required().messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password must be at most 30 characters'
    }),

    phone: Joi.string().pattern(/^01[0125][0-9]{8}$/).required().messages({
        'string.pattern.base': 'Invalid Egyptian phone number',
        'string.empty': 'Phone number is required'
    }),

    gender: Joi.number().valid(...Object.values(genderEnume)).required().messages({
        'any.only': 'Invalid gender value'
    }),

    address: Joi.object({
        country: Joi.string().trim().min(2).required(),
        city: Joi.string().trim().min(2).required(),
        street: Joi.string().trim().min(3).required()
    }).required().messages({
        'object.base': 'Address must be an object'
    }),

    profileImage: Joi.string().required().messages({
        'string.empty': 'Profile image is required'
    }),

    otp: Joi.number()
        .integer()
        .required(),

    file: (validation = []) => Joi.object({
        size: Joi.number().max(10 * 1024 * 1024).required(),
        path: Joi.string().required(),
        filename: Joi.string().required(),
        destination: Joi.string().required(),
        mimetype: Joi.string().valid(...validation).required(),
        encoding: Joi.string().required(),
        originalname: Joi.string().required(),
        fieldname: Joi.string().required(),
        finalpath: Joi.string().required(),
    })
}


