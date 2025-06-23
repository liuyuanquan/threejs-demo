import type * as kokomi from 'kokomi.js'

export const resources: kokomi.ResourceItem[] = [
  {
    name: 'bgm',
    type: 'audio',
    path: 'su7/audio/bgm.mp3'
  },
  {
    name: 'sm_car',
    type: 'gltfModel',
    path: 'su7/mesh/sm_car.gltf'
  },
  {
    name: 'sm_startroom',
    type: 'gltfModel',
    path: 'su7/mesh/sm_startroom.raw.gltf'
  },
  {
    name: 'sm_speedup',
    type: 'gltfModel',
    path: 'su7/mesh/sm_speedup.gltf'
  },
  {
    name: 'ut_car_body_ao',
    type: 'texture',
    path: 'su7/texture/t_car_body_AO.raw.jpg'
  },
  {
    name: 'ut_startroom_ao',
    type: 'texture',
    path: 'su7/texture/t_startroom_ao.raw.jpg'
  },
  {
    name: 'ut_startroom_light',
    type: 'texture',
    path: 'su7/texture/t_startroom_light.raw.jpg'
  },
  {
    name: 'ut_floor_normal',
    type: 'texture',
    path: 'su7/texture/t_floor_normal.webp'
  },
  {
    name: 'ut_floor_roughness',
    type: 'texture',
    path: 'su7/texture/t_floor_roughness.webp'
  },
  {
    name: 'ut_env_night',
    type: 'hdrTexture',
    path: 'su7/texture/t_env_night.hdr'
  },
  {
    name: 'ut_env_light',
    type: 'hdrTexture',
    path: 'su7/texture/t_env_light.hdr'
  },
  {
    name: 'driving',
    type: 'fbxModel',
    path: 'su7/mesh/Driving.fbx'
  },
  {
    name: 'decal',
    type: 'texture',
    path: 'su7/texture/decal.png'
  }
]
