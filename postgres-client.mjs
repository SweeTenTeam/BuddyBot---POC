import pg from 'pg';

const { Client } = pg;

const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD=process.env.POSTGRES_PASSWORD || 'password';
const POSTGRES_HOST=process.env.POSTGRES_HOST || 'db';
const POSTGRES_DB=process.env.POSTGRES_DB || 'postgres';

export class PostgresClient {
    client;
    constructor(){
        this.client = new Client({
            user: POSTGRES_USER,
            host: POSTGRES_HOST,
            database: POSTGRES_DB,
            password: POSTGRES_PASSWORD,
            port: 5432,
          });
    }

    async connect() {
        await this.client.connect(function (err) {
            if (err) {
                throw err;
            }
        });
        return 0;
    }

    async close() {
        await this.client.end();
        return 0;
    }

    async insertChat(question,answer){
        const query = "INSERT INTO chat(question,answer) VALUES ($1,$2)";
        const parameters = [question,answer];
        await this.client.query(query,parameters);
        return 0;
    }

    async getLastChat(){
        const query = `SELECT question,answer 
                       FROM chat 
                       ORDER BY id desc 
                       LIMIT 1`;
        const result = await this.client.query(query);
        return result.rows[0];
    }
}