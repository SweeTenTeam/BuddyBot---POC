import JiraApi from 'jira-client';
import { logger } from './logger.mjs'; 

export class JiraClient {
    constructor() {
        this.jira = new JiraApi({
            protocol: 'https',
            host: 'sweetenteam.atlassian.net',
            username: process.env.JIRA_EMAIL,
            password: process.env.JIRA_API_KEY,
            apiVersion: '3',
            strictSSL: true,
        });
    }

    async getIssue(issueId) {
        try {
            const issue = await this.jira.findIssue(issueId);

            // RECUPERO DECRIZIONE 
            const descriptionContent = issue.fields.description?.content || [];
            let descriptionText = '';

            descriptionContent.forEach(block => {
                block.content?.forEach(segment => {
                    if (segment.text) {
                        descriptionText += segment.text + ' '; // CICLO PER RECUPERARE TUTTE LE LINE DI TESTO DELL'ARRAY CONTENT
                    }
                });
            });

            descriptionText = descriptionText.trim() || 'No description available';

            return {
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                description: descriptionText, //VERIABILE CON TUTTA LA DESCRIPION
                status: issue.fields.status.name,
                project: issue.fields.project.name,
            };
        } catch (error) {
            logger.error(`Error fetching issue ${issueId} from Jira: ${error.message}`);
            throw error;
        }
    }
}
