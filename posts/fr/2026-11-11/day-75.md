---
title: "Jour 75"
date: "2026-11-11"
excerpt: "Redécouverte d'une ancienne présentation Backend Knowledge Sharing que j'ai donnée chez MonstarLab en 2022 sur zx et les bases de la blockchain, avec une DApp Mercari des années 90."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "blockchain", "ethereum", "solidity", "zx", "javascript", "presentation"]
coverImage: "/images/blog/2026-11-11/blockchain-web2-vs-web3.png"
---

## Aujourd'hui, j'ai :

- suis tombé sur une ancienne présentation que j'ai donnée chez MonstarLab (Backend Knowledge Sharing, juillet 2022) sur `zx` et les bases de la blockchain : construire une DApp 90年代メルカリ ⛓ (contenu complet copié ci-dessous)

---

# Backend Knowledge Sharing 📚

## **今日のスケジュル (Programme du jour)**

- Présentation 🙎🏻‍♂️
- `zx` - un outil pour écrire de meilleurs scripts shell 🛠
- Blockchain 101 ⛓ Comment développer une DApp 90年代メルカリー ☎️

## Notes

> 📌 **Rappels**
>
> - Je sais que tout le monde est occupé, alors détendez-vous et écoutez comme si vous écoutiez une émission de radio 🎧
> - On fera une session de questions-réponses à la fin
> - N'hésitez pas à poser vos questions ou à laisser vos commentaires dans le chat Google Meet 🙋🏻‍♀️

## Présentation

#### 👋 Salut ! Je m'appelle Tony Duong 🙋🏻‍♂️

```jsx
const name = "Tony Duong" // My parents are from Vietnam 🇻🇳
const country = "🇫🇷" // Born in Toulouse 💕
let age = 28
const cameToJapanIn = new Date("2018/02") // Just after graduation

let careers = [
  "2018 ~ 2019 - Seido 株式会社 (Intern → 正社員) - Full-stack Web Developer", // e-commerce (seidoshop.com)
  "2019 ~ 2022 - Overflow 株式会社 (正社員) - Full-stack Web Developer" // job matching platform (offers.jp)
  "2022 - MonstarLab - Backend Engineer"
]

let technologies = ["Ruby", "Ruby on Rails", "VueJS", "AWS"]
let sports = ["⚽️", "🧗‍♀️", "🏃🏻‍♀️"] // @Sivan, I still owe you a nutmeg 😡
```

## `zx` - un outil pour écrire de meilleurs scripts shell 🛠

### Qu'est-ce que `zx` ? 🤔

- Un outil pour écrire des scripts shell en Javascript
- C'était le projet JS le plus populaire toutes catégories confondues en 2021 selon [Rising Stars](https://risingstars.js.org/2021/en#section-all) 🎉

### zx est-il vraiment si bien ?

