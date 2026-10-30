/* Hellscape: loader. Shared by the static site, Node tests and browser review harness. */
(function (root) {
  "use strict";
  const datasets = root.HellscapeDatasets;
  async function fetchSiteText(path) {
    if (
      root.HellscapePreviewResources?.texts &&
      Object.hasOwn(root.HellscapePreviewResources.texts, path)
    )
      return root.HellscapePreviewResources.texts[path];
    const url = new URL(path, location.href);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== location.origin
    )
      throw Error("Apri Hellscape dal sito per caricare le domande.");
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok)
      throw Error(
        "Contenuti non disponibili. Controlla la connessione e riprova.",
      );
    if (Number(response.headers.get("content-length")) > 20 * 1024 * 1024)
      throw Error("Banca domande troppo grande.");
    return response.text();
  }
  async function loadCatalog() {
    const data = JSON.parse(await fetchSiteText("datasets.json"));
    if (
      data.versione !== 1 ||
      !Array.isArray(data.banche) ||
      !data.banche.length
    )
      throw Error("Nessuna banca domande disponibile sul sito.");
    const ids = new Set();
    for (const entry of data.banche) {
      if (
        typeof entry.id !== "string" ||
        !entry.id.trim() ||
        ids.has(entry.id) ||
        typeof entry.nome !== "string" ||
        !entry.nome.trim() ||
        typeof entry.url !== "string"
      )
        throw Error("Catalogo delle domande non valido.");
      ids.add(entry.id);
      const url = new URL(
        entry.url,
        root.HellscapePreviewResources ? "https://offline.invalid/" : location.href,
      );
      if (
        !root.HellscapePreviewResources?.texts?.[entry.url] &&
        (url.origin !== location.origin ||
          !["http:", "https:"].includes(url.protocol))
      )
        throw Error("Indirizzo della banca non valido.");
    }
    return data.banche;
  }
  async function loadBank(entry) {
    const parsed = datasets.parseDataset(await fetchSiteText(entry.url), katex, { requireAllDifficulties: true });
    return { ...parsed, source: entry.id };
  }

  const api = { fetchSiteText, loadCatalog, loadBank };
  if (typeof module !== "undefined") module.exports = api;
  else root.HellscapeLoader = api;
})(globalThis);
