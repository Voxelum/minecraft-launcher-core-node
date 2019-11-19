import "three-orbitcontrols";
import * as THREE from "three";
import { PlayerModel, BlockModelFactory } from "@xmcl/model";

function setupPlayer() {
    const steve = "data:image/png;base64,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";
    const canvas = document.getElementById("player-canvas");
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const player = new PlayerModel();
    const rect = canvas.getBoundingClientRect();

    const camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.5, 5);

    camera.position.z = 3;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const o3d = player.playerObject3d;
    o3d.translateY(-0.5);
    player.setSkin(steve, false);
    scene.add(o3d);
    {
        const controls = new THREE.OrbitControls(camera, canvas);
        controls.target = new THREE.Vector3(0, 0, 0);
        controls.enablePan = false;
        controls.enableKeys = false;
        // controls.maxDistance = props.maxDistance;
        // controls.minDistance = props.minDistance;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 4;
    }

    requestAnimationFrame(function animate(nowMsec) {
        // if (data.disposed) return;
        requestAnimationFrame(animate);
        // const result = controls.update();
        renderer.render(scene, camera);
    });
}

function setupBlock() {
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

    const camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 1, 1000);
    camera.position.x = 16;
    camera.position.x = 16;
    camera.position.x = 32;

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(rect.width, rect.height);

    scene.add(new THREE.AmbientLight(0xffffff, 0.97));

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
        const grid = new THREE.Geometry();
        const gMat = new THREE.LineBasicMaterial({ color: 0xafafaf });
        for (let i = -8; i < 8; ++i) {
            grid.vertices.push(new THREE.Vector3(-8, -8, i));
            grid.vertices.push(new THREE.Vector3(8, -8, i));
            grid.vertices.push(new THREE.Vector3(i, -8, -8));
            grid.vertices.push(new THREE.Vector3(i, -8, 8));
        }
        grid.vertices.push(new THREE.Vector3(-1, -8, 9));
        grid.vertices.push(new THREE.Vector3(1, -8, 9));

        grid.vertices.push(new THREE.Vector3(1, -8, 9));
        grid.vertices.push(new THREE.Vector3(0, -8, 10));

        grid.vertices.push(new THREE.Vector3(0, -8, 10));
        grid.vertices.push(new THREE.Vector3(-1, -8, 9));

        const g = new THREE.LineSegments(grid, gMat);
        g.visable = true;
        scene.add(g);
    }

    requestAnimationFrame(function animate(nowMsec) {
        // if (data.disposed) return;
        requestAnimationFrame(animate);
        // o.rotateY(0.01);
        // const result = controls.update();
        renderer.render(scene, camera);
        // control.update();
    });
}

setupPlayer();
setupBlock();