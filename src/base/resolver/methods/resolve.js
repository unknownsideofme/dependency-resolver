export default async function resolve() {
  console.log("\nStarting resolution...\n");

  await this.buildInitialState();

  const result = await this.search();

  if (!result) {
    throw new Error("Could not find a valid dependency tree.");
  }

  return result;
}
