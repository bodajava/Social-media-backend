import path from 'path';
import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config({ path: path.resolve('config', '.env') });

import { bootstrap } from "./app.bootstrap.js";

bootstrap();
