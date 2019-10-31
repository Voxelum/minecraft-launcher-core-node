import { Geometry, Mesh, MeshBasicMaterial, Object3D } from "three";
import * as THREE from "three";
import format, { CubeUVMapping, ModelTemplate } from "./player-model";

function convertLegacySkin(context: CanvasRenderingContext2D, width: number) {
    const scale = width / 64.0;

    function copySkin(ctx: CanvasRenderingContext2D, sX: number, sY: number, w: number, h: number, dX: number, dY: number, flipHorizontal: boolean) {
        sX *= scale;
        sY *= scale;
        w *= scale;
        h *= scale;
        dX *= scale;
        dY *= scale;

        const imgData = ctx.getImageData(sX, sY, w, h);
        if (flipHorizontal) {
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < (w / 2); x++) {
                    const index = (x + y * w) * 4;
                    const index2 = ((w - x - 1) + y * w) * 4;
                    const pA1 = imgData.data[index];
                    const pA2 = imgData.data[index + 1];
                    const pA3 = imgData.data[index + 2];
                    const pA4 = imgData.data[index + 3];

                    const pB1 = imgData.data[index2];
                    const pB2 = imgData.data[index2 + 1];
                    const pB3 = imgData.data[index2 + 2];
                    const pB4 = imgData.data[index2 + 3];

                    imgData.data[index] = pB1;
                    imgData.data[index + 1] = pB2;
                    imgData.data[index + 2] = pB3;
                    imgData.data[index + 3] = pB4;

                    imgData.data[index2] = pA1;
                    imgData.data[index2 + 1] = pA2;
                    imgData.data[index2 + 2] = pA3;
                    imgData.data[index2 + 3] = pA4;
                }
            }
        }
        ctx.putImageData(imgData, dX, dY);
    }

    copySkin(context, 4, 16, 4, 4, 20, 48, true); // Top Leg
    copySkin(context, 8, 16, 4, 4, 24, 48, true); // Bottom Leg
    copySkin(context, 0, 20, 4, 12, 24, 52, true); // Outer Leg
    copySkin(context, 4, 20, 4, 12, 20, 52, true); // Front Leg
    copySkin(context, 8, 20, 4, 12, 16, 52, true); // Inner Leg
    copySkin(context, 12, 20, 4, 12, 28, 52, true); // Back Leg
    copySkin(context, 44, 16, 4, 4, 36, 48, true); // Top Arm
    copySkin(context, 48, 16, 4, 4, 40, 48, true); // Bottom Arm
    copySkin(context, 40, 20, 4, 12, 40, 52, true); // Outer Arm
    copySkin(context, 44, 20, 4, 12, 36, 52, true); // Front Arm
    copySkin(context, 48, 20, 4, 12, 32, 52, true); // Inner Arm
    copySkin(context, 52, 20, 4, 12, 44, 52, true); // Back Arm
}

type TextureSource = string | HTMLImageElement;

function mapUV(mesh: THREE.Mesh, faceIdx: number, x1: number, y1: number, x2: number, y2: number) {
    const geometry = mesh.geometry as Geometry;
    const material = mesh.material as MeshBasicMaterial;
    const texture = material.map!;
    const tileUvW = 1 / texture.image.width;
    const tileUvH = 1 / texture.image.height;
    let uvs = geometry.faceVertexUvs[0][faceIdx * 2];
    x1 *= tileUvW;
    x2 *= tileUvW;
    y1 = 1 - (y1 * tileUvH);
    y2 = 1 - (y2 * tileUvH);
    uvs[0].x = x1; uvs[0].y = y1;
    uvs[1].x = x1; uvs[1].y = y2;
    uvs[2].x = x2; uvs[2].y = y1;
    uvs = geometry.faceVertexUvs[0][faceIdx * 2 + 1];
    uvs[0].x = x1; uvs[0].y = y2;
    uvs[1].x = x2; uvs[1].y = y2;
    uvs[2].x = x2; uvs[2].y = y1;
}

function mapCubeUV(mesh: Mesh, src: CubeUVMapping) {
    const order = ["left", "right", "top", "bottom", "front", "back"] as const;
    for (let i = 0; i < order.length; i++) {
        const pos = src[order[i]];
        mapUV(mesh, i, pos[0], pos[1], pos[2], pos[3]);
    }
}

