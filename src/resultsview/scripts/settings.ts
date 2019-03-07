
export function getData(key: string): any {
	const element = document.getElementById('vscode-foresight-devtool-results-data');
	if (element) {
		const data = element.getAttribute(key);
		if (data) {
			return JSON.parse(data);
		}
	}

	throw new Error(`Could not load data for ${key}`);
}