import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";

class LangchainChatService{
    model;
    constructor(){
        this.model = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }

    async processInput(input){
        const message = new HumanMessage(input);
        const response = await this.model.invoke([message]);
        return response.content;
    }
}

export default LangchainChatService;