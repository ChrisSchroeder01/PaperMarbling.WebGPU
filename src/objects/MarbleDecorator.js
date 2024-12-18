function marbleDecorator(marbledDrop, otherDrops) {

}

function marble(dropV, otherV, otherC, otherR) {
    var newVertices = [];

    for (let i = 0; i < dropV.length; i++) {
        const P = dropV[i];
        const C = otherC;
        const PminC = {x: P.x-C.x, y: P.y-C.y}
        const PCmag = Math.sqrt(PminC.x * PminC.x + PminC.y * PminC.y);
        const Root = Math.sqrt(1+((otherR*otherR)/(PCmag*PCmag)))
        newVertices.push({
            x: C.x + PminC.x * Root,
            y: C.y + PminC.y * Root,
        })
    }
}