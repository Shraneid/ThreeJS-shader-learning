uniform float u_time;
varying vec3 pos;
uniform sampler2D noise_texture;

varying vec3 vNormal;

uint murmurHash12(uvec2 src) {
    const uint M = 0x5bd1e995u;
    uint h = 1190494759u;
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

float hash12(vec2 src) {
    uint h = murmurHash12(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

mat4 get_rotation_matrix_x(float angle) {
  float cosine = cos(angle);
  float sinus = sin(angle);

  return mat4(
    vec4(1, 0, 0, 0), 
    vec4(0, cosine, -sinus, 0), 
    vec4(0, sinus, cosine, 0),
    vec4(0, 0, 0, 1)
  );
}

mat4 get_rotation_matrix_y(float angle) {
  float cosine = cos(angle);
  float sinus = sin(angle);

  return mat4(
    vec4(cosine, 0, sinus, 0), 
    vec4(0, 1, 0, 0), 
    vec4(-sinus, 0, cosine, 0),
    vec4(0, 0, 0, 1)
  );
}

void main() {
    vec4 sample_pos = instanceMatrix * vec4(1,1,1,1);

    vec3 test = normal;

    float random_curve_rotation_angle = hash12(sample_pos.xy); // + sin(u_time) / 2.0;

    vec4 local_pos = vec4(position, 1.0);
    
    mat4 bend_rotation_matrix = get_rotation_matrix_x(random_curve_rotation_angle * local_pos.y);

    vec4 rotated_local_pos = bend_rotation_matrix * local_pos;
    
    vec4 world_pos = instanceMatrix * rotated_local_pos;
    gl_Position = projectionMatrix * modelViewMatrix * world_pos;

    vNormal = (modelMatrix * bend_rotation_matrix * vec4(test, 1.0)).xyz;
    vNormal = normalize(vNormal);
}