import planesMenu from "./planesMenuD"

export {planesMenu}

const compi_actions = [
    "Action-01-Look_R-L",
    "Action-02-Look_R",
    "Action-03-Look_L",
    "Action-04-Look-Up",
    "Action-05-Sleep",
    "Action-06-Dancing",
    "Action-07-Swinging",
    "Action-08-LOL",
    "Action-09-Pised_Off",
    "Action-10-Yawn",
    "Action-11-Alert",
    "Action-12_Sigh",
]

export class Character extends Entity {

    element_entities: Array<Entity> = []

    current_compi: number = 0

    plane_material: BasicMaterial

    images_path: string = ""

    videos_path: string = ""

    character_name: string = ""



    constructor(){
        super()

        this.plane_material = new BasicMaterial()

        this.addComponent(new PlaneShape())
        this.addComponent(this.plane_material)

    }

    play_random() {
        const clip_id = Math.floor(Math.random()*compi_actions.length)
        this.set_video_body(this.current_compi, clip_id, false)
    }

    play(clip_id: number) {
        this.set_video_body(this.current_compi, clip_id, false)
    }

    remove_elements() {
        for (let n=0; n<this.element_entities.length; n++) {
            engine.removeEntity(this.element_entities[n])
        }
    }

    async set_body(id: number, animation: number, reset_material: boolean) {
        if (this.images_path != "") {
            this.set_image_body(id, animation, reset_material)
        }
        if (this.videos_path != "") {
            this.set_video_body(id, animation, reset_material)
        }
    }

    async set_image_body(id: number, animation: number, reset_material: boolean) {
        if (this.images_path == "") {
            return
        }

        log("set image body")
        this.current_compi = id

        if (reset_material) {
            this.plane_material = new BasicMaterial()
            this.addComponentOrReplace(this.plane_material)
        }

        const action = compi_actions[animation]
        let url = this.images_path.replace("{__ID__}", String(id))
        url = url.replace("{__ACTION__}", String(action))
        log(url)
        const myTexture = new Texture(url)
        this.plane_material.texture = myTexture
    }

    async set_video_body(id: number, animation: number, reset_material: boolean) {
        if (this.videos_path == "") {
            return
        }

        log("set video body")
        this.current_compi = id

        if (reset_material) {
            this.plane_material = new BasicMaterial()
            this.addComponentOrReplace(this.plane_material)
        }

        const action = compi_actions[animation]

        let url = this.images_path.replace("{__ID__}", String(id))
        url = url.replace("{__ACTION__}", String(action))
        log(url)
        const myVideoClip = new VideoClip(url)
        const myVideoTexture = new VideoTexture(myVideoClip)
        this.plane_material.texture = myVideoTexture

        myVideoTexture.playing = true
    }
}
