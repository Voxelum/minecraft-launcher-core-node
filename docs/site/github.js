let tags;
let loading = loadGithub();
async function loadGithub() {
    const resp = await fetch('https://api.github.com/repos/voxelum/minecraft-launcher-core-node/tags')
    tags = await resp.json();
}

export async function getLatestTagName() {
    await loading;
    return tags[0].name;
}