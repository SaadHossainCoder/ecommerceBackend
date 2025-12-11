export enum apiStatusCode {
    /** The request has succeeded. */
    Success = 200,
    Created = 201,
    Accepted = 202,

    // error codes
    BadRequest = 400,
    Unauthorized = 401,
    NotMatched= 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    GlobalError = 500,
    ServiceUnavailable = 503
}