- Les scripts shell servent souvent à automatiser des tâches répétitives (CI/CD, sauvegarde de données, démarrage d'applications…)
- Le langage de script shell est généralement considéré comme **difficile** à écrire ✍🏻 et à lire 👀

```jsx
- Syntax is unintuitive (everytime I must search how to write basic loops 😩)
- No exception handling
- JSON and array manipulation is quite complex
```

- C'est pour résoudre ces problèmes que `zx` a été développé 👍 Écrire des scripts shell devient bien plus simple grâce au **Javascript** (ou au **Typescript**), un langage très répandu et facile 🥳

### Donc si vous maîtrisez `zx`, vous pouvez dire adieu aux scripts shell 👋

### Comment ça marche ?

- L'installation est aussi simple que

```bash
npm install -g zx
```

- L'extension des scripts shell `zx` est `.mjs`
- Pour exécuter un script, il suffit de lancer

```bash
zx file.mjs
```

### Laissez-moi vous montrer quelques exemples 👀

### Exemple 1 - Afficher le nom de la branche courante

- Script 📋

```jsx
#!/usr/bin/env zx
const branch = await $`git branch --show-current`
console.log(`Current branch: ${branch}`)
```

- Résultat ✅

![Résultat de l'exemple 1 de zx](/images/blog/2026-11-11/zx-example-1-branch-name.png)

### Exemple 2 - Ajouter des couleurs et de la mise en forme

- Script 📋

```jsx
#!/usr/bin/env zx
$.verbose = false
let branch = await $`git branch --show-current`
console.log(`Current branch: ${chalk.bgYellow.red.bold(branch)}`)
```

- Résultat ✅

![Résultat de l'exemple 2 de zx](/images/blog/2026-11-11/zx-example-2-colors.png)

### Exemple 3 - Ajouter des saisies utilisateur

- Script 📋

```jsx
#!/usr/bin/env zx
$.verbose = false
let filename = await question('What is the filename? ')
let template = await question('What is your preferred template? ', {
  choices: ["function", "class"] // Enables tab completion.
})
let content = ""

if(template == "function") {
    content = `function main() {
    console.log("Test");
}`;
}
else if(template == "class") {
    content = `class Main {
    constructor() {
        console.log("Test");
    }
}`;
}
else {
    console.error(`Invalid template: ${template}`)
    process.exit();
}
fs.outputFileSync(filename, content)
```

- Résultat ✅ — [🎬 voir la vidéo de démo](/images/blog/2026-11-11/zx-example-3-user-inputs.mp4)

### Exemple 4 - Gérer les arguments de la ligne de commande

- Script 📋

```jsx
#!/usr/bin/env zx
$.verbose = false
const size = argv.size;
const isFullScreen = argv.fullscreen;
console.log(`size=${size}`);
console.log(`fullscreen=${isFullScreen}`);
```

```jsx
zx ./script.mjs --size=100x50 --fullscreen
```

- Résultat ✅

![Résultat de l'exemple 4 de zx](/images/blog/2026-11-11/zx-example-4-cli-arguments.png)

### Exemple 5 - Requêtes réseau

- En bash, on utilise souvent la commande `curl` pour faire des requêtes HTTP dans les scripts Bash.

  `zx` では `node-fetch` module を裏で wrap してくれて `fetch` でできます！

- Script 📋

```jsx
#!/usr/bin/env zx
$.verbose = false
let response = await fetch('https://api.sampleapis.com/coffee/hot');
if(response.ok) {
  console.log(await response.text());
}
```

- Résultat ✅

![Résultat de l'exemple 5 de zx](/images/blog/2026-11-11/zx-example-5-network-requests.png)

### Exemple 6 - **Construire des pipelines de commandes**

- Script 📋

```jsx
#!/usr/bin/env zx
$.verbose = false
// A pipeline using |
let greeting = await $`echo "Hello World" | tr '[l]' [L]`

console.log(`${greeting}`)
```

```jsx
#!/usr/bin/env zx
$.verbose = false;
// The same pipeline but with the .pipe() method
const greeting = await $`echo "Hello World"`.pipe($`tr '[l]' [L]`);

console.log(`greeting -> ${greeting}`);

// Using full JS
const greetingJs = "Hello World".replaceAll("l", "L");

console.log(`greetingJs -> ${greetingJs}`);
```

- Résultat ✅

![Résultat de l'exemple 6 de zx](/images/blog/2026-11-11/zx-example-6-pipelines.png)

### Exemple 7 - **Manipuler du JSON**

- Script 📋

```jsx
#!/usr/bin/env zx
$.verbose = false;

console.log("Retrieving coffees 🔍");
const response = await fetch("https://api.sampleapis.com/coffee/hot");
const coffees = JSON.parse(await response.text());

for (let i = 0; i < coffees.length; i++) {
  const coffee = coffees[i];
  console.log(`${coffee.id} - ${coffee.title} 🥰`);
}
```

- Résultat ✅

![Résultat de l'exemple 7 de zx](/images/blog/2026-11-11/zx-example-7-json.png)

### Exemple 8 - pre-commit

- Script 📋

```jsx
#!/usr/bin/env -S npx zx
$.verbose = false;

console.log(`--- Execute npx lint-staged --allow-empty ---'`);
await $`npx lint-staged --allow-empty`;

console.log(`--- Staged files ---'`);
let stagedFiles;
try {
  stagedFiles =
    await $`git diff --cached --name-only --diff-filter=AM | grep '\.rb$'`;
} catch {
  console.log("No .rb file staged. Execute commit.");
}

if (stagedFiles) {
  console.log(`--- Rubocopで警告がないかチェック ---'`);
  await $`git diff --cached --name-only --diff-filter=AM | grep '\.rb$' | xargs docker-compose run --rm offers-app rubocop --color --auto-correct --force-exclusion {staged_files}`;
}
```

- Résultat ✅

![Résultat de l'exemple 8 de zx](/images/blog/2026-11-11/zx-example-8-pre-commit.png)

### Conclusion

- `zx` rend vraiment **les scripts shell plus faciles à écrire et à lire grâce à la syntaxe Javascript** ⚡️
- Maîtrisons `zx` et **disons enfin adieu aux scripts shell compliqués** 👋

### Références

- [https://github.com/google/zx](https://github.com/google/zx)
- [https://zenn.dev/offers/articles/20220606-zx-introduction](https://zenn.dev/offers/articles/20220606-zx-introduction)
- [https://blog.mastykarz.nl/create-scripts-javascript-zx/](https://blog.mastykarz.nl/create-scripts-javascript-zx/)
- [https://www.sitepoint.com/google-zx-write-node-shell-scripts/](https://www.sitepoint.com/google-zx-write-node-shell-scripts/)

---

## Blockchain 101 ⛓ Comment développer une DApp 90年代メルカリー ☎️

### Qu'est-ce que la blockchain ? 🤔

- Selon [investopedia.com](https://www.investopedia.com/terms/b/blockchain.asp),

> Une blockchain est une base de données ou un registre distribué, partagé entre les nœuds d'un réseau informatique.

### Un monde sans blockchain 💾

- Prenons l'exemple des banques 🏦
    - Chaque banque gère un registre (une sorte de base de données qui enregistre toutes les transactions monétaires) et en a le **contrôle total** ⇒ elles ont beaucoup de **pouvoir** et de **responsabilités** 💥
    - Et si quelqu'un corrompait le registre d'une banque 😱 Et si une banque commençait à contourner les règles et parvenait à créer de la valeur à partir de rien en manipulant son registre 😱

![Registres bancaires](/images/blog/2026-11-11/blockchain-bank-ledger.png)

- Dans un monde sans blockchain, il faut faire confiance à un tiers pour enregistrer toutes les transactions

### L'arrivée du Bitcoin en 2008 💡

- Le Bitcoin est apparu en 2008 avec un livre blanc publié par Satoshi Nakamoto 🇯🇵 pour introduire un nouveau **type de système monétaire** et un moyen **décentralisé** de créer, transférer et stocker de la valeur sous une forme entièrement numérique

![Réseau décentralisé du Bitcoin](/images/blog/2026-11-11/blockchain-bitcoin.png)

- Le Bitcoin est une implémentation de la blockchain, mais il en existe d'autres comme Ethereum.

### Les objectifs de conception de la blockchain 👩‍🎨

- [ ] Distribution des données en pair-à-pair (Peer-to-peer データ配布)

```jsx
Data is distributed across the nodes in the network.
Tasks and workload are distributed and all nodes are equally priviledged.
Each node contains a full copy of the blockchain state.
```

- [ ] Décentralisation (分散化)

```jsx
No master data, thus avoiding a single point of failure. Corruption then becomes much more difficult. 
To make data consistent across all the network, an algorithm called "consensus algorithm" is adopted.
```

- [ ] Immuabilité (不変性)

```jsx
You can not change history and can only append operations. Even delete operations are considered as transactions.
```

- [ ] Sans tiers de confiance (トラストレス)

```jsx
You don't have to trust a third party: bank, person, etc.
Rather, you trust everyone in the blockchain.
```

### Les implémentations de la blockchain 🧑‍💻

- Le Bitcoin a été la **première** implémentation
    - L'objectif du Bitcoin est de remplacer les monnaies nationales
    - Rien de plus qu'un moyen d'échange et une réserve de valeur monétaire 💵
- Mais alors, pourquoi ne pas appliquer les mêmes principes de manière **plus générique** ? 🎟 📜 🎶
    - Au lieu de certifier que je suis le véritable **propriétaire de quelques Bitcoins**, on pourrait aussi mettre en place une technologie similaire pour certifier que je suis le véritable **propriétaire d'une œuvre d'art, de billets de concert, de certifications AWS**
    - Vitalik Buterin a eu cette idée et a implémenté *une autre version de la blockchain* : **Ethereum** 🥳

### Ethereum et les smart contracts

- La monnaie est l'**ETH** (Ether)
- Les smart contracts sont les briques de base du réseau Ethereum

```jsx
- They are computed programs coded by developers that are run in the Ethereum network
- Once deployed, they cannot be changed. Remember, the blockchain is immutable
- A smart contract has a state (data) and functions
- A smart contract has an address on the Ethereum blockchain like any other Ethereum user account
```

- Explication simple 🐥

```jsx
- A smart contract is like a vending machine 🤖
- It has some state (🍫 🥤 🍙)  and some functions (view products / buy product / recharge product)
- Once you installed it somewhere, you cannot move it or change its functioning FOREVER 
- It has an address (location in the real world) and like any other person wallet, it has some money in it
```

- Toutes les transactions qui **modifient un état dans la blockchain sont soumises à des frais** 💰 (déployer un smart contract, acheter un produit, recharger un distributeur automatique…)

### Implémentons maintenant un smart contract et construisons une application décentralisée - 90年代メルカリ ☎️

### Technologies et outils 🛠

- **Réseau Ethereum**
- Le langage de programmation **Solidity** pour implémenter des smart contracts sur Ethereum
- La **bibliothèque web3.js** pour interagir avec le réseau Ethereum depuis notre navigateur 🖥
- L'**extension Chrome Metamask** 🦊, un portefeuille utilisé pour interagir avec la blockchain Ethereum
- **Ganache** pour déployer une blockchain Ethereum en local (simulateur)

![Technologies et outils](/images/blog/2026-11-11/blockchain-tools.png)

### Architecture 📊

#### Comparaison entre une architecture Web 2.0 classique et une architecture Web 3.0

![Architecture Web 2.0 vs Web 3.0](/images/blog/2026-11-11/blockchain-web2-vs-web3.png)

### Jetons un œil au code 👨🏻‍💻

[https://github.com/tonystrawberry/mercari90-dapp](https://github.com/tonystrawberry/mercari90-dapp)

### C'est l'heure de la démo ⏰

- Smart contract の migration
- Metamask で accounts の セットアップ
- 開発環境の立ち上げ
- Mise en vente d'un produit
- Ganache で transaction の確認
- Achat d'un produit
- Ganache で transaction の確認

### Références 📚

- [https://www.udemy.com/course/getting-started-with-ethereum-solidity-development/](https://www.udemy.com/course/getting-started-with-ethereum-solidity-development/)
- [https://arunrajeevan.medium.com/blockchain-design-goals-3be234ccfaf3](https://arunrajeevan.medium.com/blockchain-design-goals-3be234ccfaf3)
- [https://docs.soliditylang.org/en/v0.8.15/](https://docs.soliditylang.org/en/v0.8.15/)

## 皆さんありがとうございました！🙇🏻‍♂️

- 質問があれば、気楽聞いてください
- このプレゼンテーションは Confluence の TechTalks の下にみれます：[https://monstarlab-jp.atlassian.net/wiki/spaces/CD/pages/447087534/Tech+Talk+-+20220728](https://monstarlab-jp.atlassian.net/wiki/spaces/CD/pages/447087534/Tech+Talk+-+20220728)

---

> 🌐 *Traduit par Claude*
