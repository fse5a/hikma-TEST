(() => {
  const allowedFiles = new Set(['voices.json', 'test-sentences.json']);
  const pending = new Map();

  async function loadJson(filename) {
    if (!allowedFiles.has(filename)) throw new Error('Unsupported public data file.');
    if (!pending.has(filename)) {
      const url = new URL(filename, document.baseURI);
      pending.set(filename, fetch(url).then(response => {
        if (!response.ok) throw new Error(`Could not load ${filename} (${response.status}).`);
        return response.json();
      }).catch(error => {
        pending.delete(filename);
        throw error;
      }));
    }
    return pending.get(filename);
  }

  globalThis.HikmaData = Object.freeze({loadJson});
})();