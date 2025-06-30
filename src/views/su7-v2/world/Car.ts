import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'
import World from './index'
import { REFLECT_LAYER } from '../const'
import { noiseFunc } from '../shaders/speedup'

export default class Car {
  base: World

  model: STDLIB.GLTF // 车辆GLTF模型
  bodyMat!: THREE.MeshStandardMaterial // 车身材质
  wheel!: THREE.Group // 车轮组

  private cubeRenderTarget: THREE.WebGLCubeRenderTarget | null = null // 立方体渲染目标（环境贴图）
  private probePos = new THREE.Vector4(0, 0, 0, 1) // 探针位置(xyz)和激活状态(w)
  private probeBoxMin = new THREE.Vector3() // 包围盒最小顶点坐标
  private probeBoxMax = new THREE.Vector3() // 包围盒最大顶点坐标
  private uEnvMapIntensity = 1 // 环境贴图强度系数
  private uDiscardOpacity = 1 // 材质透明度阈值

  constructor(base: World) {
    this.base = base

    // 加载模型资源
    const model = base.resources['sm_car.glb'] as STDLIB.GLTF
    this.model = model

    // 初始化车身材质
    const body = model.scene.getObjectByName('body') as THREE.Mesh
    const bodyMat = body.material as THREE.MeshStandardMaterial
    bodyMat.color = new THREE.Color(38 / 255, 214 / 255, 233 / 255)
    this.bodyMat = bodyMat

    // 初始化车轮
    this.wheel = model.scene.getObjectByName('Wheel') as THREE.Group

    // 设置包围盒
    this.updateCarBounding(model.scene)

    // 处理所有网格材质
    model.scene.traverse((item) => {
      if (item instanceof THREE.Mesh) {
        item.layers.enable(REFLECT_LAYER) // 启用反射层

        const mat = item.material as THREE.MeshStandardMaterial
        // 设置环境光遮蔽贴图
        mat.aoMap = base.resources['t_car_body_AO.raw.jpg'] as THREE.Texture

        this.updateCarMaterial(mat)
      }
    })
  }

  /**
   * 更新车辆包围盒信息
   * @param car - 要计算包围盒的3D对象
   */
  private updateCarBounding(car: THREE.Object3D) {
    // 创建新的包围盒对象
    const box = new THREE.Box3()
    // 根据对象几何体计算包围盒
    box.setFromObject(car)

    // 设置探针位置（使用对象位置，w=1表示激活）
    this.probePos.set(car.position.x, car.position.y, car.position.z, 1)
    // 更新包围盒边界
    this.probeBoxMin.copy(box.min)
    this.probeBoxMax.copy(box.max)
  }

