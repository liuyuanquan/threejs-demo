uniform float u_time;
uniform float u_frequency;

// 伪随机数
float random(vec2 st){
  return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

// 使用分形叠加
float improvedNoise(vec3 p,vec3 rep){
  // 创建基础噪声
  float result=0.;// 最终噪声值
  float amplitude=1.;// 当前振幅
  float frequency=1.;// 当前频率
  float maxValue=0.;// 用于归一化的最大值
  
  // 分形布朗运动 - 叠加不同频率的噪声
  for(int i=0;i<3;i++){
    vec2 grid=floor(mod(p.xy*frequency,rep.xy));// 创建网格坐标
    vec2 f=fract(p.xy*frequency);// 获取网格内位置
    
    // 四个角的随机值
    float a=random(grid);
    float b=random(grid+vec2(1.,0.));
    float c=random(grid+vec2(0.,1.));
    float d=random(grid+vec2(1.,1.));
    
    // 改进的平滑插值 - 使用更平滑的曲线
    vec2 u=f*f*f*(f*(f*6.-15.)+10.);// 更平滑的Perlin插值曲线
    
    // 混合四个角的值
    float noise=mix(
      mix(a,b,u.x),
      mix(c,d,u.x),
      u.y
    );
    
    // 添加旋转变化，使噪声在z轴上更有变化
    float zAngle=p.z*frequency/rep.z;
    float zFactor=.5+.5*sin(zAngle*6.2831853);
    
    // 累加噪声
    result+=noise*amplitude*zFactor;
    maxValue+=amplitude;
    
    // 调整下一次迭代的频率和振幅
    amplitude*=.5;
    frequency*=2.;
  }
  
  // 归一化结果
  return result/maxValue*2.2;
}

void main(){
  float noise=3.*improvedNoise(position+vec3(u_time*.5,u_time*.3,u_time*.7),vec3(10.));// 计算噪声值，随时间变化位置
  float displacement=(u_frequency/30.)*(noise/10.);// 计算位移量，受u_frequency控制
  vec3 newPosition=position+normal*displacement;// 沿法线方向位移顶点
  gl_Position=projectionMatrix*modelViewMatrix*vec4(newPosition,1.);// 计算最终顶点位置
}