import express from 'express';
import { createInterface } from 'readline';
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import pg  from 'pg';

const { Client } = pg;

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY, // Default value.
});

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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

await sleep(3000); //wait 3 seconds

const client = new Client({
  user: POSTGRES_USER,
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  password: POSTGRES_PASSWORD,
  port: 5432,
});

await client.connect(function(err) {
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
  
async function startChat() {
  try {
    const askQuestion = () => {
      rl.question('You: ', async (input) => {
            // Check for exit command
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit' || input.toLowerCase() === 'q') {
              rl.close();
              console.log('Exiting the chat application.');
              return;
            }

            if (input.toLowerCase() === 'prev' || input.toLowerCase() === 'previous' || input.toLowerCase() === 'p') {
              const query = `SELECT question,answer 
                             FROM chat 
                             ORDER BY id desc 
                             LIMIT 1`;

              const result = await client.query(query);
              console.log(`Previous conversation:`);
              console.log(`Question: ${result.rows[0].question}`);
              console.log(`Answer: ${result.rows[0].answer}`);
              return;
          }
            
            try {
              const message = new HumanMessage(input);
              const response = await model.invoke([message]);
              const content = response.content;
              console.log(`Assistant: ${content}`);

              const query = "INSERT INTO chat(question,answer) VALUES ($1,$2)";
              const parameters = [input,content];

              await client.query(query,parameters);
            }
            catch (error) {
              console.error('Error:', error);
              console.log("Assistant: Kekw");
            }
            // Continue the conversation
            askQuestion();
        });
    };
    // Start the conversation loop
    askQuestion();
  } catch (error) {
    console.error('Failed to start chat:', error);
    rl.close();
  }
}

startChat();
//app.listen(PORT, () => {
//  console.log(`BuddyBot listening on port ${PORT}`)
//})