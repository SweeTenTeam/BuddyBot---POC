import axios from 'axios';
import { logger } from './logger.mjs'; // Importa il logger per i messaggi

export class JiraClient {
    constructor() {
        this.baseUrl = 'https://sweetenteam.atlassian.net/rest/api/3';
        this.auth = {
            username: process.env.JIRA_EMAIL,
            password: process.env.JIRA_API_KEY,
        };
    }

    async getIssue(issueId) {
        try {
            const response = await axios.get(`${this.baseUrl}/issue/${issueId}`, {
                auth: this.auth,
            });
            const issue = response.data;
            return {
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                description: issue.fields.description || 'No description available',
                status: issue.fields.status.name,
                project: issue.fields.project.name,
            };
        } catch (error) {
            logger.error(`Error fetching issue ${issueId} from Jira: ${error.message}`);
            throw error;
        }
    }

    async searchIssues(jql) {
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: { jql },
                auth: this.auth,
            });
            return response.data.issues;
        } catch (error) {
            logger.error(`Error searching issues in Jira: ${error.message}`);
            throw error;
        }
    }

    async indexIssue(issueId, vectorStoreService) {
        try {
            // Recupera i dettagli dell'issue
            const issue = await this.getIssue(issueId);

            // Prepara il documento per l'indicizzazione
            const document = {
                pageContent: `Issue Key: ${issue.key}\nSummary: ${issue.summary}\nDescription: ${issue.description}\nStatus: ${issue.status}\nProject: ${issue.project}`,
                metadata: { key: issue.key, project: issue.project },
            };

            // Aggiungi il documento al Vector Store
            await vectorStoreService.addDocuments([document]);
            logger.info(`Issue ${issueId} indexed successfully.`);
        } catch (error) {
            logger.error(`Error indexing issue ${issueId}: ${error.message}`);
            throw error;
        }
    }
}
