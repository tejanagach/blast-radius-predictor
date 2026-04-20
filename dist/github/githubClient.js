"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPullRequestDiff = getPullRequestDiff;
exports.commentOnPR = commentOnPR;
const rest_1 = require("@octokit/rest");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const octokit = new rest_1.Octokit({
    auth: process.env.GITHUB_TOKEN
});
async function getPullRequestDiff(owner, repo, pull_number) {
    const response = await octokit.pulls.get({
        owner,
        repo,
        pull_number,
        mediaType: {
            format: "diff"
        }
    });
    return response.data;
}
async function commentOnPR(owner, repo, pull_number, message) {
    await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: message
    });
}
//# sourceMappingURL=githubClient.js.map