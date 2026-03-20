import multer from 'multer';


export const globalErrorHandler = (error, req, res, next) => {
    let status = error.cause?.statusCode ?? error.statusCode ?? 500

    if (error instanceof multer.MulterError) {
        status = 400
    }

    return res.status(status).json({
        error_message: error.message ?? 'An unexpected error occurred. Please try again later.',
        errors: error.cause?.extra,
        stack: process.env.NODE_ENV == "development" ? error.stack : undefined
    })
}

export function errorExecution({ message = "something went wrong", statusCode = 500, stack = undefined, extra = undefined } = {}) {
    const error = new Error(message);
    error.cause = { statusCode, stack, extra };
    return error;
}
export function BadRequestError({ message = "Bad Request", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 400, extra });
}

export function UnauthorizationException({ message = "Unauthorized", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 401, extra });
}

export function PaymentRequiredError({ message = "Payment Required", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 402, extra });
}

export function ForbiddenError({ message = "Forbidden", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 403, extra });
}

export function NotFoundError({ message = "Resource Not Found", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 404, extra });
}

export function MethodNotAllowedError({ message = "Method Not Allowed", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 405, extra });
}

export function NotAcceptableError({ message = "Not Acceptable", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 406, extra });
}

export function ProxyAuthenticationRequiredError({ message = "Proxy Authentication Required", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 407, extra });
}

export function RequestTimeoutError({ message = "Request Timeout", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 408, extra });
}

export function ConflictError({ message = "Conflict", extra = undefined } = {}) {
    return errorExecution({ message, statusCode: 409, extra });
}