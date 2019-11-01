import { BlockModel, PackMeta } from "@xmcl/common";
import { BoxGeometry, Group, LinearFilter, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, NearestFilter, Object3D, TextureLoader, Vector2, Vector3 } from "three";

interface Texture {
    url: string;
    animation?: PackMeta.Animation;
}
type TextureRegistry = Record<string, Texture>;

export const DEFAULT_TRANSFORM: BlockModel.Transform = {
    rotation: [0, 0, 0],
    translation: [0, 0, 0],
    scale: [1, 1, 1],
};
export const DEFAULT_DISPLAY: BlockModel.Display = {
    ground: DEFAULT_TRANSFORM,
    gui: DEFAULT_TRANSFORM,
    thirdperson_lefthand: DEFAULT_TRANSFORM,
    thirdperson_righthand: DEFAULT_TRANSFORM,
    firstperson_lefthand: DEFAULT_TRANSFORM,
    firstperson_righthand: DEFAULT_TRANSFORM,
    fixed: DEFAULT_TRANSFORM,
    head: DEFAULT_TRANSFORM,
};
export const BUILTIN_GENERATED: BlockModel.Resolved = {
    display: DEFAULT_DISPLAY,
    ambientocclusion: false,
    textures: {},
    elements: [
        {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
                down: { uv: [0, 0, 16, 16], texture: "" },
            },
        }
    ],
    overrides: [],
};

function findRealTexturePath(model: BlockModel.Resolved, variantKey: string) {
    let texturePath = model.textures[variantKey] as string;
    while (texturePath.startsWith("#")) {
        const next = model.textures[texturePath.substring(1, texturePath.length)];
        if (!next) { return undefined; }
        texturePath = next;
    }
    return texturePath;
}

export class BlockModelObject extends Object3D {
    animationLoop: boolean = false;
    displayOption: BlockModel.Display = DEFAULT_DISPLAY;

    applyDisplay(option: string) {
        const group = this.children[0];

        if (option === "block") {

            // reset transformations
            group.rotation.set(0, 0, 0);
            group.position.set(0, 0, 0);
            group.scale.set(1, 1, 1);
        } else {
            if (!this.displayOption.hasOwnProperty(option)) {
                throw new Error("Display option is invalid.");
            }

            const options = (this.displayOption as any)[option];

            const rot = options.rotation;
            const pos = options.translation;
            const scale = options.scale;

            // apply transformations
            group.rotation.set(rot[0] * Math.PI / 180, rot[1] * Math.PI / 180, rot[2] * Math.PI / 180);
            group.position.set(pos[0], pos[1], pos[2]);
            group.scale.set(scale[0] === 0 ? 0.00001 : scale[0], scale[1] === 0 ? 0.00001 : scale[1], scale[2] === 0 ? 0.00001 : scale[2]);
        }
    }

    getCenter() {
        const group = this.children[0];

        // compute absolute bounding box
        const box = {
            minx: 0, miny: 0, minz: 0,
            maxx: 0, maxy: 0, maxz: 0,
        };

        for (let i = 0; i < group.children.length; i++) {

            const pivot = group.children[i];
            const mesh = pivot.children[0] as Mesh;
            const geo = mesh.geometry as BoxGeometry;

            for (let j = 0; j < geo.vertices.length; j++) {

                // convert vertex coordinates to world coordinates
                const vertex = geo.vertices[j].clone();
                const abs = mesh.localToWorld(vertex);

                // update bounding box

                if (abs.x < box.minx) { box.minx = abs.x; }
                if (abs.y < box.miny) { box.miny = abs.y; }
                if (abs.z < box.minz) { box.minz = abs.z; }

                if (abs.x > box.maxx) { box.maxx = abs.x; }
                if (abs.y > box.maxy) { box.maxy = abs.y; }
                if (abs.z > box.maxz) { box.maxz = abs.z; }
            }
        }

        // return the center of the bounding box

        return new Vector3(
            (box.minx + box.maxx) / 2,
            (box.miny + box.maxy) / 2,
            (box.minz + box.maxz) / 2,
        );
    }
}

export class BlockModelFactory {
    private static TRANSPARENT_MATERIAL = new MeshBasicMaterial({ transparent: true, opacity: 0, alphaTest: 0.5 });

    private loader = new TextureLoader();
    private cachedMaterial: Record<string, Material> = {};

    constructor(readonly textureRegistry: TextureRegistry, readonly option: { clipUVs?: boolean, modelOnly?: boolean } = {}) { }

