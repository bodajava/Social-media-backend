import { tokenTypeEnum } from "../common/enums/index.js"
import { decodedToken, errorExecution } from "../common/utils/index.js"

/**
 * Middleware to authenticate requests using JWT.
 * Verifies the token provided in the Authorization header.
 * @param {string} tokenType - The expected type of token (Access or Refresh).
 */
export const authentcationMiddleWare = (tokenType = tokenTypeEnum.Access) => {
    return async (req, res, next) => {
        // Check if Authorization header is present
        if (!req?.headers?.authorization) {
            throw new errorExecution({ 
                message: "Authentication required. Please log in to continue.", 
                statusCode: 401 
            })
        }

        // Decode and verify the token
        // If the token is invalid or expired, decodedToken will throw an appropriate error
        const { user, decoded } = await decodedToken({ token: req.headers?.authorization, tokenType })
        
        req.user = user
        req.decoded = decoded
        next()
    }
}

/**
 * Middleware to authorize requests based on user roles.
 * @param {Array} accessRoles - List of roles permitted to access the route.
 */
export const authorization = (accessRoles = []) => {
    return async (req, res, next) => {
        // Check if the authenticated user has one of the required roles
        if (!accessRoles.includes(req.user.role)) {
            throw new errorExecution({ 
                message: "Access denied. You do not have permission to perform this action.", 
                statusCode: 403 
            })
        }
        next()
    }
}