import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import { VectorStoreService } from "./vectorStoreService.mjs";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";


class LangchainChatService{
    model;
    vectorStoreService;
    constructor(_vectorStoreService){
        this.vectorStoreService = _vectorStoreService
        this.model = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }

    async processInput(input){
        const relevantDocs = this.vectorStoreService.similaritySearch(input, 1)

        // const message = new HumanMessage(input);
        const prompt = PromptTemplate.fromTemplate(`Answer the question based only on the following context: {context} Question: {question}`);
        const ragChain = await createStuffDocumentsChain({
            llm:this.model,
            prompt,
            outputParser: new StringOutputParser(),
          });
          const response = await ragChain.invoke({question:input, context:relevantDocs})
        return response;
    }
}

export default LangchainChatService;