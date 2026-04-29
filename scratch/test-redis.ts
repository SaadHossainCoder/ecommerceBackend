// import { createClient } from 'redis';
// import dotenv from 'dotenv';
// dotenv.config();

// const client = createClient({
//     username: process.env.REDIS_USERNAME,
//     password: process.env.REDIS_PASSWORD,
//     socket: {
//         host: process.env.REDIS_HOST,
//         port: parseInt(process.env.REDIS_PORT || '6379')
//     }
// });

// client.on('error', err => console.log('Redis Test Error:', err));

// (async () => {
//     try {
//         console.log('Attempting to connect with:', {
//             username: process.env.REDIS_USERNAME,
//             host: process.env.REDIS_HOST,
//             port: process.env.REDIS_PORT
//         });
//         await client.connect();
//         console.log('SUCCESS: Connected to Redis');
//         await client.set('test_key', 'it_works');
//         const val = await client.get('test_key');
//         console.log('TEST GET:', val);
//         await client.disconnect();
//     } catch (e) {
//         console.error('FAILED to connect:', e);
//     }
// })();
