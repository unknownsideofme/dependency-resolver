import axios from "axios";

export default async function getPackageMetadata(name) {
  const metadataCache = this.getMetadataCache();
  if (metadataCache && metadataCache.has(name)) {
    return metadataCache.get(name);
  }
  const registryUrl = this.getREGISTRY_URL();
  const url = `${registryUrl}/${encodeURIComponent(name)}`;

  const response = await axios.get(url);

  if (metadataCache) {
    metadataCache.set(name, response.data);
  }

  return response.data;
}
