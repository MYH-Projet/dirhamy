import request from 'supertest';
import app from '../../src/app';

export const api = request(app);

export const getCookies = (response: request.Response): string[] => {
    const cookies = response.headers['set-cookie'];
    if (Array.isArray(cookies)) {
        return cookies;
    }
    if (typeof cookies === 'string') {
        return [cookies];
    }
    return [];
};
