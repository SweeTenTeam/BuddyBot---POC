import Confluence from 'confluence-api';
import { logger } from './logger.mjs';
import { JSDOM } from 'jsdom'; // Importa jsdom

export class ConfluenceClient {
    constructor() {
        this.confluence = new Confluence({
            username: process.env.JIRA_EMAIL,
            password: process.env.JIRA_API_KEY,
            baseUrl: 'https://sweetenteam.atlassian.net/wiki',
        });
    }

    async getPage(pageId) {
        return new Promise((resolve, reject) => {
            this.confluence.getContentById(pageId, (err, data) => {
                if (err) {
                    logger.error(`Error fetching page ${pageId} from Confluence: ${err.message}`);
                    return reject(err);
                }
    
                if (!data || !data.id) {
                    logger.error(`Invalid response for page ${pageId}`);
                    return reject(new Error(`Invalid response for page ${pageId}`));
                }
    
                try {
                    //conversione da html text a NL con JSDOM
                    const dom = new JSDOM(data.body.storage.value);
                    const plainTextContent = dom.window.document.body.textContent.trim();

                    resolve({
                        id: data.id,
                        title: data.title,
                        content: plainTextContent, // contenuto pulito
                    });
                } catch (parseError) {
                    logger.error(`Error parsing page ${pageId} data: ${parseError.message}`);
                    reject(parseError);
                }
            });
        });
    }
}
