precision highp float;

uniform float u_time;
varying vec3 pos;

void main(){
    // if (pos.x > )
    gl_FragColor = vec4(sin(pos.x + u_time * 10.), pos.y, pos.z, 1.0);
}