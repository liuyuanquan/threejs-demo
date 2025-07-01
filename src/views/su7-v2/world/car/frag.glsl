// ==================== 材质特性定义 ====================
#define STANDARD  // 标准材质标识

#ifdef PHYSICAL
    #define IOR          // 启用折射率
    #define USE_SPECULAR // 启用高光
#endif

// ==================== 材质基础属性 ====================
uniform vec3 diffuse;     // 漫反射颜色
uniform vec3 emissive;    // 自发光颜色
uniform float roughness;  // 粗糙度 (0.0-1.0)
uniform float metalness;  // 金属度 (0.0-1.0)
uniform float opacity;    // 不透明度 (0.0-1.0)

// ==================== 高级材质特性 ====================
#ifdef IOR
    uniform float ior;    // 折射率
#endif

#ifdef USE_SPECULAR
    uniform float specularIntensity;  // 高光强度
    uniform vec3 specularColor;       // 高光颜色
    
    #ifdef USE_SPECULAR_COLORMAP
        uniform sampler2D specularColorMap;  // 高光颜色贴图
    #endif
    
    #ifdef USE_SPECULAR_INTENSITYMAP
        uniform sampler2D specularIntensityMap;  // 高光强度贴图
    #endif
#endif

#ifdef USE_CLEARCOAT
    uniform float clearcoat;           // 清漆层强度
    uniform float clearcoatRoughness;  // 清漆层粗糙度
#endif

#ifdef USE_IRIDESCENCE
    uniform float iridescence;               // 虹彩效果强度
    uniform float iridescenceIOR;            // 虹彩折射率
    uniform float iridescenceThicknessMinimum;  // 最小虹彩厚度
    uniform float iridescenceThicknessMaximum;  // 最大虹彩厚度
#endif

#ifdef USE_SHEEN
    uniform vec3 sheenColor;          // 光泽颜色
    uniform float sheenRoughness;     // 光泽粗糙度
    
    #ifdef USE_SHEEN_COLORMAP
        uniform sampler2D sheenColorMap;  // 光泽颜色贴图
    #endif
    
    #ifdef USE_SHEEN_ROUGHNESSMAP
        uniform sampler2D sheenRoughnessMap;  // 光泽粗糙度贴图
    #endif
#endif

#ifdef USE_ANISOTROPY
    uniform vec2 anisotropyVector;  // 各向异性方向
    
    #ifdef USE_ANISOTROPYMAP
        uniform sampler2D anisotropyMap;  // 各向异性贴图
    #endif
#endif

// ==================== 变量声明 ====================
varying vec3 vViewPosition;  // 视图空间位置

#if defined(USE_TRANSMISSION) || defined(USE_BOX_PROJECTION)
    varying vec3 vWorldPosition;  // 世界坐标变量
#endif

// ==================== 自定义环境贴图变量 ====================
#include <common>
varying vec3 reflectVec;  // 来自顶点着色器的反射向量
uniform samplerCube cubeCaptureReflectMap;  // 主环境立方体贴图
uniform samplerCube blurCaptureReflectMap;  // 模糊环境贴图（预留）
uniform float vEnvMapIntensity;  // 环境贴图强度
uniform float vDiscardOpacity;  // 透明度阈值

// ==================== 噪声函数 ====================
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise2d(in vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
    
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
}

// ==================== 确保使用UV坐标 ====================
#if (!defined(USE_UV))
    #define USE_UV
#endif

// ==================== 包含着色器库 ====================
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>

// ==================== 环境贴图处理 ====================
#if defined(USE_ENVMAP)
    #if defined(USE_BOX_PROJECTION)
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

    vec3 getIBLIrradiance(const in vec3 normal) {
        #if defined(ENVMAP_TYPE_CUBE_UV)
            vec3 worldNormal = inverseTransformDirection(normal, viewMatrix);
            
            #if defined(USE_BOX_PROJECTION)
                if (probePos.w > 0.001) {
                    worldNormal = boxProjection(worldNormal, vWorldPosition, probePos.xyz, probeBoxMin.xyz, probeBoxMax.xyz);
                }
            #endif
            
            vec4 envMapColor = textureCubeUV(envMap, worldNormal, 1.);
            vec4 reflectColor = textureLod(blurCaptureReflectMap, worldNormal, 0.);
            return PI * mix(reflectColor.rgb, envMapColor.rgb, vEnvMapIntensity);
        #else
            return vec3(0.0);
        #endif
    }

    vec3 getIBLRadiance(const in vec3 viewDir, const in vec3 normal, const in float roughness) {
        #if defined(ENVMAP_TYPE_CUBE_UV)
            vec3 reflectVec = reflect(-viewDir, normal);
            reflectVec = normalize(mix(reflectVec, normal, roughness * roughness));
            reflectVec = inverseTransformDirection(reflectVec, viewMatrix);
            
            #if defined(USE_BOX_PROJECTION)
                if (probePos.w > 0.001) {
                    reflectVec = boxProjection(reflectVec, vWorldPosition, probePos.xyz, probeBoxMin.xyz, probeBoxMax.xyz);
                }
            #endif
            
            vec4 envMapColor = textureCubeUV(envMap, reflectVec, roughness);
            envMapColor.rgb *= vEnvMapIntensity;
            float lod = roughness * (1.7 - 0.7 * roughness);
            envMapColor.rgb += textureLod(cubeCaptureReflectMap, reflectVec, lod).rgb * 4.;
            return envMapColor.rgb;
        #else
            return vec3(0.0);
        #endif
    }
