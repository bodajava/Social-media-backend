import Joi from "joi";
import { generalValidationFaild } from '../../common/validation.js';
import { fileFaildValifation } from "../../common/utils/index.js";

export const shsareProfile = {
    params: Joi.object().keys({
        userId: generalValidationFaild.id.required()
    }).required()

}

const fileSchema = Joi.object().keys({
    "fieldname": Joi.string().required(),
    "originalname": Joi.string().required(),
    "encoding": Joi.string().required(),
    "mimetype": Joi.string().valid(...fileFaildValifation.image).required(),
    "finalpath": Joi.string().required(),
    "destination": Joi.string().required(),
    "filename": Joi.string().required(),
    "path": Joi.string().required(),
    "size": Joi.number().required(),
}).required()

export const getProfileImage = {
    file: fileSchema
}

export const profileCover = {
    file: fileSchema
}

export const updatePassword = {
    body: Joi.object({
        oldPassword: generalValidationFaild.password.required(),
        password: generalValidationFaild.password.not(Joi.ref("oldPassword")).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    }).required()
}