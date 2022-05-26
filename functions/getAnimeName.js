const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getAnimeName = async () => {
  const anime = await new Promise((resolve) =>
    rl.question(`Digite o nome do manga: `, resolve)
  );

  return anime;
};

module.exports = getAnimeName;
