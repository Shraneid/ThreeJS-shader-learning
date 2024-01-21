uniform float u_time;
varying vec3 pos;

void main() {
    vec3 new_position = vec3(position.x, position.y, position.z);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(new_position, 1.0);
}