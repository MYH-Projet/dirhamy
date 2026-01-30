import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateToken } from '../../src/Middleware/authMiddleware';
import jwt from 'jsonwebtoken';
import { prisma } from '../../src/lib/prisma';

// Mock dependencies
vi.mock('jsonwebtoken');
vi.mock('../../src/lib/prisma', () => ({
    prisma: {
        utilisateur: {
            findUnique: vi.fn(),
            update: vi.fn(),
        }
    }
}));

describe('Auth Middleware Unit Tests', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        req = {
            cookies: {},
            user: undefined
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            cookie: vi.fn(),
            clearCookie: vi.fn()
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    it('should call next() if valid jwt provided', async () => {
        req.cookies.jwt = 'valid_token';
        (jwt.verify as any).mockReturnValue({ id: 1, email: 'test@example.com' });

        await authenticateToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(1);
    });

    it('should return 401 if jwt invalid and no refresh token', async () => {
        req.cookies.jwt = 'invalid_token';
        (jwt.verify as any).mockImplementationOnce(() => { throw new Error('Invalid') });
        req.cookies.refreshToken = undefined;

        await authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'No refresh token provided' }));
    });

    it('should return 403 if refresh token is also invalid', async () => {
        req.cookies.jwt = 'invalid';
        req.cookies.refreshToken = 'invalid_refresh';
        
        // First verify fails
        (jwt.verify as any).mockImplementationOnce(() => { throw new Error('Invalid access') });
        // Second verify (refresh) fails
        (jwt.verify as any).mockImplementationOnce(() => { throw new Error('Invalid refresh') });

        await authenticateToken(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
