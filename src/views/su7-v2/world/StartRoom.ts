import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'
import World from './index'
import { REFLECT_LAYER } from '../const'
import { getReflectMaterial } from '../hooks/useReflect'

function updateFloorMaterial(
  floor: THREE.Mesh,
  renderTarget: THREE.WebGLRenderTarget,
  reflectMatrix: THREE.Matrix4,
  streetMap: THREE.Texture
) {
  const vertexShader = `
    varying vec4 vWorldPosition;
    varying vec2 vUv;
    varying vec2 vUv1;
    varying vec4 vViewPosition;
    varying vec3 vNormal;
    varying vec4 vTangent;

    attribute vec2 uv1;

    #include <common>
    #include <fog_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <logdepthbuf_pars_vertex>

    void main() {
      vUv = uv;
      vUv1 = uv1;
      vWorldPosition = modelMatrix * vec4( position, 1.0 );
      vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
      vViewPosition = mvPosition / mvPosition.w;
      vNormal = normalMatrix * normal;
      #ifdef USE_TANGENT
      vTangent = tangent;
      #endif
      gl_Position = projectionMatrix * mvPosition;
  
      #include <beginnormal_vertex>
      #include <defaultnormal_vertex>
      #include <logdepthbuf_vertex>
      #include <fog_vertex>
      #include <shadowmap_vertex>
    }
  `

  const fragmentShader = `
    varying vec4 vWorldPosition;
    varying vec2 vUv;
    varying vec2 vUv1;
    varying vec4 vViewPosition;
    varying vec3 vNormal;
    varying vec4 vTangent;
  
    uniform vec3 color;
    uniform sampler2D map;
    uniform float opacity;
    uniform float roughness;
    uniform sampler2D roughnessMap;
    uniform float metalness;
    uniform sampler2D metalnessMap;
    uniform sampler2D aoMap;
    uniform sampler2D lightMap;
    uniform vec3 lightMapColor;
    uniform float lightMapIntensity;
    uniform vec3 emissive;
    uniform sampler2D emissiveMap;
    uniform sampler2D normalMap;
    uniform float distortionScale;
    uniform float u_floor_typeSwitch;
    uniform sampler2D ut_street;
  
    uniform float u_lightIntensity;
    uniform float u_reflectIntensity;
    uniform vec2 u_floorUVOffset;
  
    uniform mat4 u_reflectMatrix;
    uniform sampler2D u_reflectTexture;
  
    #include <common>
    #include <packing>
    #include <bsdfs>
    #include <fog_pars_fragment>
    #include <logdepthbuf_pars_fragment>
    #include <lights_pars_begin>
    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
  
    vec4 getNoise( vec2 uv ) {
      vec2 uv0 = ( uv / 103.0 );
      vec2 uv1 = uv / 107.0;
      vec2 uv2 = uv / vec2( 8907.0, 9803.0 );
      vec2 uv3 = uv / vec2( 1091.0, 1027.0 );
      vec4 noise = texture2D( normalMap, uv0 ) +
          texture2D( normalMap, uv1 ) +
          texture2D( normalMap, uv2 ) +
          texture2D( normalMap, uv3 );
      return noise * 0.5 - 1.0;
    }
  
    void main(){
      #include <logdepthbuf_fragment>
  
      vec3 surfaceNormal = vec3(0.,1.,0.);
      #ifdef USE_NORMAL_MAP
          vec3 normalSample = texture2D( normalMap, vWorldPosition.xz+u_floorUVOffset).rgb*2.-vec3(1.);
          surfaceNormal = normalize( normalSample.xzy );
      #endif
  
      vec3 diffuseLight = vec3(0.0);
      vec3 eyeDirection = -vViewPosition.xyz;
      float d = length(eyeDirection);
      eyeDirection = normalize(eyeDirection);
  
      //法线对反射的影响强度
      vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / d ) * distortionScale;

      float metallic = metalness;
      #ifdef USE_METALNESS_MAP
          metallic = texture2D(metalnessMap, vUv).b * metallic;
      #endif
  
      float theta = max( dot( eyeDirection, vNormal ), 0.0 );
      float rf0 = 0.02;
      float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 2.0 );

      float roughness_factory = roughness;
      #ifdef USE_ROUGHNESS_MAP
          roughness_factory *= texture2D(roughnessMap, (vWorldPosition.xz+u_floorUVOffset)*0.2).g;
      #endif
      roughness_factory = roughness_factory*(1.7 - 0.7*roughness_factory);

      vec4 samplePoint = u_reflectMatrix * vWorldPosition;
      samplePoint = samplePoint / samplePoint.w;
      vec3 reflectionSample = texture2D(u_reflectTexture, samplePoint.xy + distortion, roughness_factory*6.).xyz * u_reflectIntensity;
      vec3 lightSample = vec3(lightMapIntensity * u_lightIntensity)*lightMapColor;
  
      #ifdef USE_LIGHT_MAP
        lightSample *= texture2D(lightMap,vUv1).rgb;
      #endif
  
      #ifdef USE_AO_MAP
        float aoSample = texture2D(aoMap,vUv1).r;
        lightSample*=aoSample;
      #endif
  
      vec3 streetCol = texture(ut_street,vec2((vWorldPosition.z+15.)/30.,(vWorldPosition.x+u_floorUVOffset.x)/60.)).rgb;
      lightSample = mix(lightSample,streetCol,vec3(u_floor_typeSwitch));

      vec3 colorFactory = color;
      #ifdef USE_MAP
          vec3 mapColor = texture2D(map, vUv);
          colorFactory *= mapColor.rgb;
      #endif

      #ifdef USE_FLOOR_MAP
      //漫反射强度的简单计算方式
      diffuseLight = lightSample * colorFactory; //* theta;
      vec3 outColor = mix(diffuseLight, reflectionSample, reflectance);

      gl_FragColor = vec4(outColor, opacity);
      #else
      gl_FragColor = vec4(reflectionSample, opacity*0.4);
      #endif

      
      // gl_FragColor = vec4(vec3(theta*(roughness_factory)), 1.);
      // gl_FragColor = vec4(vec3(texture2D(lightMap,vUv2).rgb), 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }
  `

  const uniforms: { [uniform: string]: THREE.IUniform } = {
    color: { value: new THREE.Color() },
    map: { value: null },
    opacity: { value: 1 },
    roughness: { value: 1 },
    roughnessMap: { value: null },
    metalness: { value: 1 },
    metalnessMap: { value: null },
    aoMap: { value: null },
    lightMap: { value: null },
    lightMapColor: { value: new THREE.Color(0xffffff) },
    lightMapIntensity: { value: 1 },
    emissive: { value: new THREE.Color() },
    emissiveMap: { value: null },
    normalMap: { value: null },
    distortionScale: { value: 0 },
    u_lightIntensity: { value: 1 },
    u_reflectIntensity: { value: 1 },
    u_floor_typeSwitch: { value: 0 },
    ut_street: { value: streetMap },
    u_floorUVOffset: { value: new THREE.Vector2() },
    ...THREE.UniformsLib.fog,
    ...THREE.UniformsLib.lights,
    u_reflectMatrix: { value: reflectMatrix },
    u_reflectTexture: { value: renderTarget.texture }
  }

  const defines: { [key: string]: any } = {
    USE_FLOOR_MAP: true
  }
  const material = floor.material as THREE.MeshStandardMaterial

  uniforms.color.value = material.color

  if (material.map) {
    // material.map.anisotropy = 4;
    uniforms.map.value = material.map
    defines.USE_MAP = true
  }
  uniforms.opacity.value = material.opacity
  if (material.roughnessMap) {
    uniforms.roughnessMap.value = material.roughnessMap
    defines.USE_ROUGHNESS_MAP = true
  }
  uniforms.metalness.value = material.metalness
  if (material.metalnessMap) {
    uniforms.metalnessMap.value = material.metalnessMap
    defines.USE_METALNESS_MAP = true
  }
  uniforms.emissive.value = material.emissive
  if (material.emissiveMap) {
    uniforms.emissiveMap.value = material.emissiveMap
    defines.USE_EMISSIVE_MAP = true
  }
  if (material.aoMap) {
    uniforms.aoMap.value = material.aoMap
    defines.USE_AO_MAP = true
  }
  uniforms.lightMapIntensity.value = material.lightMapIntensity
  if (material.lightMap) {
    uniforms.lightMap.value = material.lightMap
    defines.USE_LIGHT_MAP = true
  }
  if (material.normalMap) {
    // material.normalMap.anisotropy = 4;
    uniforms.normalMap.value = material.normalMap
    defines.USE_NORMAL_MAP = true
  }

  const shader = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    defines
  })

  shader.name = 'M_Reflect'
  material.dispose()

  floor.layers.disable(REFLECT_LAYER)
  floor.material = shader

  return shader
}

