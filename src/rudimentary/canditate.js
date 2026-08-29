import semver from "semver";
import {
    getVersions,
    getPackageVersion
} from "./registry.js";

export async function generateCandidates(
    conflict
) {
    const candidates = [];

    const packageName =
        conflict.packageName;

    for (
        const requirement
        of conflict.constraints
    ) {

        const requester =
            requirement.requester;

        const requesterParts =
            requester.split("@");

        const requesterName =
            requesterParts[0];

        const currentVersion =
            requesterParts.slice(1).join("@");

        console.log(
            `\nLooking for alternatives for ${requester}`
        );

        const versions =
            await getVersions(requesterName);

        for (const version of versions) {

            // Don't try the version we're already using
            if (version === currentVersion) {
                continue;
            }

            // Get this candidate's metadata
            const packageData =
                await getPackageVersion(
                    requesterName,
                    version
                );

            const dependencies =
                packageData.dependencies || {};

            // Does this version still depend on
            // the conflicting package?
            if (!dependencies[packageName]) {
                candidates.push({
                    packageName: requesterName,
                    oldVersion: currentVersion,
                    newVersion: version,
                    reason: `No longer depends on ${packageName}`
                });

                continue;
            }

            const newRange =
                dependencies[packageName];

            // Does this new dependency range
            // overlap with the other constraints?
            let compatible = true;

            for (
                const other
                of conflict.constraints
            ) {

                if (
                    other.requester === requester
                ) {
                    continue;
                }

                if (
                    !semver.intersects(
                        newRange,
                        other.range
                    )
                ) {
                    compatible = false;
                    break;
                }
            }

            if (compatible) {
                candidates.push({
                    packageName: requesterName,
                    oldVersion: currentVersion,
                    newVersion: version,
                    reason:
                        `${requesterName}@${version} requires ` +
                        `${packageName} ${newRange}`
                });
            }
        }
    }

    // Prefer smaller version changes for now
    candidates.sort((a, b) => {

        return semver.compare(
            a.newVersion,
            a.oldVersion
        );
    });

    return candidates;
}