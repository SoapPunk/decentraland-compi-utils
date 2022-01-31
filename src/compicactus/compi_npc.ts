import { Blockchain } from "./contracts/contracts"
// import { Mint } from "./mint"
// import { Teach } from "./teach"
import { Compicactus, planesMenu as compicactusPlanesMenu } from "./compicactus/compicactus"
import { Voxters, planesMenu as voxtersPlanesMenu } from "./voxters/voxters"

import { FixShape } from './bugworkaround'

import { CHARACTER, EMOTE } from "./constants"

//import * as eth from "eth-connect"


const panelsAlbedoTexture = new Texture("https://dweb.link/ipfs/bafybeifaih2h275bmmessdnwk5tkbbdsc6y4aacpbiu4jdsu2numusrxne/CompiUIB.png")
//const panelsEmissiveTexture = new Texture("textures/CompiUIEmission.jpg")
const myMaterial = new Material()
myMaterial.transparencyMode = 1
myMaterial.albedoTexture = panelsAlbedoTexture
myMaterial.emissiveTexture = panelsAlbedoTexture
myMaterial.emissiveIntensity = 1
myMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5)

const canvas = new UICanvas()

const y_offset = 0.55

@Component("stool")
export class StoolComponent {
    current_compi: number = -1
    current_token: number = -1
    current_menu: number = 0

    goto_compi: number = -1
    dirty_compi: boolean = false

    play_animation: number = -1

    answer: string = ""
    answer_drawn: number = 0
    answer_dt: number = 0
    questions: string = ""
    name: string = ""

    price: string = "-"
    price_number: number = 0
    price_discount: boolean = false

    question_list: Array<{id: number, value: string}> = []
    current_qpage: number = 0
    goto_qpage: number = 0
    current_question: number = 0
    goto_question: number = 0

    name_to_set: string = ""
    answer_to_set: string = ""
    question_to_add: string = ""
    asking_question: string = ""

    dirty_questions: boolean = false

    current_action: string = ""

    forced: boolean = false

    broadcast: Array<any> = []

    working: boolean = false

    network: Blockchain
}

export class CompiNPC extends Entity {

    compi_entity: Compicactus|Voxters

    compidata_entity: Entity
    compidata_shape: TextShape = new TextShape()

    answer_entity: Entity
    answer_shape: TextShape = new TextShape()

    questions_entity: Entity
    questions_shape: TextShape = new TextShape()

    price_entity: Entity
    price_shape: TextShape = new TextShape()

    arrowleftquestions_entity: Entity
    arrowrightquestions_entity: Entity

    remove_entity: Entity = new Entity()
    editanswer_entity: Entity = new Entity()

    cancel_entity: Entity = new Entity()
    error_entity: Entity = new Entity()
    ok_entity: Entity = new Entity()
    working_entity: Entity = new Entity()

    stool_component: StoolComponent

    textInput:UIInputText

    //network: Blockchain

    planesMenu: any

    price: number