export class PlayerObject3D extends Object3D {
    private _slim: boolean = false;

    constructor(skin: THREE.MeshBasicMaterial, cape: THREE.MeshBasicMaterial, tranparent: THREE.MeshBasicMaterial, slim: boolean) {
        super();
        this._slim = slim;
        buildPlayerModel(this, skin, cape, tranparent, slim);
    }

    get slim() {
        return this._slim;
    }

    set slim(s: boolean) {
        if (s !== this._slim) {
            const template = s ? format.alex : format.steve;
            const leftArm = this.getObjectByName("leftArm") as Mesh;
            const rightArm = this.getObjectByName("rightArm") as Mesh;

            leftArm.geometry = new THREE.CubeGeometry(template.leftArm.w, template.leftArm.h, template.leftArm.d);
            mapCubeUV(leftArm, template.leftArm);
            rightArm.geometry = new THREE.CubeGeometry(template.rightArm.w, template.rightArm.h, template.rightArm.d);
            mapCubeUV(rightArm, template.rightArm);

            const leftArmLayer = this.getObjectByName("leftArmLayer") as Mesh;
            const rightArmLayer = this.getObjectByName("rightArmLayer") as Mesh;
            if (leftArmLayer) {
                leftArmLayer.geometry = new THREE.CubeGeometry(template.leftArm.layer.w, template.leftArm.layer.h, template.leftArm.layer.d);
                mapCubeUV(leftArmLayer, template.leftArm.layer);
            }
            if (rightArmLayer) {
                rightArmLayer.geometry = new THREE.CubeGeometry(template.rightArm.layer.w, template.rightArm.layer.h, template.rightArm.layer.d);
                mapCubeUV(rightArmLayer, template.rightArm.layer);
            }
        }
        this._slim = s;
    }
}

function buildPlayerModel(root: THREE.Object3D, skin: THREE.MeshBasicMaterial, cape: THREE.MeshBasicMaterial, tranparent: THREE.MeshBasicMaterial, slim: boolean): Object3D {
    const template = slim ? format.alex : format.steve;
    const partsNames: Array<keyof ModelTemplate> = Object.keys(template) as any;

    for (const partName of partsNames) {
        const model = template[partName];

        const mesh = new THREE.Mesh(new THREE.CubeGeometry(model.w, model.h, model.d),
            partName === "cape" ? cape : skin);

        mesh.name = partName;
        if (model.y) { mesh.position.y = model.y; }
        if (model.x) { mesh.position.x = model.x; }
        if (model.z) { mesh.position.z = model.z; }
        if (partName === "cape") {
            mesh.rotation.x = 25 * (Math.PI / 180);
        }
        mapCubeUV(mesh, model);

        const box = new THREE.BoxHelper(mesh, new THREE.Color(0xffffff));
        box.name = `${partName}Box`;
        box.visible = false;
        mesh.add(box);

        if ("layer" in model) {
            const layer = model.layer;
            const layerMesh = new THREE.Mesh(new THREE.CubeGeometry(layer.w, layer.h, layer.d), tranparent);
            layerMesh.name = `${partName}Layer`;
            if (layer.y) { layerMesh.position.y = layer.y; }
            if (layer.x) { layerMesh.position.x = layer.x; }
            if (layer.z) { layerMesh.position.z = layer.z; }

            mapCubeUV(layerMesh, layer);

            mesh.add(layerMesh);
        }

        root.add(mesh);
    }

    return root;
}

function ensureImage(textureSource: TextureSource) {
    if (textureSource instanceof Image) {
        return textureSource;
    }
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => { resolve(img); };
        try {
            const url = new URL(textureSource);
            switch (url.protocol) {
                case "data:":
                case "https:":
                case "http:":
                    img.src = textureSource;
                    break;
                default:
                    reject(new Error(`Unsupported protocol ${url.protocol}!`));
            }
        } catch (e) {
            img.src = `data:image/png;base64, ${textureSource}`;
        }
    });
}

export class PlayerModel {
    static create() { return new PlayerModel(); }

