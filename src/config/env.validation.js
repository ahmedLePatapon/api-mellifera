"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
var Joi = require("joi");
exports.envValidationSchema = Joi.object({
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required().messages({
        'string.empty': 'DATABASE_URL is required. Get it from https://console.prisma.io',
        'any.required': 'DATABASE_URL is required. Get it from https://console.prisma.io',
    }),
    JWT_SECRET: Joi.string().required().min(16).messages({
        'string.empty': 'JWT_SECRET is required and must be at least 16 characters',
        'string.min': 'JWT_SECRET must be at least 16 characters long',
        'any.required': 'JWT_SECRET is required',
    }),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
});
