import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
const redisClient:RedisClientType = createClient({
    url: 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
})


try{
    await redisClient.connect();
}catch(e){
    console.log(e)
}

export default redisClient;