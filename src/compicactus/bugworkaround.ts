@Component("fixShape")
export class FixShape {
  fixed: boolean = false
  fixentity: Entity
}

const invisibleMaterial = new Material()
invisibleMaterial.alphaTest = 1
invisibleMaterial.albedoColor = new Color4(0, 0, 0, 0)

const myGroup = engine.getComponentGroup(PlaneShape, FixShape, OnPointerDown)

class FixerSystem implements ISystem {
    timer: number = 0
    update(dt:number) {
        this.timer += dt
        if (this.timer < 1) return
        for (let entity of myGroup.entities) {
            const fixShape = entity.getComponent(FixShape)
            if (!fixShape.fixed) {
                fixShape.fixed = true
                const fixentity = new Entity()
                fixentity.addComponent(new PlaneShape())
                //fixentity.addComponent(entity.getComponent(Transform))
                fixentity.addComponent(entity.getComponent(OnPointerDown))
                fixentity.addComponent(invisibleMaterial)
                //fixentity.setParent(entity.getParent())
                //fixentity.getComponent(PlaneShape).visible = entity.getComponent(PlaneShape).visible
                fixentity.setParent(entity)
                fixShape.fixentity = fixentity
            }
            fixShape.fixentity.getComponent(PlaneShape).visible = entity.getComponent(PlaneShape).visible
        }
    }
}

engine.addSystem(new FixerSystem())
