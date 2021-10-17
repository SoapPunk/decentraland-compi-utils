# decentraland-compi-utils
Tool to display compicactus NPCs on Decentraland

[![Publish NPM package](https://github.com/SoapPunk/decentraland-compi-utils/actions/workflows/master.yml/badge.svg?branch=main)](https://github.com/SoapPunk/decentraland-compi-utils/actions/workflows/master.yml)

To use Compis in your scene:

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
