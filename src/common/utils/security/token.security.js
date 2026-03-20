import jwt from 'jsonwebtoken';
import { RoleEnum } from '../../enums/user.enume.js';
import { tokenTypeEnum } from '../../enums/security.enum.js';
import { errorExecution, UnauthorizationException } from '../res/error.res.js';
import { userModel, tokenModel } from '../../../db/models/index.js';
import { findOne } from '../../../db/database.repository.js';
import { randomUUID } from 'node:crypto';
import { get, revokeTokenKey } from '../../services/index.js';


export const generateToken = async ({
    payload = {},
    secretKey = process.env.USER_TOKEN_SECRET_KEY,
    options = {}
} = {}) => {
    return jwt.sign(payload, secretKey, options)
}

export const verifyToken = async ({
    token,
    secretKey = process.env.USER_TOKEN_SECRET_KEY
} = {}) => {
    return jwt.verify(token, secretKey)
}


export const getTokenSignature = async ({ role, tokenType = tokenTypeEnum.Access }) => {

    let accessSignature = undefined;
    let refreshAccessSignature = undefined;
    let audience = 'User';

    switch (role) {
        case RoleEnum.Admin:
        case RoleEnum.Hr:
            accessSignature = process.env.SYSTEM_TOKEN_SECRET_KEY || 'bodajava1_ADMIN';
            refreshAccessSignature = process.env.SYSTEM_REFRESH_TOKEN_SECRET_KEY || 'bodajava1_ADMIN_REFRESH';
            audience = 'System';
            break;

        default:
            accessSignature = process.env.USER_TOKEN_SECRET_KEY || 'bodajava1_USER';
            refreshAccessSignature = process.env.USER_REFRESH_TOKEN_SECRET_KEY || 'bodajava1_USER_REFRESH';
            audience = 'User';
            break;
    }

    return { accessSignature, refreshAccessSignature, audience }
}

export const createTokenLogin = async (user, issuer) => {
    const { accessSignature, refreshAccessSignature, audience } = await getTokenSignature({ role: user.role });
    const jwtid = randomUUID()

    const accessExpireIn = process.env.NODE_ENV === 'production'
        ? (parseInt(process.env.ACCESS_EXPIRE_IN_PROD) || 1800)
        : (parseInt(process.env.ACCESS_EXPIRE_IN_DEV) || 18000);

    const refreshExpireIn = process.env.NODE_ENV === 'production'
        ? (parseInt(process.env.REFRESH_EXPIRE_IN_PROD) || 604800)
        : (parseInt(process.env.REFRESH_EXPIRE_IN_DEV) || 31536000);

    const accessToken = await generateToken({
        payload: { sub: user._id },
        secretKey: accessSignature,
        options: {
            ...(issuer ? { issuer } : {}),
            audience: [tokenTypeEnum.Access, audience],
            expiresIn: accessExpireIn,
            jwtid
        }
    });

    const refreshToken = await generateToken({
        payload: { sub: user._id },
        secretKey: refreshAccessSignature,
        options: {
            ...(issuer ? { issuer } : {}),
            audience: [tokenTypeEnum.Refresh, audience],
            expiresIn: refreshExpireIn,
            jwtid
        }
    });

    return { accessToken: `Bearer ${accessToken}`, refreshToken }
}



export const getSignatureLevel = async (audienceType) => {

    let signatureLevel = RoleEnum.User

    switch (audienceType) {
        case 'System':
            signatureLevel = RoleEnum.Admin
            break;

        default:
            signatureLevel = RoleEnum.User
            break;
    }

    return signatureLevel
}

/**
 * Decodes and verifies a JWT, returning the associated user and decoded data.
 * Handles specific JWT errors to provide user-friendly feedback.
 * @param {Object} params - The decryption parameters.
 * @param {string} params.token - The raw JWT string.
 * @param {string} params.tokenType - The expected token type (Access/Refresh).
 */
export const decodedToken = async ({ token, tokenType = tokenTypeEnum.Access } = {}) => {
    const rawToken = token?.replace(/Bearer\s+/gi, '').trim();

    if (!rawToken) {
        throw errorExecution({ message: "Authentication required. Please login.", statusCode: 401 })
    }

    const decoded = jwt.decode(rawToken);

    if (!decoded || !decoded.aud) {
        throw errorExecution({ message: "Invalid session format. Please login again.", statusCode: 401 })
    }

    const aud = Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud];
    const decodedTokenType = aud.length > 1 ? aud[0] : null;
    const audienceType = aud.length > 1 ? aud[1] : aud[0];

    // Validate token type (ensure Access token isn't used as Refresh token, etc.)
    if (decodedTokenType && decodedTokenType !== tokenType) {
        throw errorExecution({
            message: "Authentication error. Please use the correct credentials.",
            statusCode: 401
        })
    }

    const signatureLevel = await getSignatureLevel(audienceType)
    const { accessSignature, refreshAccessSignature } = await getTokenSignature({ role: signatureLevel })
    const secretKey = tokenType === tokenTypeEnum.Refresh ? refreshAccessSignature : accessSignature;

    try {
        const verifiedData = await verifyToken({ token: rawToken, secretKey })
        const user = await findOne({ model: userModel, filter: { _id: verifiedData.sub }, lean: false })

        if (!user) {
            throw new UnauthorizationException({ message: "Account not found. Please register to continue." })
        }

        // Check if token has been explicitly blacklisted (Logout from all/Logout specific)
        const isTokenBlacklisted = await findOne({ model: tokenModel, filter: { jti: decoded.jti } })
        if (isTokenBlacklisted) {
            throw new UnauthorizationException({ message: "Session expired. Please login again." })
        }

        // Check Redis blacklist for single session revocation
        if (decoded.jti && await get(revokeTokenKey({ userId: decoded.sub, jti: decoded.jti }))) {
            throw new UnauthorizationException({ message: "Session expired. Please login again." })
        }

        // Check if credentials (password/email) changed after token was issued
        if (user.changeCredentialTime?.getTime() >= decoded.iat * 1000) {
            throw new UnauthorizationException({ message: "Session invalid due to security changes. Please login again." });
        }

        return { user, decoded };

    } catch (error) {
        // Map technical JWT errors to friendly user messages
        if (error.name === 'TokenExpiredError') {
            throw new UnauthorizationException({ message: "Your session has expired. Please login again to continue." })
        }
        if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizationException({ message: "Invalid session. Please login again." })
        }
        throw error;
    }
}