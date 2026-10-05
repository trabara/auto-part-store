// @ts-check
/**
 * Workspace dependency rules, checked by `yarn constraints` (CI) and applied
 * with `yarn constraints --fix`.
 *
 * Upgrading Medusa: change MEDUSA (and MEDUSA_UI if needed) here, run
 * `yarn constraints --fix && yarn install`, then test.
 *
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Context} Context
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Dependency} Dependency
 */

const MEDUSA = "2.21.2";
const MEDUSA_UI = "4.0.25";

/** Packages that must resolve to a single copy at runtime (the admin dedupes these). */
const PINNED = {
  react: "19.2.3",
  "react-dom": "19.2.3",
  "react-router-dom": "6.30.6",
  zod: "4.2.0",
};

/** Medusa packages versioned with the core release. */
const isMedusaCore = (ident) =>
  ident.startsWith("@medusajs/") &&
  ident !== "@medusajs/ui" &&
  // Provider packages outside the core release train
  !ident.startsWith("@medusajs/caching-");

/** @param {Dependency} dependency */
function pinnedRange(dependency) {
  const { ident, type } = dependency;
  if (isMedusaCore(ident)) return type === "peerDependencies" ? `~${MEDUSA}` : MEDUSA;
  if (ident === "@medusajs/ui") return type === "peerDependencies" ? `~${MEDUSA_UI}` : MEDUSA_UI;
  if (ident in PINNED && type !== "peerDependencies") return PINNED[ident];
  return undefined;
}

/** @param {Context} context */
function enforcePinnedVersions({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    const range = pinnedRange(dependency);
    if (range !== undefined) dependency.update(range);
  }
}

/**
 * Every other dependency uses one range across workspaces. Reported, not
 * auto-fixed: pick the range deliberately, then update every workspace.
 *
 * @param {Context} context
 */
function enforceConsistentRanges({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === "peerDependencies") continue;
    if (dependency.range.startsWith("workspace:")) continue;
    if (pinnedRange(dependency) !== undefined) continue;
    for (const other of Yarn.dependencies({ ident: dependency.ident })) {
      if (other.type === "peerDependencies" || other.range === dependency.range) continue;
      dependency.error(
        `${dependency.ident} is "${dependency.range}" here but "${other.range}" in ${other.workspace.ident}`,
      );
      break;
    }
  }
}

/** Internal packages are always consumed from the workspace. */
function enforceWorkspaceProtocol({ Yarn }) {
  const internal = new Set(Yarn.workspaces().map((w) => w.ident));
  for (const dependency of Yarn.dependencies()) {
    if (internal.has(dependency.ident) && dependency.type !== "peerDependencies") {
      dependency.update("workspace:*");
    }
  }
}

module.exports = {
  /** @param {Context} context */
  async constraints(context) {
    enforcePinnedVersions(context);
    enforceConsistentRanges(context);
    enforceWorkspaceProtocol(context);
  },
};
