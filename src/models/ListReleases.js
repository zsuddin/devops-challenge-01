const validator = require('validator');

class ListReleases {
    constructor({ limit = 10, offset = 0 }) {
        this.limit = parseInt(limit, 10);
        this.offset = parseInt(offset, 10);
        this.limit = this.sanitizeLimit(limit);
        this.offset = this.sanitizeOffset(offset);
    }

    sanitizeLimit(limit) {
        const sanitizedLimit = validator.toInt(validator.trim(String(limit)), 10);
        return sanitizedLimit >= 0 ? sanitizedLimit : 10;
    }

    sanitizeOffset(offset) {
        const sanitizedOffset = validator.toInt(validator.trim(String(offset)), 10);
        return sanitizedOffset >= 0 ? sanitizedOffset : 0;
    }
}