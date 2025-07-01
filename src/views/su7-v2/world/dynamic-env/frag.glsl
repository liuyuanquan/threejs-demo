// ==================== 统一变量声明 ====================
uniform sampler2D uEnvMap1;  // 环境贴图1
uniform sampler2D uEnvMap2;  // 环境贴图2

uniform float uWeight;      // 混合权重 (0.0-1.0)
uniform float uIntensity;   // 强度系数

// ==================== 传递变量 ====================
varying vec2 vUv;           // UV坐标

// ==================== 主函数 ====================
void main() {
    // 采样两种环境贴图颜色
    vec3 color0 = texture(uEnvMap1, vUv).rgb;
    vec3 color1 = texture(uEnvMap2, vUv).rgb;
    
    // 混合两种颜色
    vec3 color = mix(color0, color1, uWeight);
    
    // 应用强度并输出最终颜色（不透明度固定为1.0）
    gl_FragColor = vec4(color * uIntensity, 1.0);
}