    readonly playerObject3d: PlayerObject3D;
    readonly materialPlayer: THREE.MeshBasicMaterial;
    readonly materialTransparent: THREE.MeshBasicMaterial;
    readonly materialCape: THREE.MeshBasicMaterial;
    readonly textureCape: THREE.CanvasTexture;
    readonly texturePlayer: THREE.CanvasTexture;

    constructor() {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        this.texturePlayer = texture;
        texture.name = "skinTexture";

        this.materialPlayer = new THREE.MeshBasicMaterial({ map: texture });

        this.materialTransparent = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        const textureCape = new THREE.CanvasTexture(document.createElement("canvas"));
        textureCape.magFilter = THREE.NearestFilter;
        textureCape.minFilter = THREE.NearestFilter;
        textureCape.name = "capeTexture";
        this.textureCape = textureCape;

        const materialCape = new THREE.MeshBasicMaterial({
            map: this.textureCape,
        });
        materialCape.name = "capeMaterial";
        materialCape.visible = false;
        this.materialCape = materialCape;

        this.playerObject3d = new PlayerObject3D(this.materialPlayer, this.materialCape, this.materialTransparent, false);
    }

    async setSkin(skin: TextureSource, isSlim: boolean = false) {
        this.playerObject3d.slim = isSlim;
        const texture = this.texturePlayer;
        const i = await ensureImage(skin);
        const legacy = i.width !== i.height;
        const canvas = texture.image;
        const context = canvas.getContext("2d");
        canvas.width = i.width;
        canvas.height = i.width;
        context.clearRect(0, 0, i.width, i.width);
        if (legacy) {
            context.drawImage(i, 0, 0, i.width, i.width / 2.0);
            convertLegacySkin(context, i.width);
        } else {
            context.drawImage(i, 0, 0, i.width, i.width);
        }
        texture.needsUpdate = true;
    }

    async setCape(cape: TextureSource | undefined) {
        if (cape === undefined) {
            this.materialCape.visible = false;
            return;
        }
        this.materialCape.visible = true;
        const img = await ensureImage(cape);
        const texture = this.textureCape;
        texture.image = img;
        texture.needsUpdate = true;
    }

    // name(name) {
    //     if (name === undefined || name === "" || name === null) {
    //         if (this.nameTagObject === null) { return this; }
    //         this.root.remove(this.nameTagObject);
    //         this.nameTagObject = null;
    //     }
    //     if (this.nameTagObject) { this.clear(); }
    //     // build the texture
    //     const canvas = buildNameTag(name);
    //     const texture = new THREE.Texture(canvas);
    //     texture.needsUpdate = true;
    //     // build the sprite itself
    //     const material = new THREE.SpriteMaterial({
    //         map: texture,
    //         // useScreenCoordinates: false
    //     });
    //     const sprite = new THREE.Sprite(material);
    //     this.nameTagObject = sprite;
    //     sprite.position.y = 1.15;
    //     // add sprite to the character
    //     this.root.add(this.nameTagObject);
    //     return this;
    // }

    // load(option) {
    //     if (!option) { return this; }
    //     if (option.skin) { this.loadSkin(option.skin); }
    //     if (option.cape) { this.loadCape(option.skin); }
    //     return this;
    // }

    // say(text, expire = 4) {
    //     expire *= 1000;
    //     if (this.speakExpire) {
    //         clearTimeout(this.speakExpire);
    //         this.root.remove(this.speakBox);
    //         this.speakBox = null;
    //         this.speakExpire = null;
    //     }
    //     this.speakExpire = setTimeout(() => {
    //         this.root.remove(this.speakBox);
    //         this.speakBox = null;
    //         this.speakExpire = null;
    //     }, expire);

    //     // build the texture
    //     const canvas = buildChatBox(text);
    //     const texture = new THREE.Texture(canvas);
    //     texture.needsUpdate = true;
    //     // build the sprite itself
    //     const material = new THREE.SpriteMaterial({
    //         map: texture,
    //         // useScreenCoordinates: false
    //     });
    //     const sprite = new THREE.Sprite(material);
    //     this.speakBox = sprite;
    //     sprite.scale.multiplyScalar(4);
    //     sprite.position.y = 1.5;
    //     // add sprite to the character
    //     this.root.add(this.speakBox);
    //     return this;
    // }
}

export default PlayerModel;

