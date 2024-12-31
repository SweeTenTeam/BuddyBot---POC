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

            return {
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                description: issue.fields.description?.content[0]?.content[0]?.text || 'No description available', //bisogna mettere un ciclo per recuperatre tutto siccome jira ha una struttura ad array
                status: issue.fields.status.name,
                project: issue.fields.project.name,
            };
        } catch (error) {
            logger.error(`Error fetching issue ${issueId} from Jira: ${error.message}`);
            throw error;
        }
    }
}