import { CoordonneesGps } from '@domain/rucher/value-objects/coordonnees-gps.vo';

describe('CoordonneesGps Value Object', () => {
    describe('create', () => {
        it('should create valid GPS coordinates', () => {
            const coords = CoordonneesGps.create(43.6047, 1.4442);
            expect(coords.latitude).toBe(43.6047);
            expect(coords.longitude).toBe(1.4442);
        });

        it('should accept boundary values (-90, -180)', () => {
            const coords = CoordonneesGps.create(-90, -180);
            expect(coords.latitude).toBe(-90);
            expect(coords.longitude).toBe(-180);
        });

        it('should accept boundary values (90, 180)', () => {
            const coords = CoordonneesGps.create(90, 180);
            expect(coords.latitude).toBe(90);
            expect(coords.longitude).toBe(180);
        });

        it('should accept zero coordinates (0, 0)', () => {
            const coords = CoordonneesGps.create(0, 0);
            expect(coords.latitude).toBe(0);
            expect(coords.longitude).toBe(0);
        });

        it('should throw for latitude below -90', () => {
            expect(() => CoordonneesGps.create(-91, 0)).toThrow(
                'Invalid latitude: -91. Must be between -90 and 90.',
            );
        });

        it('should throw for latitude above 90', () => {
            expect(() => CoordonneesGps.create(91, 0)).toThrow(
                'Invalid latitude: 91. Must be between -90 and 90.',
            );
        });

        it('should throw for longitude below -180', () => {
            expect(() => CoordonneesGps.create(0, -181)).toThrow(
                'Invalid longitude: -181. Must be between -180 and 180.',
            );
        });

        it('should throw for longitude above 180', () => {
            expect(() => CoordonneesGps.create(0, 181)).toThrow(
                'Invalid longitude: 181. Must be between -180 and 180.',
            );
        });
    });

    describe('equals', () => {
        it('should return true for identical coordinates', () => {
            const c1 = CoordonneesGps.create(43.6047, 1.4442);
            const c2 = CoordonneesGps.create(43.6047, 1.4442);
            expect(c1.equals(c2)).toBe(true);
        });

        it('should return false for different coordinates', () => {
            const c1 = CoordonneesGps.create(43.6047, 1.4442);
            const c2 = CoordonneesGps.create(48.8566, 2.3522);
            expect(c1.equals(c2)).toBe(false);
        });
    });
});
