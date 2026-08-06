# Publishing Packages to NPM

To allow GitHub Actions to publish packages to NPM, you must set an `NPM_TOKEN` secret in the repository settings.

## Setting up the NPM Token
1. Go to your NPM account, click on your profile picture, and select **Access Tokens**.
2. Click **Generate New Token** and select **Granular Access Token**.
3. Fill in the token details (Name, Expiration) and under **Packages and scopes**, select the packages (or the entire `@biocomputingup` scope) and grant **Read and write** access.
4. Generate the token and copy it.
5. In this GitHub repository, go to **Settings > Environments** and click **New environment**. Name it `npm-publish`.
6. Under **Environment protection rules**, check **Required reviewers** and add yourself (or other trusted maintainers). This ensures the workflow pauses and waits for your explicit approval before it can access the token.
7. Scroll down to **Environment secrets**, click **Add secret**, name it `NPM_TOKEN`, and paste your token.

The `Publish to NPM` workflow will now be able to authenticate and publish the packages.
