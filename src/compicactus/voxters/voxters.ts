import { Character, planesMenu } from "../generic/generic"

export {planesMenu}

export class Voxters extends Character {
    constructor(){
        super()
        this.images_path = "https://cors-anywhere.herokuapp.com/https://voxters.s3.eu-west-3.amazonaws.com/thumbnails/boxter_{__ID__}.jpg"
        this.videos_path = ""
        this.character_name = "Voxter"
    }
}
