import { Configuration, DEFAULT_CONFIGURATION } from "../../shared/types/config";

export async function loadConfiguration(): Promise<Configuration> {
	return new Promise((resolve) => {
		chrome.storage.sync.get(DEFAULT_CONFIGURATION as any, (items) => {
			resolve(items as unknown as Configuration);
		});
	});
}

export async function saveConfiguration(
	config: Partial<Configuration>,
): Promise<void> {
	return new Promise((resolve) => {
		chrome.storage.sync.set(config, () => {
			resolve();
		});
	});
}

export async function getSiteOverride(host: string): Promise<boolean | null> {
	const key = `override_${host}`;
	return new Promise((resolve) => {
		chrome.storage.sync.get([key], (result) => {
			const val = result[key];
			resolve(typeof val === "boolean" ? val : null);
		});
	});
}

export async function setSiteOverride(
	host: string,
	enabled: boolean | null,
): Promise<void> {
	const key = `override_${host}`;
	if (enabled === null) {
		await chrome.storage.sync.remove(key);
	} else {
		await chrome.storage.sync.set({ [key]: enabled });
	}
}
