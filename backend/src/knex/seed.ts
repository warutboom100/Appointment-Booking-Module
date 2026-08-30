import { db } from './db';

await db.seed.run();
console.log('seed done');
await db.destroy();
