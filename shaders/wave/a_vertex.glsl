uniform float u_time;

void main() {
    vec3 new_position = vec3(position.x, position.y + sin(u_time * 10. + position.z), position.z);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(new_position, 1.0);
}