    constructor(id: number, network: Blockchain) {
        super()
        if (network.character == CHARACTER.COMPICACTUS) {
            this.planesMenu = compicactusPlanesMenu
            this.compi_entity = new Compicactus()
        } else if (network.character == CHARACTER.VOXTER) {
            this.planesMenu = voxtersPlanesMenu
            this.compi_entity = new Voxters()
        } else {
            throw new Error(`Character not found: ${network.character}`)
        }

        this.textInput = new UIInputText(canvas)

        this.stool_component = new StoolComponent()
        this.addComponent(this.stool_component)
        engine.addEntity(this)

        this.stool_component.network = network

        if (id != -1) {
            this.stool_component.forced = true
            this.stool_component.current_action = "goto_compi"
            this.stool_component.goto_compi = id
            this.stool_component.dirty_compi = true
            log("Forced")
        }

        if (!this.stool_component.forced) {
            const arrowleftcompi_entity = this.createPlane(this.planesMenu.ArrowLeftCompi)
            arrowleftcompi_entity.addComponent(
                new OnPointerDown(()=>{
                    if (this.stool_component.working) return
                    this.stool_component.current_action = "previous_compi"
                },
                {
                    hoverText: `Previous ${this.compi_entity.character_name}`
                })
            )
            const arrowrightcompi_entity = this.createPlane(this.planesMenu.ArrowRightCompi)
            arrowrightcompi_entity.addComponent(
                new OnPointerDown(()=>{
                    if (this.stool_component.working) return
                    this.stool_component.current_action = "next_compi"
                },
                {
                    hoverText: `Next ${this.compi_entity.character_name}`
                })
            )
            const addquestion_entity = this.createPlane(this.planesMenu.Add)
            addquestion_entity.addComponent(
                new OnPointerDown(() => {
                    if (this.stool_component.working) return
                    this.stool_component.current_action = "add_question"
                },
                {
                    hoverText: "Add question",
                })
            )
            this.editanswer_entity = this.createPlane(this.planesMenu.EditAnswer)
            this.editanswer_entity.getComponent(PlaneShape).visible = false
            this.editanswer_entity.addComponent(
                new OnPointerDown(() => {
                    if (this.stool_component.working) return
                    this.stool_component.current_action = "edit_answer"
                },
                {
                    hoverText: "Edit answer",
                })
            )
            this.remove_entity = this.createPlane(this.planesMenu.Remove)
            this.remove_entity.getComponent(PlaneShape).visible = false
            this.remove_entity.addComponent(
                new OnPointerDown(() => {
                    if (this.stool_component.working) return
                    this.stool_component.current_action = "remove_question"
                },
                {
                    hoverText: "Remove Question",
                })
            )
            const editname_entity = this.createPlane(this.planesMenu.EditName)
            editname_entity.addComponent(
                new OnPointerDown(() => {
                    if (this.stool_component.working) return
                    this.stool_component.current_action = "set_name"
                },
                {
                    hoverText: "Set Name",
                })
            )
            this.cancel_entity = this.createPlane(this.planesMenu.CancelRedCompi)
            engine.removeEntity(this.cancel_entity)
            this.cancel_entity.addComponent(
                new OnPointerDown(() => {
                    this.stool_component.current_action = "cancel"
                },
                {
                    hoverText: "Cancel",
                })
            )
            this.error_entity = this.createPlane(this.planesMenu.CancelRedCompi)
            engine.removeEntity(this.error_entity)
            this.error_entity.addComponent(
                new OnPointerDown(() => {
                    engine.removeEntity(this.error_entity)
                },
                {
                    hoverText: "Error. Please try again!",
                })
            )
            this.ok_entity = this.createPlane(this.planesMenu.OkGreenCompi)
            engine.removeEntity(this.ok_entity)
            this.ok_entity.addComponent(
                new OnPointerDown(() => {
                    engine.removeEntity(this.ok_entity)
                },
                {
                    hoverText: "Success",
                })
            )
            this.working_entity = this.createPlane(this.planesMenu.WorkingYellowCompi)
            engine.removeEntity(this.working_entity)
            this.working_entity.addComponent(
                new OnPointerDown(() => {},
                {
                    hoverText: "Waiting for signature. Check wallet!",
                })
            )
        }

        this.arrowleftquestions_entity = this.createPlane(this.planesMenu.ArrowLeftQuestions)
        this.arrowleftquestions_entity.addComponent(
            new OnPointerDown(() => {
                if (this.stool_component.working) return
                this.stool_component.current_action = "previous_question_page"
            },
            {
                hoverText: "Prev page",
            })
        )
        this.arrowrightquestions_entity = this.createPlane(this.planesMenu.ArrowRightQuestions)
        this.arrowrightquestions_entity.addComponent(
            new OnPointerDown(() => {
                if (this.stool_component.working) return
                this.stool_component.current_action = "next_question_page"
            },
            {
                hoverText: "Next page",
            })
        )
        const backgroundanswers_entity = this.createPlane(this.planesMenu.BackgroundAnswers)
        const backgroundcompicactus_entity = this.createPlane(this.planesMenu.BackgroundCompicactus)
        const backgroundquestions_entity = this.createPlane(this.planesMenu.BackgroundQuestions)

        const compiplaceholder_entity = this.createPlane(this.planesMenu.Compicactus)
        //const selectedquestions_entity = this.createPlane(planesMenu.SelectedQuestion)
        const name_entity = this.createPlane(this.planesMenu.Name)

        // Compicactus
        engine.removeEntity(compiplaceholder_entity)
        this.compi_entity.addComponent(compiplaceholder_entity.getComponent(Transform))
        this.compi_entity.setParent(this)
        this.compi_entity.getComponent(PlaneShape).uvs = compiplaceholder_entity.getComponent(PlaneShape).uvs

        const navigator = new OnPointerDown((e) => {
            if (this.stool_component.working) return
            if (e.buttonId == 0) {
                this.stool_component.current_action = "ask_question"
            } else if (e.buttonId == 1) {
                this.stool_component.current_action = "previous_question"
            } else if (e.buttonId == 2) {
                this.stool_component.current_action = "next_question"
            }
        },
        {
            hoverText: "E: Up - F: Down - Click: Ask",
        })

        backgroundquestions_entity.addComponent(navigator)

        backgroundanswers_entity.addComponent(navigator)

        // Compi Data (id: name)
        this.compidata_shape.fontSize = 1
        this.compidata_shape.value = ""
        this.compidata_shape.hTextAlign = "left"
        this.compidata_shape.vTextAlign = "center"
        this.compidata_shape.font = new Font(Fonts.SanFrancisco_Heavy)
        this.compidata_shape.color = Color3.Black()
        this.compidata_entity = new Entity()
        this.compidata_entity.addComponent(this.compidata_shape)
        this.compidata_entity.addComponent(new Transform({
            position: new Vector3(1.3, -0.78+y_offset+1.47, 0.08),
            rotation: Quaternion.Euler(0, 180, 0),
            scale: new Vector3(0.4, 0.4, 0.4)
        }))
        this.compidata_entity.setParent(this)

        // Questions list
        this.questions_shape.textWrapping = true
        this.questions_shape.font = new Font(Fonts.SanFrancisco_Heavy)
        this.questions_shape.hTextAlign = "left"
        this.questions_shape.vTextAlign = "top"
        this.questions_shape.fontSize = 1
        //this.questions_shape.fontWeight = 'normal'
        this.questions_shape.value = ""
        this.questions_shape.width = 1.5
        this.questions_shape.color = Color3.Black()
        this.questions_entity = new Entity()
        this.questions_entity.addComponent(this.questions_shape)
        this.questions_entity.addComponent(new Transform({
            position: new Vector3(1.1-2.1, 0.19+y_offset, 0.08),
            rotation: Quaternion.Euler(0, 180, 0),
            scale: new Vector3(0.5, 0.5, 1)
        }))
        this.questions_entity.setParent(this)


        // Answer Text
        this.answer_shape.textWrapping = true
        this.answer_shape.font = new Font(Fonts.SanFrancisco_Heavy)
        this.answer_shape.hTextAlign = "center"
        this.answer_shape.vTextAlign = "top"
        this.answer_shape.fontSize = 1
        //this.answer_shape.fontWeight = 'normal'
        this.answer_shape.value = ""
        this.answer_shape.width = 1.3
        this.answer_shape.color = Color3.Black()
        this.answer_entity = new Entity()
        this.answer_entity.addComponent(this.answer_shape)
        this.answer_entity.addComponent(new Transform({
            position: new Vector3(0, 0.1+y_offset, 0.08),
            rotation: Quaternion.Euler(0, 180, 0),
            scale: new Vector3(0.5, 0.5, 1)
        }))
        this.answer_entity.setParent(this)

        // Input Text
        this.textInput.width = "50%"
        this.textInput.height = "50px"
        this.textInput.vAlign = "bottom"
        this.textInput.hAlign = "center"
        this.textInput.fontSize = 30
        this.textInput.placeholder = "Write name here"
        //this.textInput.placeholderColor = Color4.Gray()
        this.textInput.positionY = "200px"
        this.textInput.isPointerBlocker = true
        this.textInput.visible = false
    }

