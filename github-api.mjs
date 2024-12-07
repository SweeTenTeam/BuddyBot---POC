import { Octokit } from "@octokit/rest";


class GithubCilent {
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

    getFileContents(path) {
        this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: path,
        }).then(({ data })=>{
            return atob(data['content'].replaceAll("\n",""));
        });
    }
}

export default GithubCilent;

