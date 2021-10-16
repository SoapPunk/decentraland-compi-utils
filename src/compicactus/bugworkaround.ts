@Component("fixShape")
export class FixShape {
  fixed: boolean = false
}

const invisibleMaterial = new Material()
invisibleMaterial.alphaTest = 1
invisibleMaterial.albedoColor = new Color4(0, 0, 0, 0)

const myGroup = engine.getComponentGroup(FixShape, OnPointerDown)

class FixerSystem implements ISystem {
    update() {
        for (let entity of myGroup.entities) {
            const fixShape = entity.getComponent(FixShape)
            if (!fixShape.fixed) {
                fixShape.fixed = true
                const fixentity = new Entity()
                fixentity.addComponent(new PlaneShape())
                fixentity.addComponent(entity.getComponent(Transform))
                fixentity.addComponent(entity.getComponent(OnPointerDown))
                fixentity.addComponent(invisibleMaterial)
                fixentity.setParent(entity.getParent())
            }
        }
    }
}

engine.addSystem(new FixerSystem())
