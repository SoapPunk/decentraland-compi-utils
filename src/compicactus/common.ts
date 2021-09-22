// Get distance
/*
Note:
This function really returns distance squared, as it's a lot more efficient to calculate.
The square root operation is expensive and isn't really necessary if we compare the result to squared values.
We also use {x,z} not {x,y}. The y-coordinate is how high up it is.
*/
export function distance(pos1: Vector3, pos2: Vector3): number {
    const a = pos1.x - pos2.x
    const b = pos1.y - pos2.y
    const c = pos1.z - pos2.z
    return a * a + b * b + c * c
}


export function distance_is_less_than(pos1: any, pos2: any, dist:number) {
    return distance(pos1, pos2) < dist * dist * dist
}

// Random number between 2 numbers
export function randomRange(number1: number, number2: number) {
    return (Math.random()*(number2-number1))+number1
}


// Random number between 2 numbers
export function randomInt(number1: number, number2: number) {
    return Math.floor((Math.random()*(number2-number1))+number1)
}


//
export function interpolateValue(initialTime: number, finalTime: number, initialValue: number, finalValue: number, currentTime: number) {
    const sample = (currentTime - initialTime) / (finalTime - initialTime)
    const res = ((finalValue - initialValue) * sample) + initialValue
    return res
}


//
export function interpolateAnimation(keyframes: Array<any>, currentTime: number) {
    let initialKeyframe = 0
    let finalKeyframe = 0
    for (let k=0; k<keyframes.length; k++) {
        if (keyframes[k].time > currentTime) {
            if (k > 0) {
                initialKeyframe = k-1
                finalKeyframe = k
            } else {
                return keyframes[0].value
            }
            break
        }
    }
    //
    return interpolateValue(
        keyframes[initialKeyframe].time,
        keyframes[finalKeyframe].time,
        keyframes[initialKeyframe].value,
        keyframes[finalKeyframe].value,
        currentTime
    )
}


export const fetchRetry = async (url: string, options: any, n: number) => {
    for (let i = 0; i < n; i++) {
        try {
            return await fetch(url, options)
        } catch (err) {
            const isLastAttempt = i + 1 === n
            if (isLastAttempt) throw err
        }
    }
}


export function isInsideSquare(x: number, y: number, low_x: number, high_x: number, low_y: number, high_y: number) {
    if (x < low_x || x > high_x || y < low_y || y > high_y) {
        return false
    }
    return true
}


export function dot(v1: Vector3, v2: Vector3) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}


export function getGlobalPosition(entity: IEntity) :Vector3 {
    let entityPosition = entity.hasComponent(Transform) ? entity.getComponent(Transform).position.clone() : Vector3.Zero()
    let parentEntity = entity.getParent()

    if (parentEntity != null) {
        let parentRotation = parentEntity.hasComponent(Transform) ? parentEntity.getComponent(Transform).rotation : Quaternion.Identity
        return getGlobalPosition(parentEntity).add(entityPosition.rotate(parentRotation))
    }

    return entityPosition
}


export function planeRayIntersection(rayVector:Vector3, rayPoint:Vector3, planePoint:Vector3, planeNormal:Vector3) {
    const diff = rayPoint.subtract(planePoint)
    const prod1 = dot(diff, planeNormal)
    const prod2 = dot(rayVector, planeNormal)
    const prod3 = prod1 / prod2
    const intersection = rayPoint.subtract(rayVector.scale(prod3))
    return intersection
}

export function getUniqueEntityByComponent(component: any) {
    let inputs = engine.getEntitiesWithComponent(component)
    for (const key in inputs) {
        if (inputs.hasOwnProperty(key)) {
            return inputs[key].getComponent(component)
        }
    }
}


export function tiles(x:number, y:number, nx:number, ny:number, mirror: boolean = false) {
    const height = 1/x
    const width = 1/y
    let uv

    if (!mirror) {
        uv = [
            height*(nx+1), width*ny,
            height*nx, width*ny,
            height*nx, width*(ny+1),
            height*(nx+1), width*(ny+1),
            //
            height*(nx+1), width*ny,
            height*nx, width*ny,
            height*nx, width*(ny+1),
            height*(nx+1), width*(ny+1),
        ]
    } else {
        uv = [
            height*nx, width*ny,
            height*(nx+1), width*ny,
            height*(nx+1), width*(ny+1),
            height*nx, width*(ny+1),
            //
            height*nx, width*ny,
            height*(nx+1), width*ny,
            height*(nx+1), width*(ny+1),
            height*nx, width*(ny+1),
        ]
    }

    //log("UV", uv)
    return uv
}


export function gravityToVelocity(force:number, inv_mass:number, gravity:number, dt:number) {
    // Symplectic Euler
    return force * inv_mass * dt
}


export function sleep(milliseconds:number) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
