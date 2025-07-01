#define STANDARD
// 传递给片段着色器的变量
varying vec3 vViewPosition;  // 视图空间位置

// 根据特性需求声明世界位置变量
#if defined(USE_TRANSMISSION) || defined(USE_BOX_PROJECTION)
	varying vec3 vWorldPosition;  // 世界空间位置
#endif

// 包含必要的着色器库文件
#include <common>  // 通用函数和常量

// 反射效果相关变量
varying vec3 reflectVec;  // 反射向量(传递给片段着色器)

// 确保启用UV坐标
#if (!defined(USE_UV))
	#define USE_UV
#endif

// 包含各种功能模块的参数声明
#include <batching_pars_vertex>    // 批处理参数
#include <uv_pars_vertex>          // UV参数
#include <displacementmap_pars_vertex>  // 位移贴图参数
#include <color_pars_vertex>       // 颜色参数
#include <fog_pars_vertex>         // 雾效参数
#include <normal_pars_vertex>      // 法线参数
#include <morphtarget_pars_vertex> // 变形目标参数
#include <skinning_pars_vertex>    // 蒙皮动画参数
#include <shadowmap_pars_vertex>   // 阴影贴图参数
#include <logdepthbuf_pars_vertex> // 对数深度缓冲参数
#include <clipping_planes_pars_vertex> // 裁剪平面参数

void main() {
	// 顶点处理流程
	#include <uv_vertex>            // 处理UV坐标
	#include <color_vertex>         // 处理顶点颜色
	#include <morphinstance_vertex> // 处理实例变形
	#include <morphcolor_vertex>    // 处理变形颜色
	#include <batching_vertex>      // 处理批处理
	
	// 法线处理流程
	#include <beginnormal_vertex>   // 初始化法线
	#include <morphnormal_vertex>   // 处理变形法线
	#include <skinbase_vertex>      // 处理蒙皮基础
	#include <skinnormal_vertex>    // 处理蒙皮法线
	#include <defaultnormal_vertex> // 默认法线
	#include <normal_vertex>        // 最终法线
	
	// 顶点位置处理流程
	#include <begin_vertex>         // 初始化顶点
	#include <morphtarget_vertex>   // 处理变形目标
	#include <skinning_vertex>      // 处理蒙皮顶点
	#include <displacementmap_vertex> // 处理位移贴图
	
	// 空间变换和效果
	#include <project_vertex>       // 投影变换
	#include <logdepthbuf_vertex>   // 对数深度缓冲
	#include <clipping_planes_vertex> // 裁剪平面
	
	// 存储视图空间位置
	vViewPosition = -mvPosition.xyz;
	
	// 世界空间计算
	#include <worldpos_vertex>      // 计算世界坐标
	#include <shadowmap_vertex>     // 阴影贴图处理
	
	// 雾效处理
	#include <fog_vertex>
	
	// 反射效果计算
	vec3 worldNormal = normalize(vec3(vec4(normal, 0.0) * modelMatrix));  // 世界空间法线
	vec3 cameraToVertex = normalize(worldPosition.xyz - cameraPosition);   // 相机到顶点向量
	reflectVec = reflect(cameraToVertex, worldNormal);  // 计算反射向量
	
	// 条件性存储世界位置
	#if defined(USE_TRANSMISSION) || defined(USE_BOX_PROJECTION)
		vWorldPosition = worldPosition.xyz;
	#endif
}