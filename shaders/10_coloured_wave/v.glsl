uniform float u_time;
varying vec3 pos;

void main() {
    vec3 new_position = vec3(position.x, position.y + sin((u_time * 10. + position.z) / 10.) * 10., position.z + u_time * 10.);

    pos = new_position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(new_position, 1.0);
}