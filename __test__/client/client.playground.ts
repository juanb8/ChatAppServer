import { Client } from './client';

console.log("trying to connect to server");

const client = new Client('0000');
client.sendMessageToGeneral('Hola, general!');