    createPlane(data: any) {
        const e = new Entity()
        const plane = new PlaneShape()
        plane.uvs = data.uv
        e.addComponent(plane)
        const t = new Transform({
            position: new Vector3(...data.position),
            rotation: new Quaternion(...data.rotation),
            scale: new Vector3(...data.scale)
        })
        t.position.y += y_offset
        e.addComponent(t)

        e.addComponent(myMaterial)
        e.setParent(this)

        //e.addComponent(new FixShape())
        return e
    }

    destroy() {
        engine.removeEntity(this)
    }

    /*
    updatePrice() {
        executeTask(async ()=>{
            this.price = await this.stool_component.network.getPrice()
            this.price_shape.value = this.stool_component.network.wei2human(this.price[0].toString())
        })
    }
    */
}






// System

const stoolGroup = engine.getComponentGroup(StoolComponent)

export class CompiNPCSystem implements ISystem {
    //working: boolean = false
    /*blockchain: Blockchain

    constructor(network: Blockchain) {
        this.blockchain = network
    }*/

    update(dt: number) {
        for (let entity of stoolGroup.entities) {
            let stool = entity as CompiNPC
            const stool_component = entity.getComponent(StoolComponent)

            if (stool_component.answer_drawn < stool_component.answer.length) {
                stool_component.answer_drawn += Math.round(100 * dt)
                if (stool_component.answer_drawn > stool_component.answer.length) {
                    stool_component.answer_drawn = stool_component.answer.length
                }
                stool.answer_shape.value = stool_component.answer.substring(0, stool_component.answer_drawn)
            }
            if (stool_component.questions != stool.questions_shape.value) {
                stool.questions_shape.value = stool_component.questions
                stool.questions_shape.width = 1.2
            }
            if (stool_component.play_animation >= 0) {
                stool.compi_entity.play(stool_component.play_animation)
                stool_component.play_animation = -1
            }

            if (stool_component.current_action == "cancel") {
                stool_component.current_action = ""
                stool.textInput.visible = false
                //stool.cancel_entity.getComponent(PlaneShape).visible = false
                engine.removeEntity(stool.cancel_entity)
                stool_component.working = false
                continue
            }

            if (stool_component.working) {
                continue
            }
            if (stool_component.current_action == "goto_compi") {
                stool_component.working = true
                stool_component.current_action = ""
                this.goto(stool_component)
                continue
            }
            if (stool_component.current_compi == -1) {
                stool_component.working = true
                stool_component.current_action = ""
                stool_component.goto_compi = 0
                this.goto(stool_component)
                continue
            }
            if (stool_component.dirty_compi) {
                stool_component.working = true
                this.updateCompi(stool)
                continue
            }
            if (stool_component.current_action == "previous_compi") {
                stool_component.working = true
                stool_component.current_action = ""
                stool_component.goto_compi = stool_component.current_compi - 1
                this.goto(stool_component)
                continue
            }
            if (stool_component.current_action == "next_compi") {
                stool_component.working = true
                stool_component.current_action = ""
                stool_component.goto_compi = stool_component.current_compi + 1
                this.goto(stool_component)
                continue
            } else if (stool_component.current_compi == -2) {
                continue
            }
            if (stool_component.dirty_questions) {
                stool_component.working = true
                this.updateQuestions(stool)
                continue
            }
            if (stool_component.current_action == "add_question") {
                stool_component.working = true
                stool_component.current_action = ""
                this.addQuestion(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "remove_question") {
                stool_component.working = true
                stool_component.current_action = ""
                this.removeQuestion(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "edit_answer") {
                stool_component.working = true
                stool_component.current_action = ""
                this.editAnwser(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "set_name") {
                stool_component.working = true
                stool_component.current_action = ""
                this.setName(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "ask_question") {
                stool_component.working = true
                stool_component.current_action = ""
                this.askQuestion(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "previous_question") {
                stool_component.working = true
                stool_component.current_action = ""
                stool_component.goto_question = stool_component.current_question - 1
                this.gotoQuestion(stool_component)
                continue
            }
            if (stool_component.current_action == "next_question") {
                stool_component.working = true
                stool_component.current_action = ""
                stool_component.goto_question = stool_component.current_question + 1
                this.gotoQuestion(stool_component)
                continue
            }
            if (stool_component.current_action == "previous_question_page") {
                log("action: previous_question_page")
                stool_component.working = true
                stool_component.current_action = ""
                stool_component.goto_qpage = stool_component.current_qpage - 1
                this.gotoQPage(stool_component)
                continue
            }
            if (stool_component.current_action == "next_question_page") {
                log("action: next_question_page")
                stool_component.working = true
                stool_component.current_action = ""
                stool_component.goto_qpage = stool_component.current_qpage + 1
                this.gotoQPage(stool_component)
                continue
            }
        }
    }

    async goto(stool_component: StoolComponent) {
        log("goto")
        log("stool_component.current_compi", stool_component.current_compi)
        log("stool_component.goto_compi", stool_component.goto_compi)
        log("stool_component.dirty_compi", stool_component.dirty_compi)
        if(!stool_component.forced) {
            log("Getting compis")
            const compisCount = await stool_component.network.balanceOf()
            log("compisCount", compisCount)
            if (compisCount>0) {
                log("compisCount>0")
                if (stool_component.goto_compi<0) {
                    log("stool_component.goto_compi<0")
                    stool_component.current_compi = compisCount-1
                    stool_component.dirty_compi = true
                } else if (stool_component.goto_compi>=compisCount) {
                    log("stool_component.goto_compi>=compisCount")
                    stool_component.current_compi = 0
                    stool_component.dirty_compi = true
                } else {
                    stool_component.current_compi = stool_component.goto_compi
                    //stool_component.goto_compi = stool_component.current_compi
                    stool_component.dirty_compi = true
                }
            } else {
                log("else1")
                stool_component.current_compi = -2
                stool_component.goto_compi = 0
                stool_component.dirty_compi = true
            }
        } else {
            log("else2")
            stool_component.current_compi = stool_component.goto_compi
            stool_component.dirty_compi = true
        }

        log("stool_component.current_compi", stool_component.current_compi)
        log("stool_component.goto_compi", stool_component.goto_compi)
        log("stool_component.dirty_compi", stool_component.dirty_compi)

        stool_component.working = false
    }

    async gotoQuestion(stool_component: StoolComponent) {
        let questions_count: number = 0
        for (let n=0; n < stool_component.question_list.length; n++) {
            if (stool_component.question_list[n].value != "") {
                questions_count += 1
            }
        }
        if (stool_component.goto_question < 0) {
            stool_component.goto_question = questions_count-1
            stool_component.current_question = questions_count-1
            stool_component.dirty_questions = true
        } else if (stool_component.goto_question >= questions_count) {
            stool_component.goto_question = 0
            stool_component.current_question = 0
            stool_component.dirty_questions = true
        } else {
            stool_component.current_question = stool_component.goto_question
            stool_component.dirty_questions = true
        }

        log(stool_component.goto_question, stool_component.current_question)

        stool_component.working = false
    }

    async gotoQPage(stool_component: StoolComponent) {
        let questions_count: number = 0
        for (let n=0; n < stool_component.question_list.length; n++) {
            if (stool_component.question_list[n].value != "") {
                questions_count += 1
            }
        }

        if (stool_component.goto_qpage < 0) {
            stool_component.current_qpage = 0
        } else if (stool_component.goto_qpage > stool_component.current_qpage && questions_count < 10) {
            stool_component.current_qpage = 0
        } else {
            stool_component.current_qpage = stool_component.goto_qpage
        }

        log("current_qpage", stool_component.current_qpage)
        const offset = stool_component.current_qpage * 10
        const questions = await stool_component.network.getQuestions(stool_component.current_token, offset)
        log(questions)

        for (let n=0; n < questions.length; n++) {
            stool_component.question_list[n] = {
                id: n+offset,
                value: questions[n]
            }
        }

        stool_component.current_question = 0

        stool_component.dirty_questions = true
        stool_component.working = false
    }

    async updateCompi(entity: CompiNPC, update_picture: boolean = true) {
        const stool_component = entity.getComponent(StoolComponent)
        stool_component.dirty_compi = false
        if (stool_component.current_compi < 0) {
            entity.compi_entity.set_body(0, 0, true)
            entity.compidata_shape.value = "Demo"
            stool_component.working = false
            return
        }
        log("updateCompi")
        entity.compidata_shape.value = "-"

        let compiId: number = 0
        if(!stool_component.forced) {
            entity.editanswer_entity.getComponent(PlaneShape).visible = false
            entity.remove_entity.getComponent(PlaneShape).visible = false

            compiId = await stool_component.network.tokenOfOwnerByIndex(stool_component.current_compi)

            stool_component.current_token = compiId
        } else {
            compiId = stool_component.current_token = stool_component.current_compi
        }
        log("compiId", compiId)
        let compiName = await stool_component.network.getName(compiId)

        if (compiName === "") {
            compiName = "No name set"
        }

        entity.compidata_shape.value = `#${compiId}:${compiName}`

        entity.compi_entity.set_body(compiId, 0, true)

        // Get questions

        this.gotoQPage(stool_component)

        stool_component.working = false
    }

    async updateQuestions(entity: CompiNPC) {
        const stool_component = entity.getComponent(StoolComponent)
        const questionCount = await stool_component.network.getQuestionsCount(stool_component.current_token)

        entity.arrowleftquestions_entity.getComponent(PlaneShape).visible = true
        entity.arrowrightquestions_entity.getComponent(PlaneShape).visible = true

        if (questionCount > 10) {
            const min = stool_component.current_qpage * 10
            //const max = (stool_component.current_qpage * 10) + 10
            if (min == 0) {
                entity.arrowleftquestions_entity.getComponent(PlaneShape).visible = false
            }
        } else {
            log("hide arrows")
            entity.arrowleftquestions_entity.getComponent(PlaneShape).visible = false
            entity.arrowrightquestions_entity.getComponent(PlaneShape).visible = false
        }

        let questions_text = ""
        let questions_count: number = 0
        for (let n=0; n < stool_component.question_list.length; n++) {
            if (stool_component.question_list[n].value != "") {
                if (stool_component.current_question == n) {
                    questions_text += "[ "
                } else {
                    questions_text += ""
                }
                questions_text += `${stool_component.question_list[n].value}`
                questions_count += 1
                if (stool_component.current_question == n) {
                    questions_text += " ]\n"
                } else {
                    questions_text += "\n"
                }
            }
        }
        stool_component.questions = questions_text

        if (questions_count < 10) {
            entity.arrowrightquestions_entity.getComponent(PlaneShape).visible = false
        }

        stool_component.dirty_questions = false
        stool_component.working = false
    }

    async setName(entity: CompiNPC) {
        const stool_component = entity.getComponent(StoolComponent)
        log("Set Name")
        if (stool_component.current_compi < 0) return

        entity.textInput.visible = true
        entity.textInput.placeholder = "Write name here"
        engine.addEntity(entity.cancel_entity)

        entity.textInput.onTextSubmit = new OnTextSubmit(async (x) => {
            entity.textInput.visible = false
            engine.removeEntity(entity.cancel_entity)
            engine.addEntity(entity.working_entity)
            await stool_component.network.setName(stool_component.current_token, x.text.trim()).then(receipt => {
                if (receipt.status === 1) {
                    stool_component.dirty_compi = true
                    stool_component.working = false
                    engine.removeEntity(entity.working_entity)
                    engine.addEntity(entity.ok_entity)
                    log("setName Ok ", receipt)
                } else {
                    // TODO duplicated code
                    stool_component.working = false
                    engine.removeEntity(entity.working_entity)
                    engine.addEntity(entity.error_entity)
                    log("Error on setName", receipt)
                }
            }).catch(e => {
                stool_component.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.error_entity)
                log("Error on setName", e)
            })
        })

        //entity.cancel_entity.getComponent(PlaneShape).visible = true
        engine.addEntity(entity.cancel_entity)
    }

    async askQuestion(entity: CompiNPC) {
        const stool_component = entity.getComponent(StoolComponent)
        const question_text = stool_component.question_list[stool_component.current_question].value
        const answer = await stool_component.network.getAnswer(stool_component.current_token, question_text)
        log(answer)
        const regex = /\{.*?\}/g;

        let m;
        let clean_answer = answer;
        while ((m = regex.exec(answer)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                log(`Found match, group ${groupIndex}: ${match}`);
                //matches.push(match)
                let json_match = undefined;
                try {
                    json_match = JSON.parse(match);
                } catch {
                    log(`Error parsing json to broadcast ${match}`);
                }
                if (json_match != undefined) {
                    stool_component.broadcast.push(json_match);
                }
                clean_answer = clean_answer.replace(match, "");
            });
        }
        //log("stool_component.broadcast", stool_component.broadcast)
        const answer_text = `You: ${question_text}\n\n${entity.compi_entity.character_name}: ${clean_answer}`
        stool_component.answer = answer_text
        stool_component.answer_drawn = 0
        const clip_id = Math.floor(Math.random()*3)
        let animate = false
        for (let n=0; n<stool_component.broadcast.length; n++) {
            if (stool_component.broadcast[n].emote != undefined) {
                stool_component.play_animation = emote2id(stool_component.broadcast[n].emote)
                stool_component.broadcast[n].emote = undefined
                animate = true
            }

            if (stool_component.broadcast[n].audio != undefined) {
                const stream = new AudioStream(
                    stool_component.broadcast[n].audio
                )
                entity.addComponentOrReplace(stream)
                stream.playing = true
                stream.volume = 0.2
                stool_component.broadcast[n].audio = undefined
            }

            /* This don't work for security reasons
            if (stool_component.broadcast[n].open_url != undefined) {
                openExternalURL(""+stool_component.broadcast[n].open_url)
                stool_component.broadcast[n].open_url = undefined
            }*/
        }
        if (!animate) {
            stool_component.play_animation = clip_id
        }
        log("stool_component.play_animation", stool_component.play_animation)


        if (!stool_component.forced) {
            entity.editanswer_entity.getComponent(PlaneShape).visible = true
            entity.remove_entity.getComponent(PlaneShape).visible = true
        }
        stool_component.working = false
    }

    async addQuestion(entity: CompiNPC) {
        const stool_component = entity.getComponent(StoolComponent)
        entity.textInput.visible = true
        entity.textInput.placeholder = "Write question"
        engine.addEntity(entity.cancel_entity)

        entity.textInput.onTextSubmit = new OnTextSubmit(async (x) => {
            entity.textInput.visible = false
            engine.removeEntity(entity.cancel_entity)
            engine.addEntity(entity.working_entity)
            await stool_component.network.addQuestion(stool_component.current_token, x.text.trim(), "Default answer").then(receipt => {
                if (receipt.status === 1) {
                    stool_component.dirty_compi = true
                    stool_component.working = false
                    engine.removeEntity(entity.working_entity)
                    engine.addEntity(entity.ok_entity)
                    log("addQuestion Ok ", receipt)
                } else {
                    // TODO duplicated code
                    stool_component.working = false
                    engine.removeEntity(entity.working_entity)
                    engine.addEntity(entity.error_entity)
                    log("Error on addQuestion", receipt)
                }
            }).catch(e => {
                stool_component.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.error_entity)
                log("Error on addQuestion", e)
            })
        })
        //entity.cancel_entity.getComponent(PlaneShape).visible = true
        engine.addEntity(entity.cancel_entity)
    }

    async removeQuestion(entity: CompiNPC) {
        const stool_component = entity.getComponent(StoolComponent)
        const questionText = stool_component.question_list[stool_component.current_question].value
        const questionId = stool_component.question_list[stool_component.current_question].id
        engine.addEntity(entity.working_entity)
        await stool_component.network.removeQuestion(stool_component.current_token, questionText, questionId).then(receipt => {
            if (receipt.status === 1) {
                stool_component.dirty_compi = true
                stool_component.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.ok_entity)
                log("removeQuestion Ok ", receipt)
            } else {
                // TODO duplicated code
                stool_component.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.error_entity)
                log("Error on removeQuestion", receipt)
            }
            /*//stool_component.dirty_compi = true
            stool_component.working = false
            engine.removeEntity(entity.working_entity)
            engine.addEntity(entity.ok_entity)
            log("removeQuestion Ok ", tx)*/
        }).catch(e => {
            stool_component.working = false
            engine.removeEntity(entity.working_entity)
            engine.addEntity(entity.error_entity)
            log("Error on removeQuestion", e)
        })
    }

