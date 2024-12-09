import express from 'express';
import { createInterface } from 'readline';
import PostgresClient from './postgres-client.mjs';
import  LangchainChatService from './langchainchat.mjs';
import { QdrantVectorStore } from "@langchain/qdrant";
import { NomicEmbeddings } from '@langchain/nomic';
import {VectorStoreService} from './vectorStoreService.mjs'
import { Document } from '@langchain/core/documents';
import { logger } from './logger.mjs';

const app = express();
const PORT = 3000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

await sleep(3000); //wait 3 seconds for qdrant connection

const PGClient = new PostgresClient();
const connection = await PGClient.connect();
if(connection == 0){
  console.log("Connected!");
}


const vectorStoreService = new VectorStoreService();
await vectorStoreService.initializeVectorStore();
const LangchainChat = new LangchainChatService(vectorStoreService);

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
        const command = input.toLowerCase(); // Normalize the input for case-insensitive comparison
        
        switch (command) {
          case 'exit':
          case 'quit':
          case 'q':
            rl.close();
            console.log('Exiting the chat application.');
            return;

          case 'prev':
          case 'previous':
          case 'p':
            try {
              const result = await PGClient.getLastChat();
              console.log('Last conversation:');
              console.log(`Question: ${result.question}`);
              console.log(`Answer: ${result.answer}`);
            } catch (error) {
              console.error('Error fetching last conversation:', error);
            }
            break;

          case 'add':
            console.log('ADDING TEST DOCUMENTS');
            try {
              await testAddDocuments();
            } catch (error) {
              console.error('Error adding test documents:', error);
            }
            break;

          case 'sim':
            console.log('Similarity search test');
            try {
              await testSimilaritySearch();
            } catch (error) {
              console.error('Error performing similarity search:', error);
            }
            break;

          case 'size':
            console.log('Vector store size test');
            try {
              await testNumPointVectorDB();
            } catch (error) {
              console.error('Error fetching vector store size:', error);
            }
            break;

          default:
            try {
              const result = await LangchainChat.processInput(input);
              await PGClient.insertChat(input, result);
              console.log(`Assistant: ${result}`);
            } catch (error) {
              console.error('Error:', error);
              console.log('Assistant: Kekw');
            }
        }

        // Continue the conversation
        askQuestion();
      });
    };

    askQuestion();
  } catch (error) {
    console.error('Error starting chat:', error);
  }
}


async function testAddDocuments(){
    const documents = []

    documents.push({pageContent:"UnitedHealthcare CEO Brian Thompson was shot and killed outside a Manhattan hotel on Wednesday.",
      metadata:{}})
    documents.push({pageContent:"French Prime Minister Michel Barnier on Thursday arrived at the Elysee Palace to submit his resignation.",
      metadata:{}})
    documents.push({pageContent:"LangChain is an open-source framework designed to facilitate the integration of large language models (LLMs) into applications. Launched in October 2022 by Harrison Chase, LangChain aims to streamline the development of generative AI applications by providing tools and abstractions that allow developers to connect LLMs with various external data sources and components.",
       metadata:{}})

     await vectorStoreService.addDocuments(documents);
      logger.info("Test finished")  
  }

  async function testSimilaritySearch(){
    const query = "What is langchain?"
    vectorStoreService.similaritySearch(query, 1);
  }


  async function testNumPointVectorDB(){
    vectorStoreService.getCollectionSize();
  }


startChat();
//app.listen(PORT, () => {
//  console.log(`BuddyBot listening on port ${PORT}`)
//})