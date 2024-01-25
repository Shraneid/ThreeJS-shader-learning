precision highp float;

uniform float u_time;
varying vec3 pos;

varying vec3 vNormal;

void main() {
    vec3 color = 0.5 * (vNormal + 1.0);
    gl_FragColor = vec4(color, 1.0);
}