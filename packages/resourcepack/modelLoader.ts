import { Resource, ResourceLocation } from "./resourcePack";
import { ResourceLoader } from "./resourceManager";
import { BlockModel } from "./format";

/**
 * The model loader load the resource
 */
export class ModelLoader {
    static findRealTexturePath(model: BlockModel.Resolved, variantKey: string) {
        let texturePath = model.textures[variantKey] as string;
        while (texturePath.startsWith("#")) {
            const next = model.textures[texturePath.substring(1, texturePath.length)];
            if (!next) { return undefined; }
            texturePath = next;
        }
        return texturePath;
    }

    /**
     * All required texture raw resources
     */
    readonly textures: Record<string, Resource> = {};
    /**
     * All the resolved model
     */
    readonly models: Record<string, BlockModel.Resolved> = {};

    /**
     * @param loader The resource loader
     */
    constructor(readonly loader: ResourceLoader) { }

    /**
     * Load a model by search its parent. It will throw an error if the model is not found.
     */
    async loadModel(modelPath: string): Promise<BlockModel.Resolved> {
        const res = await this.loader.get(ResourceLocation.ofBlockModelPath(modelPath));
        if (!res) { throw new Error(`Model ${modelPath} (${ResourceLocation.ofBlockModelPath(modelPath)}) not found`); }
        const raw = JSON.parse(await res.read("utf-8")) as BlockModel;

        if (!raw.textures) { raw.textures = {}; }

        if (raw.parent) {
            const parentModel = await this.loadModel(raw.parent);
            if (!parentModel) { throw new Error(`Missing parent model ${raw.parent} for ${res.location}`); }
            if (!raw.elements) { raw.elements = parentModel.elements; }
            if (!raw.ambientocclusion) { raw.ambientocclusion = parentModel.ambientocclusion; }
            if (!raw.display) { raw.display = parentModel.display; }
            if (!raw.overrides) { raw.overrides = parentModel.overrides; }

            if (parentModel.textures) { Object.assign(raw.textures, parentModel.textures); }
        }

        raw.ambientocclusion = raw.ambientocclusion || false;
        raw.overrides = raw.overrides || [];

        delete raw.parent;

        const model: BlockModel.Resolved = raw as any;
        this.models[modelPath] = model;

        const reg = this.textures;
        for (const variant of Object.keys(model.textures)) {
            const texPath = ModelLoader.findRealTexturePath(model, variant);
            if (texPath) {
                const load = await this.loader.get(ResourceLocation.ofTexturePath(texPath));
                if (load) {
                    reg[texPath] = load;
                }
            }
        }
        return model;
    }
}
