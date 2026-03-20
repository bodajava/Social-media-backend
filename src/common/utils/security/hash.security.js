import * as argon2 from "argon2";
import { genSalt, hash, compare } from "bcrypt"
import { hashApproachEnum } from "../../enums/index.js";


export const generateHash = async ({ plainText, salt = +process.env.SALT_ROUND, approach = hashApproachEnum.bcrypt } = {}) => {
    let hashValue
    switch (approach) {
        case hashApproachEnum.argon2:
            hashValue = await argon2.hash(plainText)
            break;

        default:
            const generatedSalt = await genSalt(salt)
            hashValue = await hash(plainText, generatedSalt)
            break;
    }

    return hashValue

}

export const compareHash = async ({ plainText, cipherText, approach = hashApproachEnum.bcrypt } = {}) => {
    let match = false
    switch (approach) {
        case hashApproachEnum.argon2:
            try {
                match = await argon2.verify(cipherText, plainText)
            } catch (err) {
                match = false
            }
            break;

        default:
            match = await compare(plainText, cipherText)
            break;
    }

    return match

}