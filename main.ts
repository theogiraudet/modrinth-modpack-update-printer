import * as core from "@actions/core";
import * as cache from "@actions/cache";
import fs from "fs";
import { Toolkit } from "actions-toolkit";

type Cache = {
    issueNumber: number;
    canUpgrade: boolean;
    message: string;
}

Toolkit.run(main, {
    secrets: ["GITHUB_TOKEN"],
  });

async function main(tools: Toolkit) {
    const isUpToDate: boolean = core.getInput("is-up-to-date") === "true";

    if(!isUpToDate) {

        console.log("The modpack is not up to date, creating an issue…");
        
        const currentMcVersion: string = core.getInput("current-mc-version");
        const testedMcVersion: string = core.getInput("tested-mc-version");
        const supportedMods: string[] = (core.getInput("supported-mods") || "").split(",");
        const unsupportedMods: string[] = (core.getInput("unsupported-mods") || "").split(",");
        const canUpgrade: boolean = core.getInput("can-upgrade") === "true";
        const personToPing: string = core.getInput("person-to-ping");

        let message = `**Current Minecraft version:** ${currentMcVersion}\n**Tested Minecraft version:** ${testedMcVersion}\n\n**Mods:**\n`;

        const supportedModsList = supportedMods.map<[string, string]>((mod) => ["- ✔️ ", mod]);
        const unsupportedModsList = unsupportedMods.map<[string, string]>((mod) => ["- ✖️ ", mod]);

        const modsList = [...supportedModsList, ...unsupportedModsList].sort((a, b) => a[1].localeCompare(b[1])).map((mod) => mod.join(" ")).join("\n");

        message += modsList

        const cacheKey = "update-to-" + testedMcVersion;
        const cacheFile = "./.cache/update-to-" + testedMcVersion + ".json";
        const paths = ["./.cache/*.json"];

        const hit = await cache.restoreCache(paths, cacheKey);

        if (!hit) {
            const result = await tools.github.issues.create({
                owner: tools.context.repo.owner,
                repo: tools.context.repo.repo,
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
                await tools.github.issues.update({
                    owner: tools.context.repo.owner,
                    repo: tools.context.repo.repo,
                    issue_number: cacheData.issueNumber,
                    body: message,
                });
            }

            if(canUpgrade) {
                await tools.github.issues.createComment({
                    owner: tools.context.repo.owner,
                    repo: tools.context.repo.repo,
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