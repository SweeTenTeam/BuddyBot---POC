import { createInterface } from 'readline';
import { PostgresClient } from './postgres-client.mjs';
import { LangchainChatService } from './langchainchat.mjs';
import { VectorStoreService } from './vectorStoreService.mjs';
import { GithubCilent } from './github-api.mjs';
import { JiraClient } from './jira-api.mjs'; // Importa il JiraClient
import { logger } from './logger.mjs';
import { ConfluenceClient } from './conf-api.mjs';

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
const confluenceClient = new ConfluenceClient();

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
            console.log('Exiting the chat application.');
            rl.close();
            await PGClient.close();
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
          const issueId0 = '10001';
          try {
              await testFetchIssueFromJiraAndAdd(issueId0);
              console.log(`Jira issue ${issueId0} has been fetched and indexed successfully.`);
          } catch (error) {
              logger.error(`Error fetching and indexing Jira issue: ${error.message}`);
          }
          break;
//CONF
        case 'fetchconf':
          const pageId = '13369471';
          try {
            await testFetchPageFromConfluenceAndAdd(pageId);
            console.log(`Confluence document with id ${pageId} has been fetched and indexed successfully.`);
          } catch (error) {
            logger.error(`Error fetching and indexing Jira issue: ${error.message}`);
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
    // Recupera i dettagli dell'issue
    const issue = await jiraClient.getIssue(issueId);
    console.log(issue)
    // Prepara il documento per l'indicizzazione
    const document = {
        pageContent: `Issue ID: ${issue.id}\nIssue Key: ${issue.key}\nSummary: ${issue.summary}\nDescription: ${issue.description}\nStatus: ${issue.status}\nProject: ${issue.project}`,
        metadata: { key: issue.key, project: issue.project },
    };

    // Aggiungi il documento al Vector Store
    await vectorStoreService.addDocuments([document]);
    logger.info(`Issue ${issueId} indexed successfully.`);
  } catch (error) {
      logger.error(`Error fetching Jira issue ${issueId} and/or adding to the vector store: ${error.message}`);
      throw error;
  }
}

async function testFetchPageFromConfluenceAndAdd(pageId) {
  try {
    // Recupera i dettagli della pagina
    const page = await confluenceClient.getPage(pageId);
    console.log(page);

    // Prepara il documento per l'indicizzazione
    const document = {
        pageContent: `Title: ${page.title}\nContent: ${page.content}`,
        metadata: { id: page.id, title: page.title },
    };
    console.log(document)
    // Aggiungi il documento al Vector Store
    await vectorStoreService.addDocuments([document]);
    logger.info(`Page ${pageId} indexed successfully.`);
  } catch (error) {
      logger.error(`Error indexing page ${pageId}: ${error.message}`);
      throw error;
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


