import { Email } from '@domain/user/value-objects/email.vo';

describe('Email Value Object', () => {
    describe('create', () => {
        it('should create a valid Email from a valid email string', () => {
            const email = Email.create('Test@Example.COM');
            expect(email.toString()).toBe('test@example.com');
        });

        it('should normalize email to lowercase and trim whitespace', () => {
            const email = Email.create('  User@Domain.FR  ');
            expect(email.toString()).toBe('user@domain.fr');
        });

        it('should throw an error for an empty string', () => {
            expect(() => Email.create('')).toThrow('Email cannot be empty');
        });

        it('should throw an error for whitespace-only string', () => {
            expect(() => Email.create('   ')).toThrow('Email cannot be empty');
        });

        it('should throw an error for an email without @', () => {
            expect(() => Email.create('invalidemail')).toThrow('Invalid email format');
        });

        it('should throw an error for an email without domain', () => {
            expect(() => Email.create('user@')).toThrow('Invalid email format');
        });

        it('should throw an error for an email without local part', () => {
            expect(() => Email.create('@domain.com')).toThrow('Invalid email format');
        });

        it('should throw an error for an email without TLD', () => {
            expect(() => Email.create('user@domain')).toThrow('Invalid email format');
        });
    });

    describe('equals', () => {
        it('should return true for two emails with the same value', () => {
            const email1 = Email.create('user@example.com');
            const email2 = Email.create('USER@EXAMPLE.COM');
            expect(email1.equals(email2)).toBe(true);
        });

        it('should return false for two different emails', () => {
            const email1 = Email.create('user1@example.com');
            const email2 = Email.create('user2@example.com');
            expect(email1.equals(email2)).toBe(false);
        });
    });

    describe('toString', () => {
        it('should return the normalized email string', () => {
            const email = Email.create('Apiculteur@Rucher.FR');
            expect(email.toString()).toBe('apiculteur@rucher.fr');
        });
    });
});
