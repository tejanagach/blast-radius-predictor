import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function getPullRequestDiff(
  owner: string,
  repo: string,
  pull_number: number
): Promise<string> {
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: {
      format: "diff"
    }
  });

  return response.data as unknown as string;
}

export async function commentOnPR(
  owner: string,
  repo: string,
  pull_number: number,
  message: string
) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: message
  });
}

export async function addPRLabel(
  owner: string,
  repo: string,
  pull_number: number,
  label: string
) {
  try {
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: pull_number,
      labels: [label]
    });
  } catch (error) {
    console.error("Failed to add label, might not have permissions:", error);
  }
}