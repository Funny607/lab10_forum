import { createClient } from '@vercel/kv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import morgan from 'morgan';
import fetch from 'node-fetch';

import { echo } from './echo';
import errorHandler from './errorHandler';
import { DATABASE_FILE, setData, postCreate, postsList, clear } from './forum';
import { port, url } from './config.json';

// Replace this with your API_URL
// E.g. https://large-poodle-44208.kv.vercel-storage.com
const KV_REST_API_URL="https://aware-hedgehog-38558.upstash.io";
// Replace this with your API_TOKEN
// E.g. AaywASQgOWE4MTVkN2UtODZh...
const KV_REST_API_TOKEN="AZaeAAIjcDFlMDk3ODVkZWQ0YmQ0MWZhOWJlZWYwNWZmZmQwNzYyYnAxMA";

const database = createClient({
  url: KV_REST_API_URL,
  token: KV_REST_API_TOKEN,
});

const PORT: number = parseInt(process.env.PORT || port);
const SERVER_URL = `${url}:${PORT}`;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req: Request, res: Response) => {
  console.log('Print to terminal: someone accessed our root url!');
  res.json({ message: "Welcome to Lab05 Forum Server's root URL!" });
});

app.get('/echo/echo', (req: Request, res: Response) => {
  res.json(echo(req.query.message as string));
});

app.post('/post/create', async (req: Request, res: Response) => {
  const result = await postCreate(req.body.sender, req.body.title, req.body.content);
  console.log(`Post created result: ${JSON.stringify(result)}`); 
  res.json(result);
});

app.get('/posts/list', async (req: Request, res: Response) => {
  const posts = await postsList();
  console.log(`Posts list result: ${JSON.stringify(posts)}`); 
  res.json(posts);
});

app.delete('/clear', async (req: Request, res: Response) => {
  const result = await clear();
  console.log(`Clear result: ${JSON.stringify(result)}`); 
  res.json(result);
});

app.get('/data', async (req: Request, res: Response) => {
  const data = await database.hgetall('data:forum');
  console.log(`Data retrieved from /data: ${JSON.stringify(data)}`); 
  res.status(200).json(data);
});

app.put('/data', async (req: Request, res: Response) => {
  const data = req.body;
  await database.hset("data:forum", data);
  console.log(`Data set in /data: ${JSON.stringify(data)}`); 
  return res.status(200).json({});
});

app.use(errorHandler());

const server = app.listen(PORT, () => {
  // Load existing persistent data before server starts
  if (fs.existsSync(DATABASE_FILE)) {
    setData(JSON.parse(String(fs.readFileSync(DATABASE_FILE))));
  } else {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify({
      posts: [],
      comments: [],
    }));
  }

  console.log(`Server started at the URL: '${SERVER_URL}'`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
