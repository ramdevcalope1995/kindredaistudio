# `@ramdevcalope1995/kindredaistudio`

Scaffold a local Next.js app from the Kindred AI Studio template.

## Usage

Because this package is published to GitHub Packages, configure npm to read this scope from GitHub:

```bash
npm config set @ramdevcalope1995:registry https://npm.pkg.github.com
```

Then run:

```bash
npx @ramdevcalope1995/kindredaistudio my-project
```

The CLI will:

- Clone the template with `git clone --depth 1`
- Remove the template `.git` directory
- Rewrite the generated app `package.json` name
- Initialize a fresh Git repository
- Run `npm install`
- Print local development instructions

## Development

From this package directory:

```bash
npm run pack:dry-run
```

## Publishing To GitHub Packages

Manual publish:

```bash
npm login --scope=@ramdevcalope1995 --registry=https://npm.pkg.github.com
npm publish
```

Automated publishing is configured in the repository workflow:

```text
.github/workflows/publish-github-package.yml
```

Create a GitHub release or push a tag like `v1.0.0` to publish.
