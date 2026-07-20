"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PH_PHONE_REGEX = void 0;
exports.isValidPHPhone = isValidPHPhone;
exports.normalizePhone = normalizePhone;
exports.PH_PHONE_REGEX = /^(09|\+639)\d{9}$/;
function isValidPHPhone(phone) {
    return exports.PH_PHONE_REGEX.test(phone);
}
function normalizePhone(phone) {
    // Strip spaces, dashes, or parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('09') && cleaned.length === 11) {
        return `+639${cleaned.slice(2)}`;
    }
    if (cleaned.startsWith('+639') && cleaned.length === 13) {
        return cleaned;
    }
    return cleaned;
}
//# sourceMappingURL=phone.js.map