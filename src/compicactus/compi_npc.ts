import { Blockchain } from "./contracts/contracts"
// import { Mint } from "./mint"
// import { Teach } from "./teach"
import { Compicactus, planesMenu as compicactusPlanesMenu } from "./compicactus/compicactus"

import { CHARACTER } from "./constants"

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
}

export class CompiNPC extends Entity {

    compi_entity: Compicactus

    compidata_entity: Entity
    compidata_shape: TextShape = new TextShape()

    answer_entity: Entity
    answer_shape: TextShape = new TextShape()

    questions_entity: Entity
    questions_shape: TextShape = new TextShape()

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

    network: Blockchain

    planesMenu: any

    constructor(id: number, network: Blockchain) {
        super()
        if (network.character == CHARACTER.COMPICACTUS) {
            this.planesMenu = compicactusPlanesMenu
        } else {
            throw new Error(`Character not found: ${network.character}`)
        }

        this.textInput = new UIInputText(canvas)

        this.stool_component = new StoolComponent()
        this.addComponent(this.stool_component)
        engine.addEntity(this)

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
                    this.stool_component.current_action = "previous_compi"
                },
                {
                    hoverText: "Previous Compi"
                })
            )
            const arrowrightcompi_entity = this.createPlane(this.planesMenu.ArrowRightCompi)
            arrowrightcompi_entity.addComponent(
                new OnPointerDown(()=>{
                    this.stool_component.current_action = "next_compi"
                },
                {
                    hoverText: "Next Compi"
                })
            )
            const addquestion_entity = this.createPlane(this.planesMenu.Add)
            addquestion_entity.addComponent(
                new OnPointerDown(() => {
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
                    this.stool_component.current_action = "remove_question"
                },
                {
                    hoverText: "Remove Question",
                })
            )
            const editname_entity = this.createPlane(this.planesMenu.EditName)
            editname_entity.addComponent(
                new OnPointerDown(() => {
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
                this.stool_component.current_action = "previous_question_page"
            },
            {
                hoverText: "Prev page",
            })
        )
        this.arrowrightquestions_entity = this.createPlane(this.planesMenu.ArrowRightQuestions)
        this.arrowrightquestions_entity.addComponent(
            new OnPointerDown(() => {
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
        this.compi_entity = new Compicactus()
        this.compi_entity.addComponent(compiplaceholder_entity.getComponent(Transform))
        this.compi_entity.setParent(this)
        this.compi_entity.getComponent(PlaneShape).uvs = compiplaceholder_entity.getComponent(PlaneShape).uvs

        backgroundquestions_entity.addComponent(
            new OnPointerDown((e) => {
                if (e.buttonId == 0) {
                    this.stool_component.current_action = "ask_question"
                } else if (e.buttonId == 1) {
                    this.stool_component.current_action = "previous_question"
                } else if (e.buttonId == 2) {
                    this.stool_component.current_action = "next_question"
                }
            },
            {
                hoverText: "Ask selected question",
            })
        )

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
            position: new Vector3(0.3, -0.78+y_offset+1.47, 0.08),
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
        this.questions_shape.fontWeight = 'normal'
        this.questions_shape.value = ""
        this.questions_shape.width = 1.5
        this.questions_shape.color = Color3.Black()
        this.questions_entity = new Entity()
        this.questions_entity.addComponent(this.questions_shape)
        this.questions_entity.addComponent(new Transform({
            position: new Vector3(1.1, 0.1+y_offset, 0.08),
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
        this.answer_shape.fontWeight = 'normal'
        this.answer_shape.value = ""
        this.answer_shape.width = 1.5
        this.answer_shape.color = Color3.Black()
        this.answer_entity = new Entity()
        this.answer_entity.addComponent(this.answer_shape)
        this.answer_entity.addComponent(new Transform({
            position: new Vector3(-1, 0.1+y_offset, 0.08),
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
        this.textInput.placeholderColor = Color4.Gray()
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
        return e
    }
}






// System

const stoolGroup = engine.getComponentGroup(StoolComponent)

export class CompiNPCSystem implements ISystem {
    working: boolean = false
    blockchain: Blockchain

    constructor(network: Blockchain) {
        this.blockchain = network
    }

    update(dt: number) {
        for (let entity of stoolGroup.entities) {
            let stool = entity as CompiNPC
            const stool_component = entity.getComponent(StoolComponent)

            if (stool_component.answer != stool.answer_shape.value) {
                stool.answer_shape.value = stool_component.answer
                stool.answer_shape.width = 1.2
            }
            if (stool_component.questions != stool.questions_shape.value) {
                stool.questions_shape.value = stool_component.questions
                stool.questions_shape.width = 1.2
            }
            if (stool_component.play_animation >= 0) {
                //stool.compi_entity.set_mp4_body(stool_component.current_token, stool_component.play_animation)
                stool.compi_entity.play_random()
                stool_component.play_animation = -1
            }

            if (stool_component.current_action == "cancel") {
                stool_component.current_action = ""
                stool.textInput.visible = false
                //stool.cancel_entity.getComponent(PlaneShape).visible = false
                engine.removeEntity(stool.cancel_entity)
                this.working = false
                continue
            }

            if (this.working) continue
            if (stool_component.current_action == "goto_compi") {
                this.working = true
                stool_component.current_action = ""
                this.goto(stool_component)
                continue
            }
            if (stool_component.current_compi == -1) {
                this.working = true
                stool_component.current_action = ""
                stool_component.goto_compi = 0
                this.goto(stool_component)
                continue
            } else if (stool_component.current_compi == -2) {
                continue
            }
            if (stool_component.dirty_compi) {
                this.working = true
                this.updateCompi(stool)
                continue
            }
            if (stool_component.dirty_questions) {
                this.working = true
                this.updateQuestions(stool)
                continue
            }
            if (stool_component.current_action == "previous_compi") {
                this.working = true
                stool_component.current_action = ""
                stool_component.goto_compi = stool_component.current_compi - 1
                this.goto(stool_component)
                continue
            }
            if (stool_component.current_action == "next_compi") {
                this.working = true
                stool_component.current_action = ""
                stool_component.goto_compi = stool_component.current_compi + 1
                this.goto(stool_component)
                continue
            }
            if (stool_component.current_action == "add_question") {
                this.working = true
                stool_component.current_action = ""
                this.addQuestion(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "remove_question") {
                this.working = true
                stool_component.current_action = ""
                this.removeQuestion(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "edit_answer") {
                this.working = true
                stool_component.current_action = ""
                this.editAnwser(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "set_name") {
                this.working = true
                stool_component.current_action = ""
                this.setName(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "ask_question") {
                this.working = true
                stool_component.current_action = ""
                this.askQuestion(entity as CompiNPC)
                continue
            }
            if (stool_component.current_action == "previous_question") {
                this.working = true
                stool_component.current_action = ""
                stool_component.goto_question = stool_component.current_question - 1
                this.gotoQuestion(stool_component)
                continue
            }
            if (stool_component.current_action == "next_question") {
                this.working = true
                stool_component.current_action = ""
                stool_component.goto_question = stool_component.current_question + 1
                this.gotoQuestion(stool_component)
                continue
            }
            if (stool_component.current_action == "previous_question_page") {
                log("action: previous_question_page")
                this.working = true
                stool_component.current_action = ""
                stool_component.goto_qpage = stool_component.current_qpage - 1
                this.gotoQPage(stool_component)
                continue
            }
            if (stool_component.current_action == "next_question_page") {
                log("action: next_question_page")
                this.working = true
                stool_component.current_action = ""
                stool_component.goto_qpage = stool_component.current_qpage + 1
                this.gotoQPage(stool_component)
                continue
            }
        }
    }

    async goto(stool_component: StoolComponent) {
        log("goto")
        if(!stool_component.forced) {
            log("Getting compis")
            const compisCount = await this.blockchain.balanceOf()

            if (compisCount>0) {
                if (stool_component.goto_compi<0) {
                    stool_component.current_compi = compisCount-1
                    stool_component.dirty_compi = true
                } else if (stool_component.goto_compi>=compisCount) {
                    stool_component.current_compi = 0
                    stool_component.dirty_compi = true
                }
                stool_component.current_compi = stool_component.goto_compi
                stool_component.dirty_compi = true
            } else {
                stool_component.current_compi = -2
            }
        } else {
            stool_component.current_compi = stool_component.goto_compi
            stool_component.dirty_compi = true
        }

        this.working = false
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

        this.working = false
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
        const questions = await this.blockchain.getQuestions(stool_component.current_token, offset)
        log(questions)

        for (let n=0; n < questions.length; n++) {
            stool_component.question_list[n] = {
                id: n+offset,
                value: questions[n]
            }
        }

        stool_component.current_question = 0

        stool_component.dirty_questions = true
        this.working = false
    }

    async updateCompi(entity: CompiNPC, update_picture: boolean = true) {
        const stool_component = entity.getComponent(StoolComponent)
        stool_component.dirty_compi = false
        if (stool_component.current_compi < 0) {
            this.working = false
            return
        }
        log("updateCompi")
        entity.compidata_shape.value = "-"

        let compiId: number = 0
        if(!stool_component.forced) {
            entity.editanswer_entity.getComponent(PlaneShape).visible = false
            entity.remove_entity.getComponent(PlaneShape).visible = false

            compiId = await this.blockchain.tokenOfOwnerByIndex(stool_component.current_compi)

            stool_component.current_token = compiId
        } else {
            compiId = stool_component.current_token = stool_component.current_compi
        }
        log("compiId", compiId)
        const compiName = await this.blockchain.getName(compiId)

        entity.compidata_shape.value = `#${compiId}:${compiName}`

        entity.compi_entity.set_mp4_body(compiId, 0, true)

        // Get questions

        this.gotoQPage(stool_component)

        this.working = false
    }

    async updateQuestions(entity: CompiNPC) {
        const stool_component = entity.getComponent(StoolComponent)
        const questionCount = await this.blockchain.getQuestionsCount(stool_component.current_token)

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
            if (stool_component.current_question == n) {
                questions_text += "> "
            }
            questions_text += `${stool_component.question_list[n].value}\n`
            if (stool_component.question_list[n].value != "") {
                questions_count += 1
            }
        }
        stool_component.questions = questions_text

        if (questions_count < 10) {
            entity.arrowrightquestions_entity.getComponent(PlaneShape).visible = false
        }

        stool_component.dirty_questions = false
        this.working = false
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
            await this.blockchain.setName(stool_component.current_token, x.text).then(tx => {
                stool_component.dirty_compi = true
                this.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.ok_entity)
                log("setName Ok ", tx)
            }).catch(e => {
                this.working = false
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
        const answer = await this.blockchain.getAnswer(stool_component.current_token, question_text)
        const answer_text = `You: ${question_text}\n\nCompi: ${answer}`
        stool_component.answer = answer_text
        const clip_id = Math.floor(Math.random()*11)
        stool_component.play_animation = clip_id
        if (!stool_component.forced) {
            entity.editanswer_entity.getComponent(PlaneShape).visible = true
            entity.remove_entity.getComponent(PlaneShape).visible = true
        }
        this.working = false
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
            await this.blockchain.addQuestion(stool_component.current_token, x.text, "Default answer").then(tx => {
                //stool_component.dirty_compi = true
                this.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.ok_entity)
                log("addQuestion Ok ", tx)
            }).catch(e => {
                this.working = false
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
        await this.blockchain.removeQuestion(stool_component.current_token, questionText, questionId).then(tx => {
            //stool_component.dirty_compi = true
            this.working = false
            engine.removeEntity(entity.working_entity)
            engine.addEntity(entity.ok_entity)
            log("removeQuestion Ok ", tx)
        }).catch(e => {
            this.working = false
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
            await this.blockchain.addQuestion(stool_component.current_token, question, x.text).then(tx => {
                //stool_component.dirty_compi = true
                this.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.ok_entity)
                log("addQuestion (Edit Anwser) Ok ", tx)
            }).catch(e => {
                this.working = false
                engine.removeEntity(entity.working_entity)
                engine.addEntity(entity.error_entity)
                log("Error on addQuestion (Edit Anwser)", e)
            })
        })
    }
}


/*
//Menu Shapes
const menu_mint_shape = new GLTFShape("models/menu_mint.gltf")
const menu_chat_shape = new GLTFShape("models/menu_chat.gltf")
const menu_teach_shape = new GLTFShape("models/menu_teach.gltf")
const menu_photo_shape = new GLTFShape("models/menu_photo.gltf")
const menu_sell_shape = new GLTFShape("models/menu_sell.gltf")

// const stool_shape = new GLTFShape("models/stool.gltf")

const sell_cargo_shape = new GLTFShape("models/sell_cargo.gltf")
const sell_opensea_shape = new GLTFShape("models/sell_opensea.gltf")

// const left_shape = new GLTFShape("models/left.gltf")
// const right_shape = new GLTFShape("models/right.gltf")
const compidata_shape = new TextShape()
const answer_shape = new TextShape()

const blockchain = new Blockchain("mumbai")

@Component("stool")
export class StoolComponent {
    //spinning: boolean
    //speed: number
}

export class Stool extends Entity {
    // Menu entities
    menu_mint_entity: Entity = new Entity
    menu_chat_entity: Entity = new Entity
    menu_teach_entity: Entity = new Entity
    menu_photo_entity: Entity = new Entity
    menu_sell_entity: Entity = new Entity
    compi_entity: Compicactus
    menu_background_entity: Entity = new Entity

    sell_cargo_entity: Entity = new Entity
    sell_opensea_entity: Entity = new Entity

    left_entity: Entity = new Entity
    right_entity: Entity = new Entity
    up_entity: Entity = new Entity
    down_entity: Entity = new Entity

    compidata_entity: Entity = new Entity
    answer_entity: Entity = new Entity

    current_compi: number = -1
    current_token: number = -1
    current_menu: number = 0

    mint: Mint
    teach: Teach

    //compi_actions: Array<string>

    constructor() {
        super()

        //this.addComponent(stool_shape)
        this.addComponent(new Transform({
            position: new Vector3(8, 0, 8)
        }))
        this.addComponent(new Billboard(false, true ,false))
        this.addComponent(new StoolComponent())
        engine.addEntity(this)

        this.mint = new Mint(this)

        this.teach = new Teach(this)

        this.setupSell()

        // Left
        this.left_entity.addComponent(new GLTFShape("models/button_arrow.gltf"))
        this.left_entity.addComponent(new Transform({
            position: new Vector3(0.5, 1.5+0.2, 0),
            rotation: Quaternion.Euler(0, 0, 180)
        }))
        this.left_entity.setParent(this)
        engine.addEntity(this.left_entity)
        this.left_entity.addComponent(
            new OnPointerDown(()=>{this.previous(this)},
            {
                hoverText: "Previous",
            })
        )

        // Right
        this.right_entity.addComponent(new GLTFShape("models/button_arrow.gltf"))
        this.right_entity.addComponent(new Transform({
            position: new Vector3(-0.5, 1.5+0.2, 0)
        }))
        this.right_entity.setParent(this)
        engine.addEntity(this.right_entity)
        this.right_entity.addComponent(
            new OnPointerDown(()=>{this.next(this)},
            {
                hoverText: "Next",
            })
        )

        // Up
        this.up_entity.addComponent(new GLTFShape("models/button_arrow.gltf"))
        this.up_entity.addComponent(new Transform({
            position: new Vector3(-0.15, 1.2+0.2, 0),
            rotation: Quaternion.Euler(0, 0, -90)
        }))
        this.up_entity.setParent(this)
        engine.addEntity(this.up_entity)
        this.up_entity.addComponent(
            new OnPointerDown(()=>{this.next(this)},
            {
                hoverText: "Up",
            })
        )

        // Down
        this.down_entity.addComponent(new GLTFShape("models/button_arrow.gltf"))
        this.down_entity.addComponent(new Transform({
            position: new Vector3(0.15, 1.2+0.2, 0),
            rotation: Quaternion.Euler(0, 0, 90)
        }))
        this.down_entity.setParent(this)
        engine.addEntity(this.down_entity)
        this.down_entity.addComponent(
            new OnPointerDown(()=>{this.next(this)},
            {
                hoverText: "Down",
            })
        )


        this.menu_background_entity.addComponent(new PlaneShape())
        this.menu_background_entity.addComponent(new Transform({
            position: new Vector3(0, 1.2+0.1, -.2),
            scale: new Vector3(2, 2.5, 1)
        }))
        const backgroundMaterial = new BasicMaterial()
        backgroundMaterial.texture = new Texture("textures/background.jpg")
        this.menu_background_entity.addComponent(backgroundMaterial)
        this.menu_background_entity.setParent(this)

        this.compi_entity = new Compicactus()
        this.compi_entity.addComponent(new Transform({
            position: new Vector3(0, 1.3+0.2, -0.1),
            scale: new Vector3(0.8, 0.8, 0.8)
        }))
        this.compi_entity.setParent(this)

        compidata_shape.fontSize = 1
        compidata_shape.value = "-"
        compidata_shape.hTextAlign = "center"
        compidata_shape.vTextAlign = "top"
        compidata_shape.font = new Font(Fonts.SanFrancisco_Heavy)
        compidata_shape.color = Color3.Black()
        this.compidata_entity.addComponent(compidata_shape)
        this.compidata_entity.addComponent(new Transform({
            position: new Vector3(0, 2.2+0.2, 0),
            rotation: Quaternion.Euler(0, 180, 0)
        }))
        this.compidata_entity.setParent(this)
        engine.addEntity(this.compidata_entity)

        answer_shape.textWrapping = true
        answer_shape.font = new Font(Fonts.SanFrancisco_Heavy)
        answer_shape.hTextAlign = "center"
        answer_shape.vTextAlign = "top"
        answer_shape.fontSize = 1
        answer_shape.fontWeight = 'normal'
        // answer_shape.value = "-"

        answer_shape.color = Color3.Black()
        //answer_shape.outlineColor = Color3.White()
        //answer_shape.outlineWidth = .1
        this.answer_entity.addComponent(answer_shape)
        this.answer_entity.addComponent(new Transform({
            position: new Vector3(0, 0.8, 0),
            rotation: Quaternion.Euler(0, 180, 0)
        }))
        this.answer_entity.setParent(this)
        engine.addEntity(this.answer_entity)

        this.setupMenu()

        this.ownsCompi()

        this.setAnswer("This is a test fsdf sdfdf sdfsdf sdfsdf sdfsdf asadsd asdasd asdasd asdasdasd asdasdasd asdasdad asdasdasd asdasdsd asdasdasd")
    }

    setAnswer(text: string){
        answer_shape.value = text
        answer_shape.width = 1.5
    }

    setupSell() {

        sell_cargo_shape.visible = false
        this.sell_cargo_entity.addComponent(sell_cargo_shape)
        this.sell_cargo_entity.addComponent(new Transform())
        this.sell_cargo_entity.setParent(this)
        engine.addEntity(this.sell_cargo_entity)
        this.sell_cargo_entity.addComponent(
            new OnPointerDown(() => {
                openExternalURL("https://app.cargo.build")
            },
            {
                hoverText: "Go to Cargo",
            })
        )

        sell_opensea_shape.visible = false
        this.sell_opensea_entity.addComponent(sell_opensea_shape)
        this.sell_opensea_entity.addComponent(new Transform())
        this.sell_opensea_entity.setParent(this)
        engine.addEntity(this.sell_opensea_entity)
        this.sell_opensea_entity.addComponent(
            new OnPointerDown(() => {
                openExternalURL("https://opensea.io/")
            },
            {
                hoverText: "Go to OpenSea",
            })
        )

    }

    setupMenu() {
        this.menu_mint_entity.addComponent(menu_mint_shape)
        this.menu_mint_entity.addComponent(new Transform({
            position: new Vector3(0, 0.5, 0)
        }))
        this.menu_mint_entity.setParent(this)
        engine.addEntity(this.menu_mint_entity)
        this.menu_mint_entity.addComponent(
            new OnPointerDown(() => {
                this.current_menu = 0
                this.updateMenu()
            },
            {
                hoverText: "Mint new Compi",
            })
        )

        this.menu_chat_entity.addComponent(menu_chat_shape)
        this.menu_chat_entity.addComponent(new Transform({
            position: new Vector3(0, 0.5, 0)
        }))
        this.menu_chat_entity.setParent(this)
        engine.addEntity(this.menu_chat_entity)
        this.menu_chat_entity.addComponent(
            new OnPointerDown(() => {
                this.current_menu = 1
                this.updateMenu()
            },
            {
                hoverText: "Chat with Compi",
            })
        )

        this.menu_teach_entity.addComponent(menu_teach_shape)
        this.menu_teach_entity.addComponent(new Transform({
            position: new Vector3(0, 0.5, 0)
        }))
        this.menu_teach_entity.setParent(this)
        engine.addEntity(this.menu_teach_entity)
        this.menu_teach_entity.addComponent(
            new OnPointerDown(() => {
                this.current_menu = 2
                this.updateMenu()
            },
            {
                hoverText: "Teach your Compi",
            })
        )

        this.menu_photo_entity.addComponent(menu_photo_shape)
        this.menu_photo_entity.addComponent(new Transform({
            position: new Vector3(0, 0.5, 0)
        }))
        this.menu_photo_entity.setParent(this)
        engine.addEntity(this.menu_photo_entity)
        this.menu_photo_entity.addComponent(
            new OnPointerDown(() => {
                this.current_menu = 3
                this.updateMenu()
            },
            {
                hoverText: "Photo mode",
            })
        )

        this.menu_sell_entity.addComponent(menu_sell_shape)
        this.menu_sell_entity.addComponent(new Transform({
            position: new Vector3(0, 0.5, 0)
        }))
        this.menu_sell_entity.setParent(this)
        engine.addEntity(this.menu_sell_entity)
        this.menu_sell_entity.addComponent(
            new OnPointerDown(() => {
                this.current_menu = 4
                this.updateMenu()
            },
            {
                hoverText: "Sell Compi",
            })
        )
    }

    updateMenu(){
        // Hide all
        this.mint.deactivate()

        sell_cargo_shape.visible = false
        sell_opensea_shape.visible = false

        this.teach.deactivate()

        //Show all
        menu_mint_shape.visible = true
        menu_chat_shape.visible = true
        menu_teach_shape.visible = true
        menu_photo_shape.visible = true
        menu_sell_shape.visible = true

        if (this.current_menu==0) {  // Mint
            this.mint.activate()

            this.mint.updatePrice()

        } else if (this.current_menu==1) {  // Chat
            //
        } else if (this.current_menu==2) {  // Teach
            this.teach.activate()
        } else if (this.current_menu==3) {  // Photo
            //menu_mint_shape.visible = false
            menu_chat_shape.visible = false
            menu_teach_shape.visible = false
            menu_photo_shape.visible = false
            menu_sell_shape.visible = false
        } else if (this.current_menu==4) {  // Sell
            sell_cargo_shape.visible = true
            sell_opensea_shape.visible = true
        }
    }

    previous(self:any) {
        self.goto(false)
    }

    next(self:any) {
        self.goto(true)
    }

    async goto(next=true) {
        log("Getting compis")

        const compisCount = await blockchain.balanceOf()

        if (compisCount>0) {
            if (next) {
                this.current_compi += 1
            } else {
                this.current_compi -= 1
            }

            if (this.current_compi<0) {
                this.current_compi = compisCount
            } else if (this.current_compi>=compisCount) {
                this.current_compi = 0
            }

            this.updateCompi()
        }

        log(this.current_compi)
    }

    async ownsCompi() {
        const compisCount = await blockchain.balanceOf()

        if (compisCount>0) {

            this.current_compi = 0

            this.updateCompi()
        }


    }

    async updateCompi() {
        compidata_shape.value = "-"

        const compiId = await blockchain.tokenOfOwnerByIndex(this.current_compi)

        this.current_token = compiId

        const compiName = await blockchain.getName(compiId)

        compidata_shape.value = compiId + ":" + compiName

        this.teach.getQuestions()

        this.compi_entity.set_mp4_body(this.current_compi)
    }
}
const stoolGroup = engine.getComponentGroup(StoolComponent)

export class StoolSystem implements ISystem {
    update(dt: number) {
        for (let entity of stoolGroup.entities) {

        }
    }
}

*/
