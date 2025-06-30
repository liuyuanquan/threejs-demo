import * as THREE from 'three'
import World from '../world'
import { REFLECT_LAYER } from '../const'

const up = new THREE.Vector3(0, 1, 0)

export const getReflectMaterial = (base: World) => {
  const width = 512
  const height = 512
  const node = new THREE.Group()

  const _camera = new THREE.PerspectiveCamera()
  const reflectPlane = new THREE.Plane()
  const reflectMatrix = new THREE.Matrix4()
  const renderTarget = new THREE.WebGLRenderTarget(width, height)

  renderTarget.texture.generateMipmaps = true
  renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter
  renderTarget.texture.wrapS = THREE.ClampToEdgeWrapping
  renderTarget.texture.wrapT = THREE.ClampToEdgeWrapping

  node.add(_camera)
  reflectPlane.set(up, 0)

  base.scene.add(node)

  const destroy = () => {
    base.scene.remove(node)
    // destroyObject3D(node)
    renderTarget.dispose()
  }

  const update = () => {
    const camera = base.camera
    const renderer = base.renderer

    reflectPlane.set(up, 0)
    reflectPlane.applyMatrix4(node.matrixWorld)
    _camera.copy(camera)
    const r = new THREE.Vector3(0, 0, 1).negate()
    const o = camera.getWorldPosition(new THREE.Vector3())
    r.applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()))
    if (r.dot(reflectPlane.normal) > 0) {
      return
    }

    r.reflect(reflectPlane.normal)
    const p = new THREE.Vector3()
    reflectPlane.projectPoint(o, p)

    const y = p.clone()
    y.sub(o).add(p)
    _camera.position.copy(y)

    const d = new THREE.Vector3(0, 0, -1)
    d.applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()))
    d.add(o)

    const E = new THREE.Vector3()
    node.getWorldPosition(E)
    E.sub(d)

    E.reflect(reflectPlane.normal).negate()
    E.add(node.getWorldPosition(new THREE.Vector3()))

    _camera.layers.disableAll()
    _camera.layers.enable(REFLECT_LAYER)

    _camera.up.set(0, 1, 0)
    _camera.applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()))

    _camera.up.reflect(reflectPlane.normal)
    _camera.lookAt(E)
    _camera.updateMatrixWorld()
    const L = new THREE.Matrix4()
    L.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
    L.multiply(_camera.projectionMatrix)
    L.multiply(_camera.matrixWorldInverse)

    reflectMatrix.copy(L)

    reflectPlane.applyMatrix4(_camera.matrixWorldInverse)
    const k = new THREE.Vector4(
      reflectPlane.normal.x,
      reflectPlane.normal.y,
      reflectPlane.normal.z,
      reflectPlane.constant
    )
    const X = _camera.projectionMatrix
    const $ = new THREE.Vector4()
    $.x = (Math.sign(k.x) + X.elements[8]) / X.elements[0]
    $.y = (Math.sign(k.y) + X.elements[9]) / X.elements[5]
    $.z = -1
    $.w = (1 + X.elements[10]) / X.elements[14]
    k.multiplyScalar(2 / k.dot($))
    X.elements[2] = k.x
    X.elements[6] = k.y
    X.elements[10] = k.z + 1
    X.elements[14] = k.w

    renderer.setRenderTarget(renderTarget)
    renderer.state.buffers.depth.setMask(true)
    renderer.autoClear === false && renderer.clear()
    node.visible = false

    renderer.render(base.scene, _camera)

    node.visible = true
    renderer.setRenderTarget(null)

    const viewport = camera.viewport
    if (viewport) {
      renderer.state.viewport(viewport)
    }
  }

  return {
    destroy,
    update,
    renderTarget,
    reflectMatrix
  }
}
