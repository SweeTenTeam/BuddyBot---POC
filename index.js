const { Client } = require('pg');
const express = require('express')

const app = express();
const PORT = 3000;

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

app.get('/', (req, res) => {
    res.send('Placeholder response');
})

app.get('/api/v1/query', async (req,res) => {
    const query = "SELECT * FROM chat WHERE id=$1";
    const id = [req.query.id];

    const result = await client.query(query,id);
    if(result.rowCount > 0){
        console.log(result.rows[0]);
        res.json(result.rows[0]);
    } else {
        res.json({'Error':'ID not found'});
    }
})
  
app.listen(PORT, () => {
  console.log(`BuddyBot listening on port ${PORT}`)
})