import "three-orbitcontrols";
import * as THREE from "three";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { Scene } from "three/src/scenes/Scene";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { Vector3 } from "three/src/math/Vector3";
import { Geometry } from "three/src/core/Geometry";
import { AmbientLight } from "three/src/lights/AmbientLight";
import { LineBasicMaterial } from "three/src/materials/LineBasicMaterial";
import { LineSegments } from "three/src/objects/LineSegments";
import { PlayerModel, BlockModelFactory } from "@xmcl/model";

function updateSize(canvas, renderer, lastDimension) {
    let dim = window.innerWidth;
    if (dim !== lastDimension) {
        if (dim >= 1000) {
            let d = dim / 4.8;
            canvas.width = d;
            canvas.height = d;
            renderer.setSize(d, d);
            lastDimension = dim;
        } else {
            let d = dim / 2;
            canvas.width = d;
            canvas.height = d;
            renderer.setSize(d, d);
            lastDimension = dim;
        }
    }
}

export function setupAll() {
    const { play: playPlayer, stop: stopPlayer } = setupPlayer();
    const { play: playBlock, stop: stopBlock } = setupBlock();
    return {
        play() { playPlayer(); playBlock(); },
        stop() { stopPlayer(); stopBlock(); },
    }
}

export function setupPlayer() {
    // const steve = "data:image/png;base64,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";
    const steve = "data:image/png;base64,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"
    const canvas = document.getElementById("player-canvas");
    const renderer = new WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    const scene = new Scene();
    const player = new PlayerModel();
    const rect = canvas.getBoundingClientRect();

    const camera = new PerspectiveCamera(45, 1, 0.5, 5);

    camera.position.z = 3;
    camera.lookAt(new Vector3(0, 0, 0));

    const o3d = player.playerObject3d;
    o3d.translateY(-0.5);
    player.setSkin(steve, false);
    scene.add(o3d);
    {
        const controls = new THREE.OrbitControls(camera, canvas);
        controls.target = new Vector3(0, 0, 0);
        controls.enablePan = false;
        controls.enableKeys = false;
        // controls.maxDistance = props.maxDistance;
        // controls.minDistance = props.minDistance;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 4;
    }

    let lastDimension = window.innerWidth;
    updateSize(canvas, renderer, 0);
    let playing = false;
    return {
        play() {
            if (playing) return;
            playing = true;
            requestAnimationFrame(function animate(nowMsec) {
                if (!playing) return;
                requestAnimationFrame(animate);
                updateSize(canvas, renderer, lastDimension);
                renderer.render(scene, camera);
            });
        },
        stop() {
            if (!playing) return;
            playing = false;
        },
    };
}