    async editAnwser(entity: CompiNPC) {
        const stool_component = entity.getComponent(StoolComponent)
        log("Edit Anwser")
        engine.addEntity(entity.cancel_entity)

        entity.textInput.visible = true
        entity.textInput.placeholder = "Write answer here"
        entity.textInput.onTextSubmit = new OnTextSubmit(async (x) => {
            entity.textInput.visible = false
            log("this.current_token", stool_component.current_token)
            const question = stool_component.question_list[stool_component.current_question].value
            engine.removeEntity(entity.cancel_entity)
            engine.addEntity(entity.working_entity)
            await stool_component.network.addQuestion(stool_component.current_token, question, x.text.trim()).then(receipt => {
                if (receipt.status === 1) {
                    stool_component.dirty_compi = true
                    stool_component.working = false
                    engine.removeEntity(entity.working_entity)
                    engine.addEntity(entity.ok_entity)
                    log("addQuestion (Edit Anwser) Ok ", receipt)
                } else {
                    // TODO duplicated code
                    stool_component.working = false
                    engine.removeEntity(entity.working_entity)
                    engine.addEntity(entity.error_entity)
                    log("Error on addQuestion (Edit Anwser)", receipt)
                }
                /*//stool_component.dirty_compi = true
                stool_component.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.ok_entity)
                log("addQuestion (Edit Anwser) Ok ", tx)*/
            }).catch(e => {
                stool_component.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.error_entity)
                log("Error on addQuestion (Edit Anwser)", e)
            })
        })
    }
}

function emote2id(emote: string) {
    if (emote == "dance") {
        return EMOTE.DANCE;
    } else if (emote == "lol") {
        return EMOTE.LOL;
    } else if (emote == "alert") {
        return EMOTE.ALERT;
    } else if (emote == "swing") {
        return EMOTE.SWING;
    } else if (emote == "look_l") {
        return EMOTE.LOOK_L;
    } else if (emote == "look_r") {
        return EMOTE.LOOK_R;
    } else if (emote == "look_r_l") {
        return EMOTE.LOOK_R_L;
    } else if (emote == "look_up") {
        return EMOTE.LOOK_UP;
    } else if (emote == "pissed_off") {
        return EMOTE.PISSED_OFF;
    } else if (emote == "sigh") {
        return EMOTE.SIGH;
    } else if (emote == "sleep") {
        return EMOTE.SLEEP;
    } else if (emote == "yawn") {
        return EMOTE.YAWN;
    } else {
        return 0;
    }
}
