# Changesets

This directory contains changesets for the monorepo packages.

## Usage

- `yarn changeset` — create a new changeset
- `yarn version-packages` — consume changesets and bump versions
- `yarn release` — build and publish all changed packages

## Publishing target

Packages publish to GitHub Packages (https://npm.pkg.github.com) under the @trabara scope.
Ensure GITHUB_TOKEN (or NPM_TOKEN for GitHub Packages) is set in your environment.

## Which packages are versioned

Only non-private packages under /packages are versioned:

- @trabara/common
- @trabara/analytics-plugin
- @trabara/fitment-plugin
- @trabara/invoice-plugin
- @trabara/rbac-plugin
