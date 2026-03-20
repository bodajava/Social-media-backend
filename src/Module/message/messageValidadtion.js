import Joi from 'joi';
import { generalValidationFaild } from '../../common/validation.js';
import { fileFaildValifation } from '../../common/utils/index.js';

export const sendMessage = {
    params: Joi.object().keys({
        receiverId: generalValidationFaild.id.required(),
    }).required(),

    body: Joi.object().keys({
        content: Joi.string().min(2).max(10000),
    }),
    files: Joi.array().items(generalValidationFaild.file(fileFaildValifation.image)).min(1).max(2)
}



export const getMessage = {
    params: Joi.object().keys({
        messageId: generalValidationFaild.id.required(),
    }).required(),


}