    /**
     * Get threejs `Object3D` for that block model.
     */
    getObject(model: BlockModel.Resolved) {
        const option = this.option;
        const textureRegistry = this.textureRegistry;

        const clipUVs = option.clipUVs || false;
        const modelOnly = option.modelOnly || false;

        const obj = new BlockModelObject();
        const group = new Group();
        group.name = "wrapper";

        const materials: Material[] = [BlockModelFactory.TRANSPARENT_MATERIAL];
        const materialIndex: { [variant: string]: number } = {};
        const materialPathIndex: { [texPath: string]: number } = {};

        for (const variant of Object.keys(model.textures)) {
            const texPath = findRealTexturePath(model, variant);
            if (!texPath) {
                console.error(`Cannot find texture @${texPath}`);
                materialIndex[variant] = 0; // transparent material
            } else if (texPath in materialPathIndex) {
                materialIndex[variant] = materialPathIndex[texPath];
            } else if (texPath in this.cachedMaterial) { // cached
                materialIndex[variant] = materials.length;
                materialPathIndex[texPath] = materialIndex.length;
                materials.push(this.cachedMaterial[texPath]);
            } else if (texPath in textureRegistry) { // in reg
                // build new material
                const tex = textureRegistry[texPath];
                const texture = this.loader.load(tex.url);

                // sharp pixels and smooth edges
                texture.magFilter = NearestFilter;
                texture.minFilter = LinearFilter;

                // map texture to material, keep transparency and fix transparent z-fighting
                const mat = new MeshLambertMaterial({ map: texture, transparent: true, alphaTest: 0.5 });

                materialIndex[variant] = materials.length;
                materialPathIndex[texPath] = materialIndex.length;
                this.cachedMaterial[texPath] = mat;

                materials.push(mat);
            } else {
                console.error(`Cannot find texture @${texPath}`);
                materialIndex[variant] = 0; // transparent material
            }
        }

        for (const element of model.elements) {
            // checkElement(element)
            // get dimensions and origin
            const width = element.to[0] - element.from[0];
            const height = element.to[1] - element.from[1];
            const length = element.to[2] - element.from[2];

            const origin = {
                x: (element.to[0] + element.from[0]) / 2 - 8,
                y: (element.to[1] + element.from[1]) / 2 - 8,
                z: (element.to[2] + element.from[2]) / 2 - 8,
            };

            const fix = 0.001;
            const blockGeometry = new BoxGeometry(width + fix, height + fix, length + fix);
            const blockMesh = new Mesh(blockGeometry, materials);
            blockMesh.name = "block-element";

            blockGeometry.faceVertexUvs[0] = [];

            blockMesh.position.x = origin.x;
            blockMesh.position.y = origin.y;
            blockMesh.position.z = origin.z;

            const faces = ["east", "west", "up", "down", "south", "north"] as const;
            for (let i = 0; i < 6; i++) {
                const face = element.faces![faces[i]];
                if (face) {
                    // get material index
                    const index = materialIndex[face.texture.substring(1, face.texture.length)];  // references.indexOf(ref[0] == '#' ? ref.substring(1) : ref)

                    blockGeometry.faces[i * 2].materialIndex = index;
                    blockGeometry.faces[i * 2 + 1].materialIndex = index;

                    let uv: number[] = face.uv || [0, 0, 16, 16];

                    if (clipUVs) {
                        uv = uv.map((e) => {
                            if (e + 0.00001 < 0) {
                                return 0;
                            } else if (e - 0.00001 > 16) {
                                return 16;
                            } else {
                                return e;
                            }
                        });
                    }

                    uv = uv.map((e) => e / 16);

                    // fix edges
                    uv[0] += 0.0005;
                    uv[1] += 0.0005;
                    uv[2] -= 0.0005;
                    uv[3] -= 0.0005;

                    let map = [
                        new Vector2(uv[0], 1 - uv[1]),
                        new Vector2(uv[0], 1 - uv[3]),
                        new Vector2(uv[2], 1 - uv[3]),
                        new Vector2(uv[2], 1 - uv[1]),
                    ];

                    if (face.rotation) {
                        const amount = face.rotation;
                        // check property
                        if (!([0, 90, 180, 270].indexOf(amount) >= 0)) {
                            console.error("The \"rotation\" property for \"" + face + "\" face is invalid (got \"" + amount + "\").");
                        }
                        // rotate map
                        for (let j = 0; j < amount / 90; j++) {
                            map = [map[1], map[2], map[3], map[0]];
                        }

                    }

                    blockGeometry.faceVertexUvs[0][i * 2] = [map[0], map[1], map[3]];
                    blockGeometry.faceVertexUvs[0][i * 2 + 1] = [map[1], map[2], map[3]];
                } else {
                    // transparent material
                    blockGeometry.faces[i * 2].materialIndex = 0;
                    blockGeometry.faces[i * 2 + 1].materialIndex = 0;

                    const map = [
                        new Vector2(0, 0),
                        new Vector2(1, 0),
                        new Vector2(1, 1),
                        new Vector2(0, 1),
                    ];

                    blockGeometry.faceVertexUvs[0][i * 2] = [map[0], map[1], map[3]];
                    blockGeometry.faceVertexUvs[0][i * 2 + 1] = [map[1], map[2], map[3]];
                }
                blockGeometry.uvsNeedUpdate = true;
            }

            /**
             * bake rotation start
             */
            if (element.rotation) {
                // get origin, axis and angle
                const rotationOrigin = {
                    x: element.rotation.origin[0] - 8,
                    y: element.rotation.origin[1] - 8,
                    z: element.rotation.origin[2] - 8,
                };

                const axis = element.rotation.axis;
                const angle = element.rotation.angle;

                // create pivot
                const pivot = new Group();
                pivot.name = "pivot";
                pivot.position.x = rotationOrigin.x;
                pivot.position.y = rotationOrigin.y;
                pivot.position.z = rotationOrigin.z;

                pivot.add(blockMesh);

                // adjust mesh coordinates
                blockMesh.position.x -= rotationOrigin.x;
                blockMesh.position.y -= rotationOrigin.y;
                blockMesh.position.z -= rotationOrigin.z;

                // rotate pivot
                if (axis === "x") {
                    pivot.rotateX(angle * Math.PI / 180);
                } else if (axis === "y") {
                    pivot.rotateY(angle * Math.PI / 180);
                } else if (axis === "z") {
                    pivot.rotateZ(angle * Math.PI / 180);
                }

                group.add(pivot);
            } else {
                const pivot = new Group();
                pivot.name = "pivot";
                pivot.add(blockMesh);
                group.add(pivot);
            }
        }
        obj.add(group);

        return obj;
    }
}
