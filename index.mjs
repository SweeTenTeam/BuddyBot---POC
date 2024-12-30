import express from 'express';
import { createInterface } from 'readline';
import { PostgresClient } from './postgres-client.mjs';
import { LangchainChatService } from './langchainchat.mjs';
import { VectorStoreService } from './vectorStoreService.mjs';
import { GithubCilent } from './github-api.mjs';
import { JiraClient } from './jira-api.mjs'; // Importa il JiraClient
import { logger } from './logger.mjs';

const app = express();
const PORT = 3000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

logger.info("Waiting for qdrant and postgres initialization...");
await sleep(3000); //wait 3 seconds for qdrant connection

const PGClient = new PostgresClient();
const connection = await PGClient.connect();
if (connection == 0) {
  logger.info("Connected to Postgres!");
}

const vectorStoreService = new VectorStoreService();
await vectorStoreService.initializeVectorStore();
const LangchainChat = new LangchainChatService(vectorStoreService);

const githubClient = new GithubCilent();
const jiraClient = new JiraClient(); // Crea un'istanza di JiraClient

app.get('/', (req, res) => {
  res.send('Placeholder response');
});

app.get('/api/v1/query', async (req, res) => {
  const query = "SELECT * FROM chat WHERE id=$1";
  const id = [req.query.id];

  const result = await PGClient.query(query, id);
  if (result.rowCount > 0) {
    console.log(result.rows[0]);
    res.json(result.rows[0]);
  } else {
    res.json({ 'Error': 'ID not found' });
  }
});

async function startChat() {
  try {
    const askQuestion = () => {
      rl.question('You: ', async (input) => {
        const command = input.toLowerCase(); // Normalize the input for case-insensitive comparison
        command.trim();
        switch (command) {
          case '':
          case 'exit':
          case 'quit':
          case 'q':
            rl.close();
            await PGClient.close();
            console.log('Exiting the chat application.');
            process.exit();

          case 'prev':
          case 'previous':
          case 'p':
            try {
              const result = await PGClient.getLastChat();
              console.log('Last conversation:');
              console.log(`Question: ${result.question}`);
              console.log(`Answer: ${result.answer}`);
            } catch (error) {
              logger.error('Error fetching last conversation:', error);
            }
            break;

          case 'fetch':
            try {
              await testFetchFileFromGithubAndAdd("index.mjs");
            } catch (error) {
              logger.error(`Error fetching file from github and/or adding to the db: ${error}`);
            }
            break;

          case 'add':
            console.log('ADDING TEST DOCUMENTS');
            try {
              await testAddDocuments();
            } catch (error) {
              logger.error(`Error adding test documents: ${error}`);
            }
            break;

          case 'sim':
            console.log('Similarity search test');
            try {
              await testSimilaritySearch();
            } catch (error) {
              logger.error('Error performing similarity search:', error);
            }
            break;

          case 'size':
            console.log('Vector store size test');
            try {
              await testNumPointVectorDB();
            } catch (error) {
              logger.error('Error fetching vector store size:', error);
            }
          break;
//JIRA 
        case 'fetchjira':
          const issueId0 = input.split(' ')[1]; // input -> "fetchJira ISSUE-ID"
          if (!issueId0) {
              console.log('Please provide an issue ID.');
              break;
          }
          try {
              await testFetchIssueFromJiraAndAdd(issueId0);
              console.log(`Jira issue ${issueId0} has been fetched and indexed successfully.`);
          } catch (error) {
              logger.error(`Error fetching and indexing Jira issue: ${error.message}`);
          }
        break;
//CONF
        case 'fetchconf':
          const pageId = input.split(' ')[1]; // Mettebdo "fetchconf PAGE_ID"
          if (!pageId) {
            console.log('Please provide a valid page ID.');
            break;
          }
          try {
            await testFetchPageFromConfluenceAndAdd(pageId);
          } catch (error) {
            logger.error(`Error fetching and adding Confluence page: ${error.message}`);
          }
        break;


          case 'indexJira':
              const issueId1 = input.split(' ')[1];
              try {
                  await jiraClient.indexIssue(issueId1, vectorStoreService);
                  console.log(`Jira issue ${issueId1} has been indexed successfully.`);
              } catch (error) {
                  logger.error(`Error indexing Jira issue: ${error.message}`);
              }
          break;
            
          case 'jira issue':
            const issueId = input.split(' ')[2]; // Assumendo che l'input sia "jira issue ISSUE-123"
            try {
              const issue = await jiraClient.getIssue(issueId);
              console.log('Jira Issue:', issue);
            } catch (error) {
              logger.error('Error fetching Jira issue:', error);
            }
            break;

          case 'jira search':
            const jql = input.split(' ').slice(2).join(' '); // Assumendo che l'input sia "jira search project = MYPROJECT"
            try {
              const issues = await jiraClient.searchIssues(jql);
              console.log('Jira Issues:', issues);
            } catch (error) {
              logger.error('Error searching Jira issues:', error);
            }
            break;

          default:
            try {
              const result = await LangchainChat.processInput(input);
              await PGClient.insertChat(input, result);
              console.log(`Assistant: ${result}`);
            } catch (error) {
              logger.error('Error:', error);
            }
        }

        // Continue the conversation
        askQuestion();
      });
    };

    askQuestion();
  } catch (error) {
    logger.error('Error starting chat:', error);
  }
}

