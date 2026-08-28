import { getPackageMetadata , getPackageVersion , resolveVersion} from "../src/registry.js";

export const testgetPackageMetadata = async (pkgName) =>{
    try{
        const metadata = await getPackageMetadata(pkgName);

        return (JSON.stringify(metadata,null,2));
    }
    catch(error){
        console.log(error); 
    }
}

export const testGetPackageVersion = async (pkgName,version) =>{
    try {
        const data = await getPackageVersion(pkgName,version);
        return (JSON.stringify(data,null,2));
    }
    catch (error) {
        console.log(error);
    }
}

export const testResolveVersion = async (pkgName,range) =>{
    try {
        const version = await resolveVersion(pkgName,range);
        return (JSON.stringify(version,null,2));
    }
    catch (error) {
        console.log(error);
    }
}