export default class StartRoom {
  base: World
  model: STDLIB.GLTF
  d: any
  constructor(base: World) {
    this.base = base

    const model = base.resources['sm_startroom.raw.glb'] as STDLIB.GLTF
    this.model = model

    const light = model.scene.getObjectByName('light001') as THREE.Mesh
    const lightMat = light.material as THREE.MeshStandardMaterial
    lightMat.emissive = new THREE.Color(0xffffff)
    lightMat.emissiveIntensity = 1
    lightMat.depthWrite = false
    lightMat.transparent = true

    const floor = model.scene.getObjectByName('ReflecFloor') as THREE.Mesh
    const floorMat = floor.material as THREE.MeshPhysicalMaterial
    floorMat.aoMap = base.resources['t_startroom_ao.raw.jpg'] as THREE.Texture
    floorMat.lightMap = base.resources['t_startroom_light.raw.jpg'] as THREE.Texture
    floorMat.normalMap = base.resources['t_floor_normal.webp'] as THREE.Texture
    floorMat.roughnessMap = base.resources['t_floor_roughness.webp'] as THREE.Texture
    floorMat.envMapIntensity = 0

    const d = getReflectMaterial(base)
    this.d = d

    updateFloorMaterial(
      floor,
      d.renderTarget,
      d.reflectMatrix,
      base.resources['t_street.webp'] as THREE.Texture
    )
  }
  addExisting() {
    this.base.scene.add(this.model.scene)
  }
  update() {
    this.d.update()
  }
}
