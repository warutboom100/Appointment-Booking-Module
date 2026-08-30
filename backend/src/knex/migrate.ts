// รัน migration ผ่าน tsx (เลี่ยง knex CLI + ESM/TS loader)
import { db } from './db';

const [batch, applied] = await db.migrate.latest();
console.log(applied.length ? `batch ${batch}: ${applied.join(', ')}` : 'already up to date');
await db.destroy();
