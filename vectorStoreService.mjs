import { QdrantVectorStore } from "@langchain/qdrant";
import { NomicEmbeddings } from "@langchain/nomic";
import { Document } from "@langchain/core/documents";
import { logger } from "./logger.mjs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantClient } from "@qdrant/js-client-rest"; // Import the Qdrant REST client




export class VectorStoreService{
    qdrantVectorStore;
    qdrantClient;//used only for testing
    constructor(){
    }

    //todo: move connection of qdrant outside the class to resolve dependecy
    async initializeVectorStore() {
        try {
            const embeddings = new NomicEmbeddings();
            // Initialize the QdrantVectorStore from an existing collection
            this.qdrantVectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
                url: process.env.QDRANT_URL || "http://vectorial_db:6333",
                collectionName: "buddybot-vector-store",
            });

            this.qdrantClient = new QdrantClient({
                url: process.env.QDRANT_URL || "http://vectorial_db:6333",
            });

            logger.info("Successfully connected to Qdrant vector store.");
        }
        catch (error) {
            logger.error("Error initializing Qdrant vector store: " + error);
            throw error;
        }
    }


    async splitDocuments(documents) {
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 0 });
        const splitDocs = await textSplitter.createDocuments(documents.map(doc => doc.pageContent));
        logger.info(`Documents split into ${splitDocs.length} chunks.`);
        return splitDocs;
    }
    
    async addDocuments(documents){
        try {

            const splitDocs = await this.splitDocuments(documents);

            await this.qdrantVectorStore.addDocuments(splitDocs);
            logger.info("Documents added successfully to vector store.");
        }
        catch (error) {
            logger.error("Error adding documents to vector store: " + error);
            throw error;
        }
    }

    async similaritySearch(query, k = 2) {
        try {
            logger.info(`Calling similaritySearch with query: ${query}, k: ${k}`);
            const retr = this.qdrantVectorStore.asRetriever(k);
            // Perform search with the retriever
            const results = await retr.invoke(query);
            logger.info(`Similarity search results: ${JSON.stringify(results)}`);
            return results;
        }
        catch (error) {
            logger.error("Error performing similarity search: " + error);
            throw error;
        }
    }

    
    
//used only for testing
    async getCollectionSize() {
        try {
            const collectionName = this.qdrantVectorStore.collectionName;
    
            // Retrieve collection details
            const collectionInfo = await this.qdrantClient.getCollection(collectionName);
            logger.info(`Collection info response: ${JSON.stringify(collectionInfo, null, 2)}`);

            // Extract the number of vectors (points)
            const numPoints = collectionInfo?.points_count || 0; // Adjust key as per the logged structure

            logger.info(`Collection "${collectionName}" contains ${numPoints} points.`);
            
            return numPoints;
        } catch (error) {
            logger.error(`Error retrieving collection size: ${error.message}`);
            throw error;
        }
    }
    


}