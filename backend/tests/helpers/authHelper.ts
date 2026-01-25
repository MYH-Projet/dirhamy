import { api, getCookies } from './request';
import { createTestUser } from './factories';
import jwt from 'jsonwebtoken';

export const registerAndLogin = async (userOverrides: any = {}) => {
    const password = userOverrides.motDePasse || 'password123';
    const user = await createTestUser({ ...userOverrides, motDePasse: password });

    // Use the real API to login, which verifies bcrypt hash and sets cookies
    const loginRes = await api
        .post('/auth/login')
        .send({
            mail: user.email,
            password: password
        });

    if (loginRes.status !== 201) {
        throw new Error(`Failed to login in test helper: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`);
    }

    const cookies = getCookies(loginRes);

    return { user, cookies };
};
