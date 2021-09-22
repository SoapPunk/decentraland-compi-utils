//import { getUserAccount } from '@decentraland/EthereumController'
import { getUserPublicKey } from "@decentraland/Identity"
import { getProvider } from "@decentraland/web3-provider";
import { sleep } from "./common"
import {
  //ContractName,
  //getContract,
  sendMetaTransaction,
} from "decentraland-transactions";
import * as eth from "eth-connect";

import abiMANA from './erc20Abi'
import abiMinter from './minterAbi' 
import abiPFP from './pfpAbi'
import abiBrain from './brainAbi'

export const contracts = {
    mana: {
        matic: {
            version: '1',
            abi: abiMANA,
            address: '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4',
            name: '(PoS) Decentraland MANA',
            chainId: 137
        },
        mumbai: {
            version: '1',
            abi: abiMANA,
            //address: '0x882Da5967c435eA5cC6b09150d55E8304B838f45',
            address: '0x4dA830330048be6380f102a83d3B94ea318bc598',  // Test contract
            name: 'Decentraland MANA (PoS)',
            chainId: 80001
        }
    },
    minter: {
        matic: {
            version: '1',
            abi: abiMinter,
            address: '0xd5140d7b09B5DFB0C17e9bAb6EC8a7875B19367C',
            name: 'CompiMinter',
            chainId: 137
        },
        mumbai: {
            version: '1',
            abi: abiMinter,
            address: '0x0d7c91B526bA1334be837a82e92d6ca47ac6bCD7',
            name: 'CompiMinter',
            chainId: 80001
        }
    },
    pfp: {
        matic: {
            version: '1',
            abi: abiPFP,
            address: '0xB1Eb9BE1Cf04a19448355893ca357f6F010b03B6',
            name: 'CompiPFP',
            chainId: 137
        },
        mumbai: {
            version: '1',
            abi: abiPFP,
            address: '0xcF904EeCa0dC1d99E6c4Be05f6C9a733041Ce093',
            name: 'CompiPFP',
            chainId: 80001
        }
    },
    brain: {
        matic: {
            version: '1',
            abi: abiBrain,
            address: '0x64406Be782d00E497ae1CdDFaB1bE1AA2787F02C',
            name: 'CompiBrain',
            chainId: 137
        },
        mumbai: {
            version: '1',
            abi: abiBrain,
            address: '0x308aF74242aFb7bC598Ff1ced52De1D3E6cb02d7',
            name: 'CompiBrain',
            chainId: 80001
        }
    }
}

export class Blockchain {
    metaRequestManager: any
    provider: any
    network: string
    minter_contract:any
    pfp_contract:any
    mana_contract:any
    brain_contract:any
    // functionSetGreeting = new eth.SolidityFunction(this.getFunction("setGreeting", abiMinter));

    constructor(network="mumbai") {
        if (network != "mumbai" && network != "matic" && network != "mockup") {
            throw new Error("Network not found: " + network)
        }
        /*const publicKeyRequest = executeTask(async () => {
          const publicKey = await getUserPublicKey()
          log(publicKey)
          return publicKey
        })*/
        this.network = network
        if (network == "mumbai") {
            //this.provider = new eth.WebSocketProvider("wss://rpc-mainnet.maticvigil.com/ws/v1/")
            //this.provider = new eth.HTTPProvider("https://rpc-mumbai.maticvigil.com")
            this.provider = new eth.HTTPProvider("https://matic-mumbai.chainstacklabs.com/")
            this.mana_contract = contracts.mana.mumbai
            this.minter_contract = contracts.minter.mumbai
            this.pfp_contract = contracts.pfp.mumbai
            this.brain_contract = contracts.brain.mumbai
        } else if (network == "matic") {
            this.provider = new eth.HTTPProvider("https://rpc-mainnet.maticvigil.com")
            this.mana_contract = contracts.mana.matic
            this.minter_contract = contracts.minter.matic
            this.pfp_contract = contracts.pfp.matic
            this.brain_contract = contracts.brain.matic
        }
        this.metaRequestManager = new eth.RequestManager(this.provider)
    }

    getFunction(name: string, abi: Array<any>) {
        for (let n=0; n < abi.length; n++) {
            if (abi[n].type == "function" && abi[n].name == name) {
                return abi[n]
            }
        }
        //log(abi)
        throw new Error("Function not found: " + name)
    }

    async prepareMetaTransaction(functionSignature: any, contractConfig: any) {
        const provider = await getProvider();
        const requestManager: any = new eth.RequestManager(provider);

        return sendMetaTransaction(
          requestManager,
          this.metaRequestManager,
          functionSignature.data,
          contractConfig
        )
    }

    async getFactory(contractConfig: any) {
        const requestManager: any = new eth.RequestManager(this.provider);

        const factory = new eth.ContractFactory(requestManager, contractConfig.abi)
        const contract = await factory.at(contractConfig.address)

        return contract
    }

    // Functions

    // Minter
    async getPrice() {
        if (this.network == "mockup") return await this.mockupAnswer([10000000000000000000, false])
        const publicKeyRequest = await getUserPublicKey()

        log("publicKeyRequest", publicKeyRequest)

        return this.getFactory(
            this.minter_contract
        ).then(async ( contract: any ) => {
            return await contract.getPrice(publicKeyRequest)
        })
    }

    async isWindowOpen() {
        return this.getFactory(
            this.minter_contract
        ).then(async ( contract: any ) => {
            return await contract.isWindowOpen()
        })
    }

    async mintCompi(maxPrice: string) {
        const functionMintCompi = new eth.SolidityFunction(this.getFunction("mintCompi", abiMinter));
        const functionSignature = functionMintCompi.toPayload([maxPrice]);
        log(functionSignature)
        return this.prepareMetaTransaction(functionSignature, this.minter_contract).then().catch()
    }

