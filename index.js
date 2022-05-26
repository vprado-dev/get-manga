const getAnimeName = require("./functions/getAnimeName");
const getMangaPages = require("./functions/getMangaPages");

(async () => {
  const manga = await getAnimeName();

  console.info(`Manga selecionado-> ${manga}`);

  await getMangaPages(manga);
})();
