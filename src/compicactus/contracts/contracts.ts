import { getUserPublicKey } from "@decentraland/Identity"
import { getProvider } from "@decentraland/web3-provider"
//import { connection, ProviderType } from 'decentraland-connect'
import { sleep } from "../common"
//import { sendMetaTransaction } from "decentraland-transactions";
//import { sendMetaTransaction } from "./src/sendMetaTransaction";
import * as eth from "eth-connect"

//import { ethers } from 'ethers'

import abiMANA from './erc20Abi'
import abiMinter from './minterAbi'
import abiPFP from './pfpAbi'
import abiBrain from './brainAbi'

import {
  getAccount,
  getNonce,
  getSignature,
  getExecuteMetaTransactionData,
  getSalt,
  isContract,
  getSignatureParameters
} from './meta/utils'

import {
  Provider,
  Configuration,
  DataToSign,
  ContractData,
  DomainData,
  DOMAIN_TYPE,
  META_TRANSACTION_TYPE
} from './meta/types'

// import {domainType, metaTransactionType} from './utils'

import { CHARACTER, NETWORK } from "../constants"

export class Blockchain {
    metaRequestManager: any
    provider: any
    network: string
    minter_contract:any
    pfp_contract:any
    mana_contract:any
    brain_contract:any
    contracts:any
    character: number
    // functionSetGreeting = new eth.SolidityFunction(this.getFunction("setGreeting", abiMinter));

    constructor(network: string, character: number) {
        if (network != NETWORK.MUMBAI && network != NETWORK.MATIC && network != NETWORK.MOCKUP) {
            throw new Error(`Network not found: ${network}`)
        }
        if (character != CHARACTER.COMPICACTUS && character != CHARACTER.VOXTER) {
            throw new Error(`Character not found: ${character}`)
        }

        /*const publicKeyRequest = executeTask(async () => {
          const publicKey = await getUserPublicKey()
          log(publicKey)
          return publicKey
        })*/

        this.contracts = this.getContracts(character)
        this.character = character

        this.network = network
        if (network == NETWORK.MUMBAI) {
            //this.provider = new eth.WebSocketProvider("wss://rpc-mainnet.maticvigil.com/ws/v1/")
            //this.provider = new eth.HTTPProvider("https://rpc-mumbai.maticvigil.com")
            this.provider = new eth.HTTPProvider("https://matic-mumbai.chainstacklabs.com/")
            this.mana_contract = this.contracts.mana.mumbai
            this.minter_contract = this.contracts.minter.mumbai
            this.pfp_contract = this.contracts.pfp.mumbai
            this.brain_contract = this.contracts.brain.mumbai
        } else if (network == NETWORK.MATIC) {
            this.provider = new eth.HTTPProvider("https://rpc-mainnet.maticvigil.com")
            this.mana_contract = this.contracts.mana.matic
            this.minter_contract = this.contracts.minter.matic
            this.pfp_contract = this.contracts.pfp.matic
            this.brain_contract = this.contracts.brain.matic
        }
        this.metaRequestManager = new eth.RequestManager(this.provider)
    }