export function setupBlock() {
    const block = {
        "display": {
            "gui": {
                "rotation": [30, 225, 0],
                "translation": [0, 0, 0],
                "scale": [0.625, 0.625, 0.625]
            },
            "ground": {
                "rotation": [0, 0, 0],
                "translation": [0, 3, 0],
                "scale": [0.25, 0.25, 0.25]
            },
            "fixed": {
                "rotation": [0, 0, 0],
                "translation": [0, 0, 0],
                "scale": [0.5, 0.5, 0.5]
            },
            "thirdperson_righthand": {
                "rotation": [75, 45, 0],
                "translation": [0, 2.5, 0],
                "scale": [0.375, 0.375, 0.375]
            },
            "firstperson_righthand": {
                "rotation": [0, 45, 0],
                "translation": [0, 0, 0],
                "scale": [0.40, 0.40, 0.40]
            },
            "firstperson_lefthand": {
                "rotation": [0, 225, 0],
                "translation": [0, 0, 0],
                "scale": [0.40, 0.40, 0.40]
            }
        }
    };
    const grassBlock = {
        ...block,
        "textures": {
            "particle": "block/dirt",
            "bottom": "block/dirt",
            "top": "block/grass_block_top",
            "side": "block/grass_block_side",
            "overlay": "block/grass_block_side_overlay"
        },
        "elements": [
            {
                "from": [0, 0, 0],
                "to": [16, 16, 16],
                "faces": {
                    "down": { "uv": [0, 0, 16, 16], "texture": "#bottom", "cullface": "down" },
                    "up": { "uv": [0, 0, 16, 16], "texture": "#top", "cullface": "up", "tintindex": 0 },
                    "north": { "uv": [0, 0, 16, 16], "texture": "#side", "cullface": "north" },
                    "south": { "uv": [0, 0, 16, 16], "texture": "#side", "cullface": "south" },
                    "west": { "uv": [0, 0, 16, 16], "texture": "#side", "cullface": "west" },
                    "east": { "uv": [0, 0, 16, 16], "texture": "#side", "cullface": "east" }
                }
            },
            {
                "from": [0, 0, 0],
                "to": [16, 16, 16],
                "faces": {
                    "north": { "uv": [0, 0, 16, 16], "texture": "#overlay", "tintindex": 0, "cullface": "north" },
                    "south": { "uv": [0, 0, 16, 16], "texture": "#overlay", "tintindex": 0, "cullface": "south" },
                    "west": { "uv": [0, 0, 16, 16], "texture": "#overlay", "tintindex": 0, "cullface": "west" },
                    "east": { "uv": [0, 0, 16, 16], "texture": "#overlay", "tintindex": 0, "cullface": "east" }
                }
            }
        ]
    }
    const textReg = {
        "block/dirt": { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA0UlEQVR42nWSsQ1CMQxEvQ4rINFR0SOBxAgpaRgA/Q3YhelAF+mi9+/nF1YS2zn7zq7v+/H7tEu31/XYbea7nw6ruM/SRYlM0HtZluEzIO+KycporsI3qzGHeSW01tpwsJukkl0MAAcV0GdyJ6AKpa/cVlZyq9SG9yFicpR4TKDipOmzMjnH525m/g6QTp5uOT8zNt2D5J68SaVyPORsYPtJxVrVjBcraHSkwDH3TUxnguyZu1pRkD1v541wpjHb0MokKkz+WWgDkDtgkfbm7wJ/9oUoq3qXqFkAAAAASUVORK5CYII=" },
        "block/grass_block_top": { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB90lEQVR42j2Tx87qUAyEzyOz+em9915F750NAiQ2IPFgvvpGyl2EJCe2p3hw3W7Xfr+fdTody+fzuhqNhiUSCatWqzabzazf71u5XLZCoWClUsn2+735fD6r1Wrmer2eCheLhQ0GAxuNRpZMJnVPp9MadDwebbfbCQQw6hlWqVTMrddrTYrFYpbNZoVQLBat2WzqguF8PrfD4WDX61WNgUBAIM/n05zf77dcLieKMGi1WkJnYLvdFoNMJiMQviMPZGRQ41arlQqYzv1yudjtdhMLnt/vt/39/QmRpvP5bPF4XN/lAWjD4dCCwaB0plIpmYY34/FYlHmmAQDqeK7X65LnmDaZTGy73UoztClEEvTxhSGPx0OMkAgTT47jh4LpdCptDIlGo7bZbNRMoWce7KhnY952HNOgiqOn00koFNIEs/v9rnNWCjsMZ53kA/YOBD6+Xi+Zwo7xhCaMAxnaNIOIdobCBCAHOtMYhA8Mgw2FIH2/XwuFQtKNNzRi4n8P0AldIkyo+MAZiISKd55hFolEhI5+MoDRjj1TBB0OWCuU0RoOh3XGO3eaSCVMYUWfo5GYkkiQKGII5+R+uVxKCjXIZQNI4J3A6b9AEVo9iqSNkNCI0wSJC0Mx0ls5LBxUSR5T0cz+2YI3ADM/n4+yQTP+kBXqMf8fm1m5bOHB3EYAAAAASUVORK5CYII=" },
        "block/grass_block_side": { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABX0lEQVQ4y3VSSUuDQQydXyN48OhCse4LVg+KFhcUaxXrMqJiFbwoIvKBIBQFexFcEHexrlAQix68+KOeJJCPNG0PmWSyvJdkxqXfYtj46MPaaw9mrxpZlp86MXlaC//Qhq2vIY4v3LUgdR3F/G0zps7r0Z+pwtJjO9z6ey8n7ufHsJMbwO7LIEaj1Zi7aULyooGBjn6mkSkkmISKKZ/AFu9b4Q4+J7jg5M9j5jLCDHRfyXWxpg63C3EcfieR/U2xbzhbg8RZHduODu89X0hWn7tDm4Q6IE3tkt6MR8IY2e7Yx9ggnd8b54D4dLIQSW4IIEnk1GC6UIOJTUKEjg7tDIKgKEHi2tZEzibrTnQ35fwMYJ1aS8u2WMecXYrdshU7itOMdmYBFr8eRXblys2lGejp9Aj6mfkjWacFqSTSVdEIJOmRjpLFyRiyF/1azibpDev5LVEJgP0DsqRK7y8E/2kQKqQTbHIJAAAAAElFTkSuQmCC" },
        "block/grass_block_side_overlay": { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAeElEQVQ4T+2NsQrAIAxE/WtHUdxUUARXZwcXfzDtXRFa6Cd4IPHlLokaY0jOWVprEmOUzajo4fXeyahrLbHW8g9PwXgPIqBugZ1zZATBtVbWnQ8hiOKWWwh672mAsWwv2tfmnOxprZ/rfyqlfAxjDDml9D9wdHREXc8PflIHcVV8AAAAAElFTkSuQmCC" },
    };

    const canvas = document.getElementById("block-canvas");
    const rect = canvas.getBoundingClientRect();

    const camera = new PerspectiveCamera(60, 1, 1, 1000);
    camera.position.x = 16;
    camera.position.x = 16;
    camera.position.x = 32;

    const scene = new Scene();

    const renderer = new WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(rect.width, rect.height);

    scene.add(new AmbientLight(0xffffff, 0.97));

    const factory = new BlockModelFactory(textReg);
    const o = factory.getObject(grassBlock);
    scene.add(o);

    const control = new THREE.OrbitControls(camera, renderer.domElement);
    control.enableDamping = true;
    control.dampingFactor = 0.2
    control.zoomSpeed = 1.4
    control.rotateSpeed = 0.6
    control.enableKeys = false

    {
        const grid = new Geometry();
        const gMat = new LineBasicMaterial({ color: 0xafafaf });
        for (let i = -8; i < 8; ++i) {
            grid.vertices.push(new Vector3(-8, -8, i));
            grid.vertices.push(new Vector3(8, -8, i));
            grid.vertices.push(new Vector3(i, -8, -8));
            grid.vertices.push(new Vector3(i, -8, 8));
        }
        grid.vertices.push(new Vector3(-1, -8, 9));
        grid.vertices.push(new Vector3(1, -8, 9));

        grid.vertices.push(new Vector3(1, -8, 9));
        grid.vertices.push(new Vector3(0, -8, 10));

        grid.vertices.push(new Vector3(0, -8, 10));
        grid.vertices.push(new Vector3(-1, -8, 9));

        const g = new LineSegments(grid, gMat);
        g.visable = true;
        scene.add(g);
    }

    let lastDimension = window.innerWidth;
    updateSize(canvas, renderer, 0);
    let playing = false;
    return {
        play() {
            if (playing) return;
            playing = true;
            requestAnimationFrame(function animate(nowMsec) {
                if (!playing) return;
                requestAnimationFrame(animate);
                updateSize(canvas, renderer, lastDimension);
                renderer.render(scene, camera);
            });
        },
        stop() {
            if (!playing) return;
            playing = false;
        },
    };
}
