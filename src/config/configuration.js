"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function () {
    var _a, _b, _c, _d, _e;
    return ({
        port: parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '3000', 10),
        database: {
            url: (_b = process.env.DATABASE_URL) !== null && _b !== void 0 ? _b : '',
        },
        jwt: {
            secret: (_c = process.env.JWT_SECRET) !== null && _c !== void 0 ? _c : '',
            accessExpiration: (_d = process.env.JWT_ACCESS_EXPIRATION) !== null && _d !== void 0 ? _d : '15m',
            refreshExpiration: (_e = process.env.JWT_REFRESH_EXPIRATION) !== null && _e !== void 0 ? _e : '7d',
        },
    });
});
