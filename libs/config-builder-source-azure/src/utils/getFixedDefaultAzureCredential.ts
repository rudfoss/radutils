import {
	ChainedTokenCredential,
	DefaultAzureCredential,
	ManagedIdentityCredential,
	TokenCredential
} from "@azure/identity"

const resetTimeoutOnGetToken = (credential: TokenCredential) => {
	const original = credential.getToken
	credential.getToken = (
		arg1: Parameters<TokenCredential["getToken"]>[0],
		arg2: Parameters<TokenCredential["getToken"]>[1]
	) => {
		if (arg2?.requestOptions?.timeout === 0) {
			delete arg2?.requestOptions.timeout
		}
		return original.call(credential, arg1, arg2)
	}

	return () => {
		credential.getToken = original
	}
}
const findManagedIdentityCredential = (
	chainedTokenCredential: ChainedTokenCredential
): ManagedIdentityCredential | undefined => {
	return chainedTokenCredential["_sources"].find(
		(credential: TokenCredential) => credential instanceof ManagedIdentityCredential
	)
}

/**
 * This function addresses a problem with the `DefaultAzureCredential` where a timeout value carries over from some older request causing a long delay when looking up key vault secrets. This is NOT intented as a permanent fix, but a workaround until there is a more "official" way to solve the problem.
 * @see https://github.com/Azure/azure-sdk-for-js/issues/23017
 */
export const getFixedDefaultAzureCredential = () => {
	const credential = new DefaultAzureCredential()
	const managedCred = findManagedIdentityCredential(credential)
	if (managedCred) {
		resetTimeoutOnGetToken(managedCred)
	}
	return credential
}
