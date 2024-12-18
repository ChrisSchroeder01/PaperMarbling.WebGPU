class Drop {
    constructor(center, radius, detail) {
        this.center = center;
        this.radius = radius;

        this.vertices = [];

        for (let i = 0; i < detail; i++) {
            const angle = (i / detail) * 2 * Math.PI;
            this.vertices.push({x: center.x + (Math.cos(angle) * radius), y: center.y + (Math.sin(angle) * radius)});
        }
    }

    Marble(other) {
        for (let i = 0; i < this.vertices.length; i++) {
            const P = this.vertices[i];
            const C = other.center;
            const PminC = {x: P.x-C.x, y: P.y-C.y}
            const PCmag = Math.sqrt(PminC.x * PminC.x + PminC.y * PminC.y);
            const Root = Math.sqrt(1+((other.radius*other.radius)/(PCmag*PCmag)))

            this.vertices[i] = {
                x: C.x + PminC.x * Root,
                y: C.y + PminC.y * Root,
            }
        }
    }
}

export default Drop;