import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '5173', 10);
  const isDev = process.env.NODE_ENV !== 'production';

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API routes
  const { apiRouter } = await import('./server/routes.js');
  app.use('/api', apiRouter);

  if (isDev) {
    // Development: Vite dev server as middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('\n  ✦  NOVA AI — Development Server\n');
  } else {
    // Production: serve built files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('\n  ✦  NOVA AI — Production Server\n');
  }

  app.listen(PORT, () => {
    console.log(`  ➜  http://localhost:${PORT}\n`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n  ✖  Port ${PORT} is already in use.\n`);
      console.error(`  Fix: Run the following command to free it:\n`);
      console.error(`    Windows:  netstat -ano | findstr :${PORT}`);
      console.error(`              taskkill /PID <PID> /F\n`);
      console.error(`    Mac/Linux: lsof -i :${PORT}`);
      console.error(`              kill -9 <PID>\n`);
      process.exit(1);
    }
    throw err;
  });
}

start();
