const { Client } = require('pg');

const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD=process.env.POSTGRES_PASSWORD || 'password';
const POSTGRES_HOST=process.env.POSTGRES_HOST || 'db';
const POSTGRES_DB=process.env.POSTGRES_DB || 'postgres';

console.log(`Username : ${POSTGRES_USER}`);
console.log(`Password : ${POSTGRES_PASSWORD}`);
console.log(`Hostname : ${POSTGRES_HOST}`);
console.log(`Database : ${POSTGRES_DB}`);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const client = new Client({
  user: POSTGRES_USER,
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  password: POSTGRES_PASSWORD,
  port: 5432,
});

client.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});