    getContracts(character: number) {
        let pfp_contract: any
        if (character == CHARACTER.COMPICACTUS) {
            pfp_contract = {
                matic: {
                    address: '0xB1Eb9BE1Cf04a19448355893ca357f6F010b03B6',
                    name: 'CompiPFP'
                },
                mumbai: {
                    address: '0xcF904EeCa0dC1d99E6c4Be05f6C9a733041Ce093',
                    name: 'CompiPFP'
                }
            }
        } else if (character == CHARACTER.VOXTER) {
            pfp_contract = {
                matic: {
                    address: '0x764e5a8c9ca14b456f5afbf31bfb2fa7f1e002b6',
                    name: 'Voxters'
                },
                mumbai: {
                    address: '',
                    name: ''
                }
            }
        }

        return {
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
                    address: '0x2E88409bD7eBc3A7b68b808994E2873645b1128D',
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
                    address: pfp_contract.matic.address,
                    name: pfp_contract.matic.name,
                    chainId: 137
                },
                mumbai: {
                    version: '1',
                    abi: abiPFP,
                    address: pfp_contract.mumbai.address,
                    name: pfp_contract.mumbai.name,
                    chainId: 80001
                }
            },
            brain: {
                matic: {
                    version: '1',
                    abi: abiBrain,
                    //address: '0x64406Be782d00E497ae1CdDFaB1bE1AA2787F02C',
                    address: '0x89e2558091D28290B834ddd42e59E2b72D07Fe0B',
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

        log("functionSignature", functionSignature)
        log("functionSignature.data", functionSignature.data)

        const provider = await getProvider();
        //const { provider } = await connection.connect(ProviderType.INJECTED)
        const requestManager: any = new eth.RequestManager(provider);

        const account = await getUserPublicKey()

        log("Sending meta transaction")

        const nonce = await getNonce(
            this.metaRequestManager,
            account,
            contractConfig.address
        )

        log("nonce", nonce)

        const salt = getSalt(contractConfig.chainId)

        const domainData = getDomainData(salt, contractConfig)

        const dataToSign = getDataToSign(
            account,
            nonce,
            functionSignature.data,
            domainData
        )
        log("dataToSign", dataToSign)
        const signature = await getSignature(
            requestManager,
            account,
            JSON.stringify(dataToSign)
        )

        log("signature", signature)

        let { r, s, v } = getSignatureParameters(signature)

        return sendTransaction(account, contractConfig, functionSignature.data, r, s, v)

    }

    async prepareMetaTransaction_old(functionSignature: any, contractConfig: any) {
        /*
        const provider = await getProvider();
        const requestManager: any = new eth.RequestManager(provider);

        return sendMetaTransaction(
          requestManager,
          this.metaRequestManager,
          functionSignature.data,
          contractConfig
        )
        */
    }

    async getFactory(contractConfig: any) {
        const requestManager: any = new eth.RequestManager(this.provider);

        const factory = new eth.ContractFactory(requestManager, contractConfig.abi)
        const contract = await factory.at(contractConfig.address)

        return contract
    }

    async waitTX(tx) {
        const requestManager: any = new eth.RequestManager(this.provider);

        let receipt = null
        while (receipt == null) {
            //await delay(2000)
            sleep(2000)
            receipt = await requestManager.eth_getTransactionReceipt(tx.toString())
        }
        return receipt
    }

    // Functions

    // Minter
    async getPrice() {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer([10000000000000000000, false])
        const publicKeyRequest = await getUserPublicKey()

        log("publicKeyRequest", publicKeyRequest)

        return this.getFactory(
            this.minter_contract
        ).then(async ( contract: any ) => {
            return await contract.getPrice(publicKeyRequest)
        })
    }

    wei2human(wei: string) {
        return eth.fromWei(wei, 'ether')
    }

    async isWindowOpen() {
        return this.getFactory(
            this.minter_contract
        ).then(async ( contract: any ) => {
            return await contract.isWindowOpen()
        })
    }

    async getTimeWindow() {
        return this.getFactory(
            this.minter_contract
        ).then(async ( contract: any ) => {
            return await contract.getTimeWindow()
        })
    }

    async mintCompi(maxPrice: string) {
        const functionMintCompi = new eth.SolidityFunction(this.getFunction("mintCompi", abiMinter));
        const functionSignature = functionMintCompi.toPayload([maxPrice]);
        log(functionSignature)
        //return this.prepareMetaTransaction(functionSignature, this.minter_contract).then().catch()
        return this.prepareMetaTransaction(functionSignature, this.minter_contract).then(async (tx) => {
            log("increaseAllowance TX ", tx)
            return this.waitTX(tx)
        }).then().catch()
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
        //return this.prepareMetaTransaction(functionSignature, this.mana_contract).then().catch()
        return this.prepareMetaTransaction(functionSignature, this.mana_contract).then(async (tx) => {
            log("increaseAllowance TX ", tx)
            return this.waitTX(tx)
        }).then().catch()
    }

    // PFP
    async balanceOf() {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer(3)
        const publicKeyRequest = await getUserPublicKey()

        log("publicKeyRequest", publicKeyRequest)

        return this.getFactory(
            this.pfp_contract
        ).then(async ( contract: any ) => {
            return await contract.balanceOf(publicKeyRequest)
        })
    }

    async tokenOfOwnerByIndex(tokenId: number) {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer(tokenId)
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
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer("Mockup Name")
        return this.getFactory(
            this.brain_contract
        ).then(async ( contract: any ) => {
            return await contract.getName(this.pfp_contract.address, tokenId)
        })
    }

    async getQuestionsCount(id:number) {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer(30)
        const scene = "default"
        return this.getFactory(
            this.brain_contract
        ).then(async ( contract: any ) => {
            return await contract.getQuestionsCount(this.pfp_contract.address, id, scene)
        })
    }

    async setName(id:number, name:string) {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer(0)
        const functionSetName = new eth.SolidityFunction(this.getFunction("setName", abiBrain));
        const functionSignature = functionSetName.toPayload([this.pfp_contract.address, id, name]);
        log(functionSignature)
        //return this.prepareMetaTransaction(functionSignature, this.brain_contract).then().catch()
        return this.prepareMetaTransaction(functionSignature, this.brain_contract).then(async (tx) => {
            log("setName TX ", tx)
            return this.waitTX(tx)
        }).then().catch()
    }

    async addQuestion(id:number, question:string, answer:string) {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer(0)
        const scene = "default"
        const functionAddQuestion = new eth.SolidityFunction(this.getFunction("addQuestion", abiBrain));
        const functionSignature = functionAddQuestion.toPayload([this.pfp_contract.address, id, scene, question, answer]);
        log(functionSignature)
        //return this.prepareMetaTransaction(functionSignature, this.brain_contract).then().catch()
        return this.prepareMetaTransaction(functionSignature, this.brain_contract).then(async (tx) => {
            log("addQuestion TX ", tx)
            return this.waitTX(tx)
        }).then().catch()
    }

    async removeQuestion(id:number, question:string, questionId:number) {
        if (this.network == NETWORK.MOCKUP){
            log("removeQuestion", question, questionId)
            return await this.mockupAnswer(0)
        }
        const scene = "default"
        const functionRemoveQuestion = new eth.SolidityFunction(this.getFunction("removeQuestion", abiBrain));
        const functionSignature = functionRemoveQuestion.toPayload([this.pfp_contract.address, id, scene, question, questionId]);
        log(functionSignature)
        //return this.prepareMetaTransaction(functionSignature, this.brain_contract).then().catch()
        return this.prepareMetaTransaction(functionSignature, this.brain_contract).then(async (tx) => {
            log("removeQuestion TX ", tx)
            return this.waitTX(tx)
        }).then().catch()
    }

    async getAnswer(id:number, question:string) {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer(`This is an answer to ${id} ${question}`)
        const scene = "default"
        return this.getFactory(
            this.brain_contract
        ).then(async ( contract: any ) => {
            return await contract.getAnswer(this.pfp_contract.address, id, scene, question)
        })
    }

    async getQuestions(id:number, offset:number) {
        if (this.network == NETWORK.MOCKUP) return await this.mockupAnswer(this.getMockupQuestions(id, offset))
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

function getDataToSign(
  account: string,
  nonce: string,
  functionSignature: string,
  domainData: DomainData
): DataToSign {
  return {
    types: {
      EIP712Domain: DOMAIN_TYPE,
      MetaTransaction: META_TRANSACTION_TYPE
    },
    domain: domainData,
    primaryType: 'MetaTransaction',
    message: {
      nonce: parseInt(nonce, 16),
      from: account,
      functionSignature: functionSignature
    }
  }
}

function getDomainData(salt: string, contractData: ContractData): DomainData {
  return {
    name: contractData.name,
    version: contractData.version,
    verifyingContract: contractData.address,
    salt
  }
}

async function sendTransaction (userAddress: string, contractConfig: any, functionData: any, r:string, s:string, v: number) {
    try {
        if (contractConfig.name != "CompiBrain") {
            throw new Error("Only CompiBrain allowed");
        }
        let tx = await fetch(`https://api.biconomy.io/api/v2/meta-tx/native`, {
            method: "POST",
            headers: {
                "x-api-key" : "i9-eTBtwe.d7329c08-cc47-4c48-ae64-6cb6b6cf81e4",
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                "to": contractConfig.address,
                "apiId": "45770c1c-bc67-41c1-8948-530da59fd7d1",
                "params": [userAddress, functionData, r, s, v],
                "from": userAddress
            })
        })
        .then(response=>response.json())
        .then(async function(result) {
            log(result);
            return result.txHash;
            //showInfoMessage(`Transaction sent by relayer with hash ${result.txHash}`);

            //let receipt = await getTransactionReceiptMined(result.txHash, 2000);
            //setTransactionHash(result.txHash);
            //showSuccessMessage("Transaction confirmed on chain");
            //getQuoteFromNetwork();
        }).catch(function(error) {
            log(error)
        })
        return tx;
    } catch (error) {
        log(error);
    }
};
