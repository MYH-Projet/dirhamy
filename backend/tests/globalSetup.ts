import { startContainer, stopTestDb } from './helpers/testDb';
import fs from 'fs';
import path from 'path';

export const setup = async () => {
    console.log('Global Setup: Starting Test Database...');
    const databaseUrl = await startContainer();
    console.log('Global Setup: Test Database Started at', databaseUrl);

    // Write URL to a temp file so test threads can read it
    const envFile = path.resolve(__dirname, 'test-env.json');
    fs.writeFileSync(envFile, JSON.stringify({ DATABASE_URL: databaseUrl }));

    return async () => {
        console.log('Global Setup: Stopping Test Database...');
        await stopTestDb();
        if (fs.existsSync(envFile)) {
            fs.unlinkSync(envFile);
        }
    };
};