    // Mana
    async balance() {
        const publicKeyRequest = await getUserPublicKey()

        return this.getFactory(
            this.mana_contract
        ).then(async ( contract: any ) => {
            return await contract.balanceOf(publicKeyRequest)
        })
    }

    async increaseAllowance(amount: string) {
        const functionApprove = new eth.SolidityFunction(this.getFunction("increaseAllowance", abiMANA));
        //const amountValue = eth.toWei(amount, 'ether')
        const functionSignature = functionApprove.toPayload([this.minter_contract.address, amount]);
        log(functionSignature)
        return this.prepareMetaTransaction(functionSignature, this.mana_contract).then().catch()
    }

    // PFP
    async balanceOf() {
        if (this.network == "mockup") return await this.mockupAnswer(3)
        const publicKeyRequest = await getUserPublicKey()

        log("publicKeyRequest", publicKeyRequest)

        return this.getFactory(
            this.pfp_contract
        ).then(async ( contract: any ) => {
            return await contract.balanceOf(publicKeyRequest)
        })
    }

    async tokenOfOwnerByIndex(tokenId: number) {
        if (this.network == "mockup") return await this.mockupAnswer(tokenId)
        const publicKeyRequest = await getUserPublicKey()

        log("publicKeyRequest", publicKeyRequest)

        return this.getFactory(
            this.pfp_contract
        ).then(async ( contract: any ) => {
            return await contract.tokenOfOwnerByIndex(publicKeyRequest, tokenId)
        })
    }

    // Brain
    async getName(tokenId: number) {
        if (this.network == "mockup") return await this.mockupAnswer("Mockup Name")
        return this.getFactory(
            this.brain_contract
        ).then(async ( contract: any ) => {
            return await contract.getName(this.pfp_contract.address, tokenId)
        })
    }

    async getQuestionsCount(id:number) {
        if (this.network == "mockup") return await this.mockupAnswer(30)
        const scene = "default"
        return this.getFactory(
            this.brain_contract
        ).then(async ( contract: any ) => {
            return await contract.getQuestionsCount(this.pfp_contract.address, id, scene)
        })
    }

    async setName(id:number, name:string) {
        if (this.network == "mockup") return await this.mockupAnswer(0)
        const functionSetName = new eth.SolidityFunction(this.getFunction("setName", abiBrain));
        const functionSignature = functionSetName.toPayload([this.pfp_contract.address, id, name]);
        log(functionSignature)
        return this.prepareMetaTransaction(functionSignature, this.brain_contract).then().catch()
    }

    async addQuestion(id:number, question:string, answer:string) {
        if (this.network == "mockup") return await this.mockupAnswer(0)
        const scene = "default"
        const functionAddQuestion = new eth.SolidityFunction(this.getFunction("addQuestion", abiBrain));
        const functionSignature = functionAddQuestion.toPayload([this.pfp_contract.address, id, scene, question, answer]);
        log(functionSignature)
        return this.prepareMetaTransaction(functionSignature, this.brain_contract).then().catch()
    }

    async removeQuestion(id:number, question:string, questionId:number) {
        if (this.network == "mockup"){
            log("removeQuestion", question, questionId)
            return await this.mockupAnswer(0)
        }
        const scene = "default"
        const functionRemoveQuestion = new eth.SolidityFunction(this.getFunction("removeQuestion", abiBrain));
        const functionSignature = functionRemoveQuestion.toPayload([this.pfp_contract.address, id, scene, question, questionId]);
        log(functionSignature)
        return this.prepareMetaTransaction(functionSignature, this.brain_contract).then().catch()
    }

    async getAnswer(id:number, question:string) {
        if (this.network == "mockup") return await this.mockupAnswer(`This is an answer to ${id} ${question}`)
        const scene = "default"
        return this.getFactory(
            this.brain_contract
        ).then(async ( contract: any ) => {
            return await contract.getAnswer(this.pfp_contract.address, id, scene, question)
        })
    }

    async getQuestions(id:number, offset:number) {
        if (this.network == "mockup") return await this.mockupAnswer(this.getMockupQuestions(id, offset))
        const scene = "default"
        return this.getFactory(
            this.brain_contract
        ).then(async ( contract: any ) => {
            return await contract.getQuestions(this.pfp_contract.address, id, scene, offset)
        })
    }

    getMockupQuestions(id:number, offset:number) {
        const q = []
        let c
        if (offset < 20) {
            c = 10
        } else if (offset < 30) {
            c = 3
        } else {
            c = 0
        }
        for (let n=0; n<10; n++) {
            q.push("")
        }
        for (let n=0; n<c; n++) {
            q[n] = `Q ${n} (${id}, ${offset})`
        }
        return q
    }

    /*
    sendDonation(callback: (tx:any)=>{}, error: (e:any)=>{}) {
        const functionTransfer = new eth.SolidityFunction(this.getFunction("transfer", abiMANA));
        const addedValue = eth.toWei(10, 'ether')
        const functionSignature = functionTransfer.toPayload([
            //fromAddress,
            "0x1a1792286a870d6630a80C924B39E37eD6618082",
            String(addedValue),
        ]);
        const conf = contracts.mana.matic
        log(functionSignature)
        log(conf)
        this.prepareMetaTransaction(functionSignature, conf).then().catch()
    }

    //

    async getMensajes() {
        return this.getFactory(
            contracts.mensajes.matic
        ).then(async ( contract ) => {
            return await contract.getMessages()
        })
    }*/

    async mockupAnswer(answer: any) {
        let time = 500 + (500*Math.random())
        if (answer == 0) {
            time = 100
        }
        sleep(time)
        return answer
    }

}
