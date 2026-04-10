import { loadConfiguration, saveConfiguration } from "./features/storage";
import { DEFAULT_CONFIGURATION } from "./shared/types/config";

async function initOptions() {
	const config = await loadConfiguration();

	const globalEnable = document.getElementById(
		"globalEnable",
	) as HTMLInputElement;
	const threshold = document.getElementById("threshold") as HTMLInputElement;
	const thresholdValue = document.getElementById(
		"thresholdValue",
	) as HTMLElement;
	const maxMatches = document.getElementById("maxMatches") as HTMLInputElement;
	const debounce = document.getElementById("debounce") as HTMLInputElement;
	const minLength = document.getElementById("minLength") as HTMLInputElement;
	const maxLength = document.getElementById("maxLength") as HTMLInputElement;
	const enableLogging = document.getElementById(
		"enableLogging",
	) as HTMLInputElement;
	const saveBtn = document.getElementById("save") as HTMLButtonElement;
	const resetBtn = document.getElementById("reset") as HTMLButtonElement;
	const globalStatus = document.getElementById("globalStatus") as HTMLElement;

	const updateUI = (cfg: typeof config) => {
		globalEnable.checked = cfg.globalEnabled;
		threshold.value = cfg.defaultThreshold.toString();
		thresholdValue.textContent = cfg.defaultThreshold.toFixed(1);
		maxMatches.value = cfg.maxMatches.toString();
		debounce.value = cfg.debounceMilliseconds.toString();
		minLength.value = cfg.minTextLength.toString();
		maxLength.value = cfg.maxTextLength.toString();
		enableLogging.checked = cfg.enableLogging;
		globalStatus.textContent = cfg.globalEnabled ? "enabled" : "disabled";
	};

	updateUI(config);

	threshold.addEventListener("input", () => {
		thresholdValue.textContent = parseFloat(threshold.value).toFixed(1);
	});

	saveBtn.addEventListener("click", async () => {
		const newConfig = {
			globalEnabled: globalEnable.checked,
			defaultThreshold: parseFloat(threshold.value),
			maxMatches: parseInt(maxMatches.value, 10),
			debounceMilliseconds: parseInt(debounce.value, 10),
			minTextLength: parseInt(minLength.value, 10),
			maxTextLength: parseInt(maxLength.value, 10),
			enableLogging: enableLogging.checked,
		};
		await saveConfiguration(newConfig);

		const status = document.getElementById("status") as HTMLElement;
		status.textContent = "Settings saved!";
		status.style.display = "block";
		setTimeout(() => {
			status.style.display = "none";
		}, 2000);
		globalStatus.textContent = newConfig.globalEnabled ? "enabled" : "disabled";
	});

	resetBtn.addEventListener("click", async () => {
		if (confirm("Reset to defaults?")) {
			await saveConfiguration(DEFAULT_CONFIGURATION);
			updateUI(DEFAULT_CONFIGURATION);
		}
	});
}

document.addEventListener("DOMContentLoaded", initOptions);
