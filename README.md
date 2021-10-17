# decentraland-compi-utils
Tool to display compicactus NPCs on Decentraland

[![Publish NPM package](https://github.com/SoapPunk/decentraland-compi-utils/actions/workflows/master.yml/badge.svg?branch=main)](https://github.com/SoapPunk/decentraland-compi-utils/actions/workflows/master.yml)

- Website: https://compicactus.com
- Buy NFT: https://play.decentraland.org/?position=47%2C-45

Compicactus is a PFP project to build a community around the creation of intelligent virtual beings for the metaverse.
GPT-3 is amazing, but Compicactus will use technologies that don't need any kind of centralized service, and allow the execution of the AI locally. This is paramount to ensure privacy and full control of personal data.

If you are interested in the project join us and share it with friends! 🤖

---

## Usage on Decentraland

To use Compis in your Decentraland scene:

1. Install the library as an npm bundle. Run this command in your scene's project folder:

```
npm i @compicactus/dcl-scene-utils -B
```

2. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

3. Import the library into the scene's script. Add this line at the start of your `game.ts` file, or any other TypeScript files that require it:

```ts
import {
    CompiNPC,
    CompiNPCSystem,
    Blockchain,
    CHARACTER,
    NETWORK
} from '@compicactus/dcl-scene-utils'
```

4. In your TypeScript file, create an `Blockchain` type object, passing it the network to use, and the type of character:

```ts
const network_compi = new Blockchain(NETWORK.MATIC, CHARACTER.COMPICACTUS)
```

5. Add a CompiNPC system:

```ts
engine.addSystem(new CompiNPCSystem())
```

6. Add the CompiNPC entity:

```ts
let compi = new CompiNPC(-1, network_compi)
compi.addComponent(new Transform({
    position: new Vector3(8, 1.5, 8)
}))
engine.addEntity(compi)
```

Done! Now you can run de scene and setup your Compicactus.

## Adding questions

You can add questions and answers, that will be stored on-chain, to allow interactivity with the characters.

1. Click on the Add Question (+) button (Note: Questions can't be edited).
2. Enter your question, and press Enter.
3. Confirm the signature on Metamask and wait arount 10 seconds.
4. Click on the white panel to ask the new question, you will see a default answer.
5. Click on the Edit Answer (pencil) button.
6. Enter the new answer, and press Enter.
7. Confirm the signature on Metamask and wait arount 10 seconds.
8. Click on the white panel to ask the new question, you will see the new answer.

## Editing questions

Questions can't be edited, only the answers. You will need to add a new Question/Answer and remove the previous one.

# Removing questions

Questions can be removed using the Remove Question (x) button. But take into acount that the order in wich are displayed will be disrupted in the following way:

- Q1
- Q2
- Q3

Removing Q1 will result in:

- Q3
- Q2

The last question takes the place of the removed question.

## Adding metadata to answers

You can include a JSON object in your answers to tell the character aditional information about how to perform.

Fire animations:
`So funny! {"emote":"lol"}`

Play sounds:
`Warning! {"audio":"https://cors-enabled-server/warning.mp3"`

The list of emotes is:
- `dance`
- `lol`
- `alert`
- `swing`
- `look_l`
- `look_r`
- `look_r_l`
- `look_up`
- `pissed_off`
- `sigh`
- `sleep`
- `yawn`

---

## Contribute

In order to test changes made to this repository in active scenes, do the following:

1. Run `npm run build` for the internal files of the library to be generated
2. Run `npm run link` on this repository
3. On a new Decentraland scene, import this library as you normally would and include the tests you need
4. On the scene directory, run `npm link @dcl/npc-scene-utils`

> Note: When done testing, run `npm unlink` on both folders, so that the scene stops using the local version of the library.


## CI/CD

This repository uses `semantic-release` to atumatically release new versions of the package to NPM.

Use the following convention for commit names:

`feat: something`: Minor release, every time you add a feature or enhancement that doesn’t break the api.

`fix: something`: Bug fixing / patch

`chore: something`: Anything that doesn't require a release to npm, like changing the readme. Updating a dependency is **not** a chore if it fixes a bug or a vulnerability, that's a `fix`.

If you break the API of the library, you need to do a major release, and that's done a different way. You need to add a second comment that starts with `BREAKING CHANGE`, like:

```
commit -m "feat: changed the signature of a method" -m "BREAKING CHANGE: this commit breaks the API, changing foo(arg1) to foo(arg1, arg2)"
```

---

bafybeieulrnv5cswdkzt3q5os3dio6oc2mxbuxnsqbkhcfwre2udpyzxni
