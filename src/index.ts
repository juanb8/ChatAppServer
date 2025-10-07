import express from "express";
import type { Request, Response } from 'express';
import { createServer } from 'http';
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Server } from "socket.io";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { MessageService } from "./infraestructure/MessageService.infraestructure";
import { MessageRepositorySqlite } from "./infraestructure/MessageRepository.infraestructure";
// DB implementation
const db: Database = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_offset TEXT UNIQUE,
    content TEXT
    );
  `);

const messageRepository = new MessageRepositorySqlite(db); //TODO: factory for MessageRepositorySqlite

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

const io = new Server(server, {
  connectionStateRecovery: {}
});

const messageService = new MessageService(io, messageRepository); //TODO: factory for MessageService

app.get('/chat', (_req: Request, res: Response) => {
  res.sendFile(__dirname + '/frontEnd/index.html');
});

await messageService.exec();

server.listen(3000, () => {
  console.log('Listening on Port: 3000');
})