#endif

// ==================== 其他着色器库 ====================
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

// ==================== 主函数 ====================
void main() {
    // 初始化基础颜色
    vec4 diffuseColor = vec4(diffuse, opacity);
    
    // ==================== 自定义透明度处理 ====================
    // 生成基于UV的噪声遮罩
    float discardMask = (noise2d(vUv * 15.) + 1.) / 2.;
    // 计算基于X轴位置的渐变遮罩
    float mm = 1. - (vWorldPosition.x + 2.7) / 5.4;
    // 如果低于阈值则丢弃片段
    if (mm < (1. - vDiscardOpacity)) discard;
    // 包含原始裁剪平面代码
    #include <clipping_planes_fragment>
    
    // 初始化反射光
    ReflectedLight reflectedLight = ReflectedLight(
        vec3(0.0),  // directDiffuse
        vec3(0.0),  // directSpecular
        vec3(0.0),  // indirectDiffuse
        vec3(0.0)   // indirectSpecular
    );
    
    // 初始化自发光
    vec3 totalEmissiveRadiance = emissive;
    
    // ==================== 标准处理流程 ====================
    #include <logdepthbuf_fragment>    // 深度缓冲
    #include <map_fragment>           // 主贴图
    #include <color_fragment>         // 颜色处理
    #include <alphamap_fragment>      // Alpha贴图
    #include <alphatest_fragment>     // Alpha测试
    #include <alphahash_fragment>     // Alpha哈希
    #include <roughnessmap_fragment>  // 粗糙度贴图
    #include <metalnessmap_fragment>  // 金属度贴图
    
    // 法线处理
    #include <normal_fragment_begin>  // 基础法线
    #include <normal_fragment_maps>   // 法线贴图
    
    // 清漆层法线处理
    #include <clearcoat_normal_fragment_begin>
    #include <clearcoat_normal_fragment_maps>
    
    // 自发光贴图
    #include <emissivemap_fragment>
    
    // 物理光照计算
    #include <lights_physical_fragment>
    
    // 光照处理流程
    #include <lights_fragment_begin>  // 光照开始
    #include <lights_fragment_maps>   // 光照贴图
    #include <lights_fragment_end>    // 光照结束
    
    // 环境光遮蔽
    #include <aomap_fragment>
    
    // 合并漫反射和高光
    vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
    vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
    
    // 透射效果处理
    #include <transmission_fragment>
    
    // 计算最终输出光
    vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
    
    // 光泽效果处理
    #ifdef USE_SHEEN
        float sheenEnergyComp = 1.0 - 0.157 * max3(material.sheenColor);
        outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
    #endif
    
    // 清漆效果处理
    #ifdef USE_CLEARCOAT
        float dotNVcc = saturate(dot(geometryClearcoatNormal, geometryViewDir));
        vec3 Fcc = F_Schlick(material.clearcoatF0, material.clearcoatF90, dotNVcc);
        outgoingLight = outgoingLight * (1.0 - material.clearcoat * Fcc) 
                      + (clearcoatSpecularDirect + clearcoatSpecularIndirect) * material.clearcoat;
    #endif
    
    // ==================== 最终输出处理 ====================
    #include <opaque_fragment>          // 不透明处理
    #include <tonemapping_fragment>     // 色调映射
    #include <colorspace_fragment>      // 色彩空间转换
    #include <fog_fragment>            // 雾效应用
    #include <premultiplied_alpha_fragment> // 预乘Alpha
    
    // ==================== 自定义边缘发光效果 ====================
    #include <dithering_fragment>       // 抖动效果
    // 计算边缘发光遮罩（在阈值附近的小范围内）
    float discardLightMask = (1. - step(mm, (1. - vDiscardOpacity))) * step(mm, (1. - vDiscardOpacity) + 0.002);
    // 混合原始颜色和发光颜色（青蓝色）
    gl_FragColor = vec4(vec3(mix(gl_FragColor.rgb, vec3(0.5, 0.9, 1.), vec3(discardLightMask))), gl_FragColor.a);
}