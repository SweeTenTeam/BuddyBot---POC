import axios from 'axios';
import { logger } from './logger.mjs';

export class ConfluenceClient {
    constructor() {
        this.baseUrl = 'https://sweetenteam.atlassian.net/wiki/rest/api';
        this.auth = {
            username: process.env.JIRA_EMAIL,
            password: process.env.JIRA_API_KEY,
        };
    }

    async getPage(pageId) {
        try {
            const response = await axios.get(`${this.baseUrl}/content/${pageId}`, {
                params: { expand: 'body.storage' },
                auth: this.auth,
            });
            const page = response.data;
            console.log(page)
            return {
                id: page.id,
                title: page.title,
                content: page.body.storage.value,
            };
        } catch (error) {
            logger.error(`Error fetching page ${pageId} from Confluence: ${error.message}`);
            throw error;
        }
    }

    async searchPages(cql) {
        try {
            const response = await axios.get(`${this.baseUrl}/content/search`, {
                params: { cql },
                auth: this.auth,
            });
            return response.data.results.map(page => ({
                id: page.id,
                title: page.title,
            }));
        } catch (error) {
            logger.error(`Error searching pages in Confluence: ${error.message}`);
            throw error;
        }
    }

    async indexPage(pageId, vectorStoreService) {
        try {
            // Recupera i dettagli della pagina
            const page = await this.getPage(pageId);

            // Prepara il documento per l'indicizzazione
            const document = {
                pageContent: `Title: ${page.title}\nContent: ${page.content}`,
                metadata: { id: page.id, title: page.title },
            };

            // Aggiungi il documento al Vector Store
            await vectorStoreService.addDocuments([document]);
            logger.info(`Page ${pageId} indexed successfully.`);
        } catch (error) {
            logger.error(`Error indexing page ${pageId}: ${error.message}`);
            throw error;
        }
    }
}