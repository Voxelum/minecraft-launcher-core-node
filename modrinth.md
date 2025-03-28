# Modrinth API

[![npm version](https://img.shields.io/npm/v/@xmcl/modrinth.svg)](https://www.npmjs.com/package/@xmcl/modrinth)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/modrinth.svg)](https://npmjs.com/@xmcl/modrinth)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/modrinth)](https://packagephobia.now.sh/result?p=@xmcl/modrinth)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

Provide the modrinth described in https://docs.modrinth.com/api-spec

## Usage

This package is depending on undici for HTTP in nodejs, and the browser version will use browser `fetch` instead of undici.

### Search Project in Modrinth

You can use keyword to search

```ts
import { ModrinthV2Client, SearchResult } from '@xmcl/modrinth'
const client = new ModrinthV2Client()
const searchOptions: SearchOptions = {
    query: "shader", // searching shader
};
const result: SearchResult = await client.searchProjects(settingString);
const totalProjectCounts = result.total_hits;
for (const project of result.hits) {
    console.log(`${project.project_id} ${project.title} ${project.description}`); // print project info
}
```

### Get Project in Modrinth

You can get project detail info via project id, including the download url

```ts
import { ModrinthV2Client, ProjectVersionFile, ProjectVersion } from '@xmcl/modrinth'

const client = new ModrinthV2Client()
const projectId: string; // you can get this id from searchProjects
const project: project = await client.getProject(projectId) // project details
const versions: string[] = project.versions;
const oneVersion: string = versions[0];

const modVersion: ModVersion = await getProjectVersion(oneVersion);

const files: ProjectVersionFile[] = modVersion.files;

const { url, name, hashes } = files[0]; // now you can get file name, file hashes and download url of the file
```

## 🧾 Classes

<div class="definition-grid class"><a href="modrinth/ModerinthApiError">ModerinthApiError</a><a href="modrinth/ModrinthV2Client">ModrinthV2Client</a></div>

## 🤝 Interfaces

<div class="definition-grid interface"><a href="modrinth/Category">Category</a><a href="modrinth/DonationLink">DonationLink</a><a href="modrinth/GameVersion">GameVersion</a><a href="modrinth/GetProjectVersionsOptions">GetProjectVersionsOptions</a><a href="modrinth/License">License</a><a href="modrinth/Loader">Loader</a><a href="modrinth/ModrinthClientOptions">ModrinthClientOptions</a><a href="modrinth/ModVersionFile">ModVersionFile</a><a href="modrinth/Project">Project</a><a href="modrinth/ProjectGallery">ProjectGallery</a><a href="modrinth/ProjectVersion">ProjectVersion</a><a href="modrinth/SearchProjectOptions">SearchProjectOptions</a><a href="modrinth/SearchResult">SearchResult</a><a href="modrinth/SearchResultHit">SearchResultHit</a><a href="modrinth/TeamMember">TeamMember</a><a href="modrinth/User">User</a></div>

