import { Octokit } from "@octokit/rest";

export class GithubCilent {
    octokit;
    owner = "SweeTenTeam";
    repo = "BuddyBot---POC";
    constructor(){
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });
    }

    getRepoInfo(){
        this.octokit.rest.repos.get({
            owner: this.owner,
            repo: this.repo,
        }).then(({ data })=>{
            console.log(data);
            return data;
        });
    }

    async getFileContents(path) {
        var result = "";
        await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: path,
        }).then(({ data })=>{
            result = Buffer.from(data['content'].replaceAll("\n",""), 'base64') + ''; //https://stackoverflow.com/questions/10145946/what-is-causing-the-error-string-split-is-not-a-function
        });
        return result;
    }
}