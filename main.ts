import * as core from "@actions/core";
import * as cache from "@actions/cache";
import * as github from "@actions/github";
import fs from "fs";

type Cache = {
    issueNumber: number;
    canUpgrade: boolean;
    message: string;
}

main();

async function main() {
    const isUpToDate: boolean = core.getInput("is-up-to-date") === "true";

    if(!isUpToDate) {

        console.log("The modpack is not up to date, creating an issue…");
        
        const currentMcVersion: string = core.getInput("current-mc-version");
        const testedMcVersion: string = core.getInput("tested-mc-version");
        const supportedMods: string[] = (core.getInput("supported-mods") || "").split(",");
        const unsupportedMods: string[] = (core.getInput("unsupported-mods") || "").split(",");
        const canUpgrade: boolean = core.getInput("can-upgrade") === "true";
        const token: string = core.getInput("token");
        const personToPing: string = core.getInput("person-to-ping");

        let message = `
        Current Minecraft Version: ${currentMcVersion}
        Tested Minecraft Version: ${testedMcVersion}

        Mods:
        `;

        const supportedModsList = supportedMods.map<[string, string]>((mod) => ["[x]", mod]);
        const unsupportedModsList = unsupportedMods.map<[string, string]>((mod) => ["[ ]", mod]);

        const modsList = [...supportedModsList, ...unsupportedModsList].sort((a, b) => a[1].localeCompare(b[1])).map((mod) => mod.join(" ")).join("\n");

        message += modsList

        const octokit = github.getOctokit(token);

        const cacheKey = "update-to-" + testedMcVersion;
        const cacheFile = "./.cache/update-to-" + testedMcVersion + ".json";
        const paths = ["./.cache/*.json"];

        const hit = await cache.restoreCache(paths, cacheKey);

        if (!hit) {
            const result = await octokit.rest.issues.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: "Update to Minecraft " + testedMcVersion,
                body: message,
            });
            const number = result.data.id;

            if(!fs.existsSync("./.cache")) {
                fs.mkdirSync("./.cache");
            }

            fs.writeFileSync(cacheFile, JSON.stringify({
                issueNumber: number,
                canUpgrade: true,
            }));

            cache.saveCache(paths, cacheKey);
        }

        const cacheData: Cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));

        if(!cacheData.canUpgrade) {
            if(cacheData.message !== message) {
                await octokit.rest.issues.update({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: cacheData.issueNumber,
                    body: message,
                });
            }

            if(canUpgrade) {
                await octokit.rest.issues.createComment({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: cacheData.issueNumber,
                    body: `@${personToPing} The modpack can be upgraded to Minecraft ${testedMcVersion}!`,
                });
            }

            fs.writeFileSync(cacheFile, JSON.stringify({
                issueNumber: cacheData.issueNumber,
                canUpgrade: canUpgrade,
                message: message,
            }));

            cache.saveCache(paths, cacheKey);
        }
    }
}