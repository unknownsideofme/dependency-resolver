import {
    getPackageVersion,
    getVersions
} from "./registry.js";

import {
    generateCandidates
} from "./candidates.js";

import semver from "semver";


export class Resolver {

    constructor(rootDependencies) {

        this.rootDependencies =
            { ...rootDependencies };

        this.selected =
            new Map();

        this.constraints =
            new Map();

        this.conflicts =
            new Set();
    }


    async resolve() {

        console.log(
            "\nStarting resolution...\n"
        );

        await this.buildInitialState();

        const result =
            await this.search();

        if (!result) {

            throw new Error(
                "Could not find a valid dependency tree."
            );
        }

        return result;
    }


    async buildInitialState() {

        for (
            const [
                name,
                range
            ]
            of Object.entries(
                this.rootDependencies
            )
        ) {

            const versions =
                await this.getValidVersions(
                    name,
                    range
                );

            if (versions.length === 0) {

                throw new Error(
                    `No version of ${name} satisfies ${range}`
                );
            }

            await this.selectPackage(
                name,
                versions[0],
                "ROOT"
            );
        }
    }


    async getValidVersions(
        name,
        range
    ) {

        const versions =
            await getVersions(name);

        return versions
            .filter(version =>
                semver.satisfies(
                    version,
                    range
                )
            )
            .sort(semver.rcompare);
    }


    async selectPackage(
        name,
        version,
        requestedBy
    ) {

        this.selected.set(
            name,
            {
                name,
                version,
                requestedBy
            }
        );

        const packageData =
            await getPackageVersion(
                name,
                version
            );

        const dependencies =
            packageData.dependencies || {};

        for (
            const [
                dependencyName,
                dependencyRange
            ]
            of Object.entries(dependencies)
        ) {

            this.addConstraint(
                dependencyName,
                dependencyRange,
                `${name}@${version}`
            );
        }
    }


    addConstraint(
        name,
        range,
        requester
    ) {

        if (!this.constraints.has(name)) {

            this.constraints.set(
                name,
                []
            );
        }

        this.constraints
            .get(name)
            .push({
                requester,
                range
            });

        this.checkConflict(name);
    }


    checkConflict(name) {

        const requirements =
            this.constraints.get(name);

        if (!requirements) {
            return;
        }

        for (
            let i = 0;
            i < requirements.length;
            i++
        ) {

            for (
                let j = i + 1;
                j < requirements.length;
                j++
            ) {

                if (
                    !semver.intersects(
                        requirements[i].range,
                        requirements[j].range
                    )
                ) {

                    this.conflicts.add(name);

                    return;
                }
            }
        }

        this.conflicts.delete(name);
    }


    getFirstConflict() {

        for (
            const packageName
            of this.conflicts
        ) {

            return {
                packageName,

                constraints:
                    this.constraints.get(
                        packageName
                    )
            };
        }

        return null;
    }


    async search() {

        const conflict =
            this.getFirstConflict();

        if (!conflict) {

            console.log(
                "\n✅ Valid dependency tree found."
            );

            return new Map(
                this.selected
            );
        }

        console.log(
            `\n❌ Conflict: ${conflict.packageName}`
        );

        const candidates =
            await generateCandidates(
                conflict
            );

        for (
            const candidate
            of candidates
        ) {

            console.log(
                `Trying ${candidate.packageName}` +
                `@${candidate.newVersion}`
            );

            const snapshot =
                this.createSnapshot();

            try {

                await this.selectPackage(
                    candidate.packageName,
                    candidate.newVersion,
                    "RESOLUTION"
                );

                const result =
                    await this.search();

                if (result) {
                    return result;
                }

            } catch (error) {

                console.log(
                    error.message
                );
            }

            this.restoreSnapshot(
                snapshot
            );

            console.log(
                "↩️ Backtracking..."
            );
        }

        return null;
    }


    createSnapshot() {

        return {
            selected:
                new Map(
                    this.selected
                ),

            constraints:
                new Map(
                    [...this.constraints].map(
                        ([name, values]) => [
                            name,
                            values.map(
                                value => ({
                                    ...value
                                })
                            )
                        ]
                    )
                ),

            conflicts:
                new Set(
                    this.conflicts
                )
        };
    }


    restoreSnapshot(snapshot) {

        this.selected =
            new Map(
                snapshot.selected
            );

        this.constraints =
            new Map(
                [...snapshot.constraints].map(
                    ([name, values]) => [
                        name,
                        values.map(
                            value => ({
                                ...value
                            })
                        )
                    ]
                )
            );

        this.conflicts =
            new Set(
                snapshot.conflicts
            );
    }
}