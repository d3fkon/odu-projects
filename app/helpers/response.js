class Response {
    withToken(token) {
        this.token = token;
        return this;
    }
    withData(data) {
        this.data = data;
        return this;
    }
    withError(err) {
        this.success = false;
        this.error = err;
        return this;
    }
    noError() {
        this.success = true;
        return this;
    }

}
const ERR_CODE = {
    ALREADY_REGISTERED: {
        code: 501,
        message: 'Already registered'
    },
    INVALID_CATEGORY: {
        code: 603,
        message: 'Invalid Category'
    },
    VALIDATION_ERR: {
        code: 601,
        message: 'Invalid form entities'
    },
    UNAUTH: {
        code: 602,
        message: 'Invalid token',
        unauthorize: true
    },
    INVALID_USR: {
        code: 701,
        message: 'Invalid username/password. Login again'
    },   
    INVALID_PWD: {
        code: 702,
        message: 'Invalid username/password'
    },
    INVALID_EVE: {
        code: 702,
        message: 'Acharya students/faculty can only register'
    },
    INVALID_EVE1: {
        code: 702,
        message: 'Faculty registration only'
    },
    USER_EXISTS: {
        code: 703,
        message: 'User already exists with this email'
    },
    INVALID_ORG: {
        code: 704,
        message: 'Invalid organizer, contact admin'
    },
    DB_WRITE: {
        code: 801,
        message: 'Error writing to database'
    },
    DB_READ: {
        code: 802,
        message: 'Error reading from database'
    },
    CREATE_EVENT: {
        code: 999,
        message: 'No event under organizer. Create a new event'
    },
    CREATE_WORSHOP: {
        code: 993,
        message: 'No workshop under organizer. Create a new workshop'
    },
    NOTIFICATION_FAILED: {
        code: 401,
        message: 'Notification did not send due to an internal error'
    },
    PICTURES_NOTFOUND:{
        code: 505,
        message: 'No pictures were found in the server'
    },
    EVENT_END: {
        code: 801,
        message: 'Registrations for this event, have closed'
    }
};
module.exports = {
    Response, ERR_CODE
};