async function testFetchFileFromGithubAndAdd(path) {
  const result = await githubClient.getFileContents(path);
  logger.info(`File contents of ${path}: ${result}`);
  const documents = [];
  documents.push({ pageContent: result, metadata: {} });
  await vectorStoreService.addDocuments(documents);
  logger.info("Test finished");
}

async function testFetchIssueFromJiraAndAdd(issueId) {
  try {
      const issueDocument = await jiraClient.getIssueForIndexing(issueId);
      logger.info(`Jira issue document for ${issueId}: ${JSON.stringify(issueDocument, null, 2)}`);

      await vectorStoreService.addDocuments([issueDocument]);
      logger.info(`Jira issue ${issueId} has been successfully indexed.`);
  } catch (error) {
      logger.error(`Error fetching Jira issue ${issueId} and/or adding to the vector store: ${error.message}`);
  }
}

async function testFetchPageFromConfluenceAndAdd(pageId) {
  try {
    const page = await confluenceClient.getPage(pageId); 
    logger.info(`Page details fetched: ${JSON.stringify(page)}`);
    
    const document = {
      pageContent: `Title: ${page.title}\nContent: ${page.content}`,
      metadata: { id: page.id, title: page.title },
    };

    await vectorStoreService.addDocuments([document]);
    logger.info(`Page ${pageId} added successfully to Vector Store.`);
  } catch (error) {
    logger.error(`Error fetching and indexing page from Confluence: ${error.message}`);
  }
}

async function testAddDocuments() {
  const documents = [];
  documents.push({
    pageContent: "UnitedHealthcare CEO Brian Thompson was shot and killed outside a Manhattan hotel on Wednesday.",
    metadata: {}
  });
  documents.push({
    pageContent: "French Prime Minister Michel Barnier on Thursday arrived at the Elysee Palace to submit his resignation.",
    metadata: {}
  });
  documents.push({
    pageContent: "LangChain is an open-source framework designed to facilitate the integration of large language models (LLMs) into applications. Launched in October 2022 by Harrison Chase, LangChain aims to streamline the development of generative AI applications by providing tools and abstractions that allow developers to connect LLMs with various external data sources and components.",
    metadata: {}
  });

  await vectorStoreService.addDocuments(documents);
  logger.info("Test finished");
}

async function testSimilaritySearch() {
  const query = "What is langchain?";
  const results = await vectorStoreService.similaritySearch(query, 1);
  console.log('Similarity Search Results:', results);
}

async function testNumPointVectorDB() {
  const size = await vectorStoreService.getCollectionSize();
  console.log('Vector Store Size:', size);
}

// Avvia la chat
startChat();

/* BOHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});*/

