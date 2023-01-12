import { BlockModel, PackMeta } from "@xmcl/resourcepack";
import { Material } from "three/src/materials/Material";
import { LinearFilter, NearestFilter } from "three/src/constants";
import { Object3D } from "three/src/core/Object3D";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { DataTexture } from "three/src/textures/DataTexture";
import { Texture } from "three/src/textures/Texture";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { MeshLambertMaterial } from "three/src/materials/MeshLambertMaterial";
import { Mesh } from "three/src/objects/Mesh";
import { Group } from "three/src/objects/Group";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { Vector3 } from "three/src/math/Vector3";
import { Vector2 } from "three/src/math/Vector2";
import { BufferAttribute } from "three/src/core/BufferAttribute";
import { decodeImage } from "image-in-browser";

interface TextureData {
    url: string;
    animation?: PackMeta.Animation;
    read?: Function;
}
type TextureRegistry = Record<string, TextureData>;

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
        if (!next) {
            return undefined;
        }
        texturePath = next;
    }
    return texturePath;
}

function loadTexture(textureData: TextureData, textureLoader: TextureLoader) {
    let texture:Texture | undefined;

    let resolveFn, rejectFn;
    const progressFn = function() {};

    const promise = new Promise(function(resolve, reject) {
        resolveFn = resolve;
        rejectFn = reject;
    })

    if (textureData.url != undefined && textureData.url.length > 0) {
        texture = textureLoader.load(textureData.url, resolveFn, progressFn, rejectFn);
    }
    else if(textureData.read instanceof Function) {
        texture = new DataTexture();

        let fileReadPromise = textureData.read();
        Promise.resolve(fileReadPromise)
            .then(
                function(fileContents) {
                    const decodedContents = decodeImage(fileContents);
                    if(decodedContents == undefined) {
                        throw "Error decoding the image";
                    }
                    const width = decodedContents?.width;
                    const height = decodedContents?.height;

                    if(width == undefined || height == undefined) {
                        throw "Error finding width or height";
                    }

                    const imageDataArray = decodedContents.getBytes();

                    const imageDataArrayClamped = new Uint8ClampedArray(imageDataArray);

                    const imageData = new ImageData(imageDataArrayClamped, width, height);

                    if(texture != undefined) {
                        texture.image = imageData;
                        texture.needsUpdate = true;
                    }

                    return texture;
                }
            )
            .then(resolveFn)
            .catch(rejectFn)
    }

    if(texture == undefined) {
        texture = new Texture();
    }

    // Overwrite to true as Texture defaults to true and DataTexture to false
    texture.flipY = true;
    texture.userData.hasLoaded = promise;

    return texture;
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

            // for (let j = 0; j < geo.vertices.length; j++) {
            //     // convert vertex coordinates to world coordinates
            //     const vertex = geo.vertices[j].clone();
            //     const abs = mesh.localToWorld(vertex);

            //     // update bounding box

            //     if (abs.x < box.minx) { box.minx = abs.x; }
            //     if (abs.y < box.miny) { box.miny = abs.y; }
            //     if (abs.z < box.minz) { box.minz = abs.z; }

            //     if (abs.x > box.maxx) { box.maxx = abs.x; }
            //     if (abs.y > box.maxy) { box.maxy = abs.y; }
            //     if (abs.z > box.maxz) { box.maxz = abs.z; }
            // }
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
    getObject(model: BlockModel.Resolved, options:{ uvlock?: boolean; y?: number; x?: number }={}, fix:number=0.001) {
        const x_rotation = options.x || 0;
        const y_rotation = options.y || 0;
        const uvlock = options.uvlock || false;

        const option = this.option;
        const textureRegistry = this.textureRegistry;

        const clipUVs = option.clipUVs || false;
        const modelOnly = option.modelOnly || false;

        const obj = new BlockModelObject();
        const group = new Group();
        group.name = "wrapper";

        const materials: Material[] = [BlockModelFactory.TRANSPARENT_MATERIAL];
        const materialIndexes: { [variant: string]: number } = {};

        const materialPathIndexes: { [texPath: string]: number } = {};
        for (const variant of Object.keys(model.textures)) {
            const texPath = findRealTexturePath(model, variant);
            let materialIndex = 0;

            if (!texPath) {
                console.error(`Cannot find texture @${texPath}`);
            } else {
                let materialPathIndex = materialPathIndexes[texPath];
                if (materialPathIndex) {
                    // noop
                } else if (texPath in this.cachedMaterial) {
                    materialPathIndex = materials.length;
                    materials.push(this.cachedMaterial[texPath]);
                } else if (texPath in textureRegistry) {
                    // build new material
                    const tex = textureRegistry[texPath];
                    const texture = loadTexture(tex, this.loader);

                    // sharp pixels and smooth edges
                    texture.magFilter = NearestFilter;
                    texture.minFilter = LinearFilter;

                    // map texture to material, keep transparency and fix transparent z-fighting
                    const mat = new MeshLambertMaterial({ map: texture, transparent: true, alphaTest: 0.5 });

                    materialPathIndex = materials.length;
                    this.cachedMaterial[texPath] = mat;

                    materials.push(mat);
                }
                materialPathIndexes[texPath] = materialPathIndex;
                materialIndex = materialPathIndex;
            }

            materialIndexes[variant] = materialIndex;
        }

        for (const element of model.elements) {
            // get dimensions and origin
            const width = element.to[0] - element.from[0];
            const height = element.to[1] - element.from[1];
            const length = element.to[2] - element.from[2];

            const origin = {
                x: (element.to[0] + element.from[0]) / 2 - 8,
                y: (element.to[1] + element.from[1]) / 2 - 8,
                z: (element.to[2] + element.from[2]) / 2 - 8,
            };

            const blockGeometry = new BoxGeometry(width + fix, height + fix, length + fix);
            const blockMesh = new Mesh(blockGeometry, materials);
            blockMesh.name = "block-element";
            blockGeometry.clearGroups()

            blockMesh.position.x = origin.x;
            blockMesh.position.y = origin.y;
            blockMesh.position.z = origin.z;

            const uvAttr: Vector2[] = []

            const faces = ["east", "west", "up", "down", "south", "north"] as const;

            const getDefaultUv = (i: number) => [
                [
                    // east
                    element.from[2],
                    element.from[1],
                    element.to[2],
                    element.to[1],
                ],
                [
                    // west
                    element.from[2],
                    element.from[1],
                    element.to[2],
                    element.to[1],
                ],
                [
                    // up
                    element.from[0],
                    element.from[2],
                    element.to[0],
                    element.to[2],
                ],
                [
                    // down
                    element.from[0],
                    element.from[2],
                    element.to[0],
                    element.to[2],
                ],
                [
                    // south
                    element.from[0],
                    element.from[1],
                    element.to[0],
                    element.to[1],
                ],
                [
                    // north
                    element.from[0],
                    element.from[1],
                    element.to[0],
                    element.to[1],
                ]
            ][i]

            for (let i = 0; i < 6; i++) {
                const faceName = faces[i];
                const face = element.faces[faceName];
                let materialIndex = 0
                let uv: number[]
                if (face) {
                    // get material index
                    materialIndex = materialIndexes[face.texture.substring(1, face.texture.length)];  // references.indexOf(ref[0] == '#' ? ref.substring(1) : ref)

                    uv = face.uv || getDefaultUv(i);

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
                } else {
                    uv = [0, 0, 1, 1]
                    // transparent material
                }
                const [x1, y1, x2, y2] = uv
                let map = [
                    new Vector2(x1, y2),
                    new Vector2(x2, y2),
                    new Vector2(x1, y1),
                    new Vector2(x2, y1),
                ];

                if (face && face.rotation) {
                    let amount = Number(face.rotation);
                    // check property
                    if (!([0, 90, 180, 270].indexOf(amount) >= 0)) {
                        console.error("The \"rotation\" property for \"" + face + "\" face is invalid (got \"" + amount + "\").");
                    }

                    amount = (360 - amount) % 360;

                    // rotate map
                    for (let j = 0; j < amount / 90; j++) {
                        map = [map[1], map[3], map[0], map[2]];
                    }
                }

                if (uvlock) {
                    let rotation = 0;
                    if (faceName == "up") {
                        rotation = y_rotation;
                    }
                    else if(faceName == "down") {
                        rotation = (360 - y_rotation) % 360;
                    } else {
                        rotation = x_rotation;
                    }


                    for (let j = 0; j < rotation / 90; j++) {
                        for(let m=0;m<map.length;m++) {
                            const vector = map[m];
                            const x = vector.x;
                            const y = vector.y;

                            vector.x = 1 - y;
                            vector.y = x;
                        }
                    }
                }

                uvAttr.push(...map)
                blockGeometry.addGroup(i * 6, 6, materialIndex)
                // blockGeometry.uvsNeedUpdate = true;
            }
            blockGeometry.setAttribute("uv", new BufferAttribute(
                new Float32Array(uvAttr.length * 2), 2).copyVector2sArray(uvAttr))

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

                const rescale = element.rotation.rescale || false;
                if(rescale) {
                    if(angle % 90 == 45) {
                        if (axis === "x") {
                            pivot.scale.y *= Math.sqrt(2)
                            pivot.scale.z *= Math.sqrt(2)
                        }
                        if (axis === "y") {
                            pivot.scale.x *= Math.sqrt(2)
                            pivot.scale.z *= Math.sqrt(2)
                        }
                        if (axis === "z") {
                            pivot.scale.x *= Math.sqrt(2)
                            pivot.scale.y *= Math.sqrt(2)
                        }
                    }
                }

                group.add(pivot);
            } else {
                const pivot = new Group();
                pivot.name = "pivot";
                pivot.add(blockMesh);
                group.add(pivot);
            }
        }

        obj.rotateY(-y_rotation * Math.PI / 180);
        obj.rotateX(-x_rotation * Math.PI / 180);

        obj.add(group);

        return obj;
    }
}
