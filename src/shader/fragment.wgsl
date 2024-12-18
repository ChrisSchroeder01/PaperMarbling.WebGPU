@group(0) @binding(0) var<uniform> resolution: vec2<u32>;
@group(0) @binding(1) var<uniform> numdrops: u32;
@group(0) @binding(2) var<uniform> detail: u32;
@group(0) @binding(3) var<storage, read> drops: array<vec2<f32>>;

fn pointInDrop(point: vec2<f32>, dropindex: u32) -> bool {
    var inside = false;

    // Loop through the vertices of the drop
    let startIndex = detail * dropindex;
    for (var i = 0u; i < detail; i = i + 1u) {
        let v1 = drops[startIndex + i];
        let v2 = drops[startIndex + ((i + 1) % detail)]; // Wrap around within the drop

        // Ray-casting algorithm to check if the point is inside
        let intersects = ((v1.y > point.y) != (v2.y > point.y)) &&
                         (point.x < (v2.x - v1.x) * (point.y - v1.y) / (v2.y - v1.y) + v1.x);
        if (intersects) {
            inside = !inside;
        }
    }
    return inside;
}

@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = fragCoord.xy / vec2<f32>(resolution); // Normalize to [0, 1]
    let point = uv * vec2<f32>(resolution);        // Map to canvas space

    // Loop through each drop
    for (var i = numdrops; i >= 0 && i <= numdrops; i = i - 1u) {
        if (pointInDrop(point, i)) {
            return vec4<f32>(f32(i%10)/10, f32(i%10)/10, f32(i%10)/10, 1.0); // Green for inside
        }
    }
    return vec4<f32>(1.0, 1.0, 1.0, 1.0); // White for outside
}
