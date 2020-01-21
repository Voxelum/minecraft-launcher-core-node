# Text-component Module

[![npm version](https://img.shields.io/npm/v/@xmcl/text-component.svg)](https://www.npmjs.com/package/@xmcl/text-component)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### TextComponent

Create TextComponent from string OR Minecraft's formatted string, like `'§cThis is red'`:

```ts
    import { TextComponent, fromFormattedString } from "@xmcl/text-component";
    const formattedString: string;
    const fromFormatted: TextComponent = fromFormattedString(formattedString);
```

Render the TextComponent to css:

```ts
    import { TextComponent, render, RenderNode } from "@xmcl/text-component";
    const yourComponent: TextComponent;
    const node: RenderNode = render(yourComponent);

    node.text; // the text of the node
    node.style; // style of the node
    node.children; // children

    // you can render in dom like this:

    function renderToDom(node: RenderNode) {
        const span = document.createElement('span');
        span.style = node.style;
        span.textContent = node.text;
        for (const child of node.children) {
            span.appendChild(renderToDom(child));
        }
    } 
```

Iterate the TextComponent and its children:

```ts
    import { TextComponent, flat } from "@xmcl/text-component";
    const yourComponent: TextComponent;
    const selfAndAllChildren: Array<TextComponent> = flat(yourComponent);
```
