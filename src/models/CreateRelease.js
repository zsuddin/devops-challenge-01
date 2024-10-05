const validator = require('validator');

class CreateRelease {
    constructor({ name, version, account, region }) {
        // Validate that all fields are provided
        if (!name || !version || !account || !region) {
            throw new Error('All fields are required: name, version, account, region.');
        }

        // Validate input values
        this.name = this.validateAndSanitizeName(name);
        this.version = this.validateAndSanitizeVersion(version);
        this.account = this.validateAndSanitizeAccount(account);
        this.region = this.validateAndSanitizeRegion(region);
    }

    validateAndSanitizeName(name) {
        const sanitized = validator.escape(name);
        return sanitized;
    }

    validateAndSanitizeVersion(version) {
        const sanitized = validator.escape(version);
        if (!validator.isSemVer(sanitized)) {
            throw new Error('Invalid version. Must follow semantic versioning.');
        }
        return sanitized;
    }

    validateAndSanitizeAccount(account) {
        const sanitized = validator.escape(account);
        const validAccounts = ["staging","prod_one","prod_two","prod_three","prod_three","prod_four","prod_five"];
        if (!validAccounts.includes(sanitized)) {
            throw new Error(`Invalid account. Must be one of ${validAccounts.toString()}`);
        }
        return sanitized;
    }

    validateAndSanitizeRegion(region) {
        const sanitized = validator.escape(region);
        const validRegions = ["primary","secondary"];
        if (!validRegions.includes(sanitized)) {
            throw new Error(`Invalid region. Must be one of ${validRegions.toString()}`);
        }
        return sanitized;
    }
}

module.exports = CreateRelease;