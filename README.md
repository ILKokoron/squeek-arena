# Squeek Arena

A retro, black and white quiz battle game built on Squeekchain, the hamster-powered toychain that settles on Ethereum Sepolia. Live at https://squeekarena.web.id

## What it is

Pick a trainer, connect a wallet on Sepolia, and mint your hamster partner from the gacha box. Then climb a five-boss ladder against Squeektoshi, who fights under the names of knowledge gods: BRAGI Lv 1, THOTH Lv 2, SARASWATI Lv 3, ENKI Lv 4, NOUS Lv 5. Battles are Pokemon-style quiz duels: answer Squeekchain questions against the clock to deal damage, build combos, and crit on fast answers. Beat NOUS and you are certified Squeekchain fams.

One pull in a thousand wins AURUM, the rare golden hamster that attacks directly with no quiz.

## How it uses Squeekchain

- Live API: the game reads https://api.squeekchain.com/v1/status in real time. While Squeektoshi is really running on the WHEELY9000, bosses get an attack buff, and battles mix in live questions generated from the chain's current state (block height, block progress, total distance, settled rounds). Live questions are re-read when they appear and re-checked when answered, so grading always follows the freshest API data.
- Network screen: a live view of the chain (block height, current round, settled rounds, and a pace figure the game measures itself), with an animated scene of Squeektoshi that runs or sleeps together with the real hamster.
- Onchain partners: your hamster is a real NFT from the companion Squeek Arena Pets contract (ERC-721, Sepolia). The first mint per wallet is free and costs only gas; extra mints cost 0.002 Sepolia ETH each. Pet ownership is read from the chain and is the source of truth for your partner. Sprite art is generated from pixel grids and rendered fully onchain as SVG, no IPFS.

Contracts (Sepolia):

- SqueekArenaPets: 0x3ac243475b0D782a05B40Eb9546E25bb986BB6DD
- SqueekArenaMeta (art and metadata): 0x985229B3Ba7AC0cA66Fc0d540B31deddA8125b39

## Tech notes

Static site: plain HTML, CSS, and JavaScript, no build step and no backend. Battle progress and XP live in the browser (localStorage); pet ownership lives onchain. Wallet connection is per visit, with the sign-in signature remembered for a week per wallet.

Run the logic tests with: node test/arena-tests.cjs

squeekchain-project: 6d63bf1a-0b45-4977-a4f7-4b868ca1de3b
