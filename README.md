# Modrinth Modpack Update Printer

This action prints a report in an issue about if a modpack can be upgraded to the next Minecraft version.
This action is meant to be used with the [Modrinth Modpack Update Checker](https://github.com/Gunivers/modrinth-modpack-update-checker) action, that checks if a modpack can be upgraded to the next Minecraft version according to its mods.
The issue comment is only printed if the modpack can be upgraded and updated until all the mods are supported on the next Minecraft version.
When the modpack can be upgraded, the action will also ping the person specified in the `person-to-ping` input.

## Usage

First, you have to authorize actions to write in your repository. You can do this by going to the repository settings, Actions/General and clicking on "Read and write permissions" in "Workflow permissions" section.

```yaml
name: 'Modrinth Modpack Update Checker'

on:
  schedule:
    - cron: '0 * * * *' # Every hours
  workflow_dispatch: # Allow running the workflow manually

permissions:
  issues: write 

jobs:
  check-updates:
    runs-on: ubuntu-latest
    steps:
        - name: 'Check Modrinth Modpack updates'
            uses: Gunivers/modrinth-modpack-update-checker@v1.1.0
            id: check
            with:
                modrinth-modpack-slug: 'example-modpack'

        - name: 'Print Modrinth Modpack updates'
            uses: Gunivers/modrinth-modpack-update-printer@v1.0.0
            with:
                current-mc-version: ${{ steps.check.outputs.current-version }}
                is-up-to-date: ${{ steps.check.outputs.is-up-to-date }}
                tested-mc-version: ${{ steps.check.outputs.searched-version }}
                supported-mods: ${{ steps.check.outputs.supported }}
                unsupported-mods: ${{ steps.check.outputs.unsupported }}
                can-upgrade: ${{ steps.check.outputs.can-upgrade }}
                person-to-ping: 'your-github-username'
          env:
            GITHUB_TOKEN: ${{ github.token }}
```

## Inputs

| Input | Description | Required | Supported since |
| ----- | ----------- | -------- | --------------- |
| `current-mc-version` | The current Minecraft version of the modpack | Yes | v1.0.0 |
| `is-up-to-date` | Whether the modpack is up to date | Yes | v1.0.0 |
| `tested-mc-version` | The Minecraft version that was tested | Yes | v1.0.0 |
| `supported-mods` | The mods that are supported on the tested Minecraft version | Yes | v1.0.0 |
| `unsupported-mods` | The mods that are not supported on the tested Minecraft version | Yes | v1.0.0 |
| `can-upgrade` | Whether the modpack can be upgraded to the next Minecraft version | Yes | v1.0.0 |
| `person-to-ping` | The person to ping in the issue when the modpack can be upgraded | Yes | v1.0.0 |