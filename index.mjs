import express from 'express';
import { createInterface } from 'readline';
import PostgresClient from './postgres-client.mjs';
import  LangchainChatService from './langchainchat.mjs';

const app = express();
const PORT = 3000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

//await sleep(3000); //wait 3 seconds

const PGClient = new PostgresClient();
const connection = await PGClient.connect();
if(connection == 0){
  console.log("Connected!");
}

const LangchainChat = new LangchainChatService();

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
              const result = await PGClient.getLastChat();
              console.log(`Last conversation:`);
              console.log(`Question ${result.question}`);
              console.log(`Answer: ${result.answer}`);
              return;
            }
            
            try {
              const result = await LangchainChat.processInput(input);
              await PGClient.insertChat(input,result);
              console.log(`Assistant: ${result}`);
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