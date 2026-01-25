import { describe, it, expect } from 'vitest';
import { api } from '../helpers/request';

describe('Healthcheck Integration', () => {
    it('GET / should return database connection status', async () => {
        const response = await api.get('/');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Database is connected!",
            status: "OK"
        });
    });
});
