// ==================== 材质定义 ====================
#define STANDARD  // 声明使用标准物理材质

// ==================== 变量传递 ====================
varying vec3 vViewPosition;  // 视图空间位置(用于后续计算)

// 当使用透射效果时需要的世界坐标
#ifdef USE_TRANSMISSION
  varying vec3 vWorldPosition;  // 世界空间位置
#endif

// ==================== 着色器库引入 ====================
#include <common>                    // 通用函数和常量
#include <batching_pars_vertex>      // 批处理相关
#include <uv_pars_vertex>            // UV坐标处理
#include <displacementmap_pars_vertex> // 位移贴图
#include <color_pars_vertex>         // 顶点颜色
#include <fog_pars_vertex>           // 雾效参数
#include <normal_pars_vertex>        // 法线处理
#include <morphtarget_pars_vertex>   // 变形目标
#include <skinning_pars_vertex>      // 骨骼动画
#include <shadowmap_pars_vertex>     // 阴影映射
#include <logdepthbuf_pars_vertex>   // 对数深度缓冲
#include <clipping_planes_pars_vertex> // 裁剪平面

// ==================== 主函数 ====================
void main() {
  // ==================== 顶点属性处理 ====================
  #include <uv_vertex>              // UV坐标变换
  #include <color_vertex>           // 顶点颜色处理
  #include <morphinstance_vertex>   // 实例变形
  #include <morphcolor_vertex>      // 变形颜色
  #include <batching_vertex>        // 批处理变换
  
  // ==================== 法线计算 ====================
  #include <beginnormal_vertex>     // 初始法线
  #include <morphnormal_vertex>     // 变形法线
  #include <skinbase_vertex>        // 骨骼基础变换
  #include <skinnormal_vertex>      // 骨骼法线变换
  #include <defaultnormal_vertex>   // 默认法线
  
  // ==================== 顶点位置计算 ====================
  #include <begin_vertex>           // 初始位置
  #include <morphtarget_vertex>     // 变形目标位置
  #include <skinning_vertex>        // 骨骼顶点变换
  #include <displacementmap_vertex> // 位移贴图应用
  
  // ==================== 坐标系统转换 ====================
  #include <project_vertex>          // 投影变换
  #include <logdepthbuf_vertex>      // 对数深度处理
  #include <clipping_planes_vertex>  // 裁剪平面应用
  
  // 存储视图空间位置(用于片段着色器)
  vViewPosition = -mvPosition.xyz;
  
  // ==================== 后期处理 ====================
  #include <worldpos_vertex>         // 世界坐标计算
  #include <shadowmap_vertex>        // 阴影映射处理
  #include <fog_vertex>             // 雾效计算
  
  // 如果需要透射效果，传递世界坐标
  #ifdef USE_TRANSMISSION
    vWorldPosition = worldPosition.xyz;
  #endif
}