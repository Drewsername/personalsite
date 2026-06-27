import express from 'express';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 8080;

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const index = path.join(dist, 'index.html');

const app = express();

app.use(express.static(dist));

app.get(/.*/, (req, res, next) => {
  if (!existsSync(index)) return next();
  createReadStream(index).pipe(res.type('html'));
});

app.listen(PORT, () => {
  console.log(`drewbermudez.com server listening on ${PORT}`);
});
