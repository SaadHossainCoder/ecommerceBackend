export enum apiStatusCode {
    /** The request has succeeded. */
    Success = 200,
    Created = 201,
    Accepted = 202,

    // error codes
    NonAuthoritativeInformation = 203,
    BadRequest = 400,
    Unauthorized = 401,
    NotMatched= 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    Conflict = 409,
    LengthRequired = 411,
    Locked = 423,
    TooManyRequests = 429,
    InternalServerError = 500,
    ServiceUnavailable = 503,
    NotExtended = 510,
}