  /**
   * 更新车辆材质配置（实现盒投影环境映射）
   * @param material - 要修改的标准网格材质
   */
  private updateCarMaterial(material: THREE.MeshStandardMaterial) {
    material.defines.USE_BOX_PROJECTION = ''
    // 修改内置材质
    material.onBeforeCompile = (shader) => {
      let { fragmentShader, vertexShader } = shader
      vertexShader = vertexShader.replace(
        '#ifdef USE_TRANSMISSION',
        '#if defined(USE_TRANSMISSION) || defined(USE_BOX_PROJECTION)'
      )
      vertexShader = vertexShader.replace(
        '#ifdef USE_TRANSMISSION',
        '#if defined(USE_TRANSMISSION) || defined(USE_BOX_PROJECTION)'
      )
      vertexShader = vertexShader.replace(
        '#include <common>',
        `#include <common>
      varying vec3 reflectVec; // 声明反射向量变量（传递给片段着色器）
      #if (!defined(USE_UV))
          #define USE_UV // 确保使用UV坐标
      #endif`
      )
      vertexShader = vertexShader.replace(
        '#include <fog_vertex>',
        `
      #include <fog_vertex>
      // 计算世界空间法线
      vec3 worldNormal = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ) );
      // 计算相机到顶点的向量
      vec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
      // 计算反射向量（基于视角和法线）
      reflectVec = reflect( cameraToVertex, worldNormal);
      `
      )
      console.log('🚀 ~ Car ~ updateCarMaterial ~ vertexShader:', vertexShader)
      fragmentShader = fragmentShader.replace(
        '#include <common>',
        `#if defined(USE_TRANSMISSION) || defined(USE_BOX_PROJECTION)
        varying vec3 vWorldPosition; // 世界坐标变量
      #endif
      #include <common>
      varying vec3 reflectVec; // 来自顶点着色器的反射向量
      uniform samplerCube cubeCaptureReflectMap; // 主环境立方体贴图
      uniform samplerCube blurCaptureReflectMap; // 模糊环境贴图（预留）
      uniform float vEnvMapIntensity; // 环境贴图强度
      uniform float vDiscardOpacity; // 透明度阈值
      ${noiseFunc} // 注入噪声函数
      #if (!defined(USE_UV)) 
          #define USE_UV // 确保使用UV坐标
      #endif`
      )
      fragmentShader = fragmentShader.replace(
        '#include <envmap_physical_pars_fragment>',
        `
            #if defined( USE_ENVMAP )
            #if defined( USE_BOX_PROJECTION )
                uniform vec4 probePos;
                uniform vec3 probeBoxMin;
                uniform vec3 probeBoxMax;
                vec3 boxProjection(vec3 nrdir, vec3 worldPos, vec3 probePos, vec3 boxMin, vec3 boxMax) {
                    vec3 tbot = boxMin - worldPos;
                    vec3 ttop = boxMax - worldPos;
                    vec3 tmax = mix(tbot, ttop, step(vec3(0), nrdir));
                    tmax /= nrdir;
                    float t = min(min(tmax.x, tmax.y), tmax.z);
                    return worldPos + nrdir * t - probePos;
                }
            #endif
                vec3 getIBLIrradiance( const in vec3 normal ) {
                    //添加光源
                    #if defined( ENVMAP_TYPE_CUBE_UV )
                        vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
                        #if defined( USE_BOX_PROJECTION )
                            if (probePos.w > 0.001) {
                                worldNormal = boxProjection(worldNormal, vWorldPosition, probePos.xyz, probeBoxMin.xyz, probeBoxMax.xyz);
                            }
                        #endif
                        vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1. );
                        vec4 reflectColor = textureLod( blurCaptureReflectMap, worldNormal, 0.);
                        return PI * mix( reflectColor.rgb, envMapColor.rgb, vEnvMapIntensity);
                    #else
                        return vec3( 0.0 );
                    #endif
                }
                vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
                    #if defined( ENVMAP_TYPE_CUBE_UV )
                        vec3 reflectVec = reflect( - viewDir, normal );
                        // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
                        reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
                        reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
                        #if defined( USE_BOX_PROJECTION )
                            if (probePos.w > 0.001) {
                                reflectVec = boxProjection(reflectVec, vWorldPosition, probePos.xyz, probeBoxMin.xyz, probeBoxMax.xyz);
                            }
                        #endif
                        vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
                        envMapColor.rgb *= vEnvMapIntensity;
                        float lod = roughness*(1.7 - 0.7*roughness);
                        envMapColor.rgb += textureLod( cubeCaptureReflectMap, reflectVec, lod ).rgb * 4.;
                        return envMapColor.rgb;
                    #else
                        return vec3( 0.0 );
                    #endif
                }
            #endif
            `
      )
      fragmentShader = fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        `   
            // 生成基于UV的噪声遮罩
            float discardMask = (noise2d(vUv*15.)+1.)/2.;
            // 计算基于X轴位置的渐变遮罩
            float mm = 1.-(vWorldPosition.x+2.7)/5.4;
            // 如果低于阈值则丢弃片段
            if(mm < (1. - vDiscardOpacity)) discard;
            // 包含原始裁剪平面代码
            #include <clipping_planes_fragment>
            `
      )
      fragmentShader = fragmentShader.replace(
        '#include <dithering_fragment>',
        ` 
            // 包含原始抖动处理
            #include <dithering_fragment>
            // 计算边缘发光遮罩（在阈值附近的小范围内）
            float discardLightMask = (1.-step(mm,(1. - vDiscardOpacity)))*step(mm,(1. - vDiscardOpacity)+0.002);
            // 混合原始颜色和发光颜色（青蓝色）
            gl_FragColor = vec4(vec3(mix(gl_FragColor.rgb,vec3(0.5,0.9,1.),vec3(discardLightMask))),gl_FragColor.a);
            `
      )
      shader.uniforms = {
        ...shader.uniforms,
        // 环境立方体贴图
        cubeCaptureReflectMap: {
          value: this.cubeRenderTarget?.texture || null
        },
        // 模糊环境贴图（预留）
        blurCaptureReflectMap: {
          value: null
        },
        // 环境贴图强度
        vEnvMapIntensity: {
          value: this.uEnvMapIntensity
        },
        // 透明度阈值
        vDiscardOpacity: {
          value: this.uDiscardOpacity
        },
        probeBoxMax: {
          value: this.probeBoxMax
        },
        probeBoxMin: {
          value: this.probeBoxMin
        },
        probePos: {
          value: this.probePos
        }
      }
      shader.vertexShader = vertexShader
      shader.fragmentShader = fragmentShader
    }
    // 标记材质需要重新编译
    material.needsUpdate = true
  }

  addExisting() {
    this.base.scene.add(this.model.scene)
  }

  update() {
    // this.wheel?.children.forEach((item) => {
    //   item.rotateZ(-this.base.params.speed * 0.03)
    // })
  }
}
