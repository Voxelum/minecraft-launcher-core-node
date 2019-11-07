// tslint:disable:variable-name
const registry: { [key: string]: TextFormatting } = {};

/**
 * @see https://minecraft.gamepedia.com/Commands#Raw_JSON_text
 */
export interface TextComponentFrame {
    text: string;
    translate?: string;
    with?: string[];
    score?: {
        name: string,
        objective: string,
        value: string,
    };
    selector?: string;
    keybind?: string;
    extra?: TextComponentFrame[];
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    insertion?: string;
    clickEvent?: {
        action: "open_file" | "open_url" | "run_command" | "suggest_command",
        value: string,
    };
    hoverEvent?: {
        action: "show_text" | "show_item" | "show_entity",
        value: string,
    };
}

export class TextFormatting {
    static readonly RESET: TextFormatting = new TextFormatting("RESET", "r");

    static readonly BLACK: TextFormatting = new TextFormatting("BLACK", "0", 0);
    static readonly DARK_BLUE: TextFormatting = new TextFormatting("DARK_BLUE", "1", 1);
    static readonly DARK_GREEN: TextFormatting = new TextFormatting("DARK_GREEN", "2", 2);
    static readonly DARK_AQUA: TextFormatting = new TextFormatting("DARK_AQUA", "3", 3);
    static readonly DARK_RED: TextFormatting = new TextFormatting("DARK_RED", "4", 4);
    static readonly DARK_PURPLE: TextFormatting = new TextFormatting("DARK_PURPLE", "5", 5);
    static readonly GOLD: TextFormatting = new TextFormatting("GOLD", "6", 6);
    static readonly GRAY: TextFormatting = new TextFormatting("GRAY", "7", 7);
    static readonly DARK_GRAY: TextFormatting = new TextFormatting("DARK_GRAY", "8", 8);
    static readonly BLUE: TextFormatting = new TextFormatting("BLUE", "9", 9);
    static readonly GREEN: TextFormatting = new TextFormatting("GREEN", "a", 10);
    static readonly AQUA: TextFormatting = new TextFormatting("AQUA", "b", 11);
    static readonly RED: TextFormatting = new TextFormatting("RED", "c", 12);
    static readonly LIGHT_PURPLE: TextFormatting = new TextFormatting("LIGHT_PURPLE", "d", 13);
    static readonly YELLOW: TextFormatting = new TextFormatting("YELLOW", "e", 14);
    static readonly WHITE: TextFormatting = new TextFormatting("WHITE", "f", 15);

    static readonly OBFUSCATED: TextFormatting = new TextFormatting("OBFUSCATED", "k");
    static readonly BOLD: TextFormatting = new TextFormatting("BOLD", "l");
    static readonly STRIKETHROUGH: TextFormatting = new TextFormatting("STRIKETHROUGH", "m");
    static readonly UNDERLINE: TextFormatting = new TextFormatting("UNDERLINE", "n");
    static readonly ITALIC: TextFormatting = new TextFormatting("ITALIC", "o");

    static getTextWithoutFormattingCode(text: string): string { return text.replace(TextFormatting.FORMATTING_CODE_PATTERN, ""); }
    static getValueByChar(formattingCode: string): TextFormatting {
        for (const key in registry) {
            const textFormatting = registry[key];
            if (textFormatting.formattingCode === formattingCode) {
                return textFormatting;
            }
        }
        return TextFormatting.BLACK;
    }
    static getValueByName(friendlyName: string): TextFormatting | undefined {
        return registry[friendlyName.toLocaleLowerCase().replace(/[^a-z]/, "")];
    }

    private static FORMATTING_CODE_PATTERN = /\b§[0-9A-FK-OR]/;

    readonly fancyStyling: boolean;
    readonly controlString: string;
    readonly colorIndex?: number;

    // private static registry: Map<string, TextFormatting> = new Map<string, TextFormatting>();

    private constructor(readonly formatName: string, readonly formattingCode: string, param?: number) {
        if (!param) {
            this.fancyStyling = true;
        } else {
            this.colorIndex = param;
            this.fancyStyling = false;
        }
        this.controlString = "§" + this.formattingCode;
        registry[formatName.toLowerCase().replace(/[^a-z]/, "")] = this;
    }

    toString() { return this.controlString; }
    getFriendlyName() { return this.formatName.toLocaleLowerCase(); }
}


export class Style {
    static create(construct: {
        parent?: Style,
        color?: TextFormatting | string,
        bold?: boolean,
        italic?: boolean,
        underline?: boolean,
        strikethrough?: boolean,
        obfuscated?: boolean,
        clickEvent?: Style.Event<string>,
        hoverEvent?: Style.Event<TextComponent>,
        insertion?: string,
    }): Style {
        return new Style(construct.parent,
            typeof construct.color === "string" ? TextFormatting.getValueByName(construct.color) : construct.color,
            construct.bold, construct.italic, construct.underline, construct.strikethrough, construct.obfuscated,
            construct.clickEvent, construct.hoverEvent, construct.insertion);
    }

    constructor(public _parent: Style | null = Style.ROOT,
        private _color?: TextFormatting,
        private _bold?: boolean,
        private _italic?: boolean,
        private _underlined?: boolean,
        private _strikethrough?: boolean,
        private _obfuscated?: boolean,
        private _clickEvent?: Style.Event<string>,
        private _hoverEvent?: Style.Event<TextComponent>,
        private _insertion?: string) {
    }

    set parent(style: Style) { this._parent = style; }
    get parent(): Style {
        return this._parent == null ? Style.ROOT : this._parent;
    }
    get color(): TextFormatting | undefined { return this._color ? this._color : this.parent.color; }
    get bold(): boolean { return this._bold ? this._bold : this.parent.bold; }
    get italic(): boolean { return this._italic ? this._italic : this.parent.italic; }
    get underlined(): boolean { return this._underlined ? this._underlined : this.parent.underlined; }
    get strikethrough(): boolean { return this._strikethrough ? this._strikethrough : this.parent.strikethrough; }
    get obfuscated(): boolean { return this._obfuscated ? this._obfuscated : this.parent.obfuscated; }
    get clickEvent(): Style.Event<string> | undefined { return this._clickEvent ? this._clickEvent : this.parent.clickEvent; }
    get hoverEvent(): Style.Event<TextComponent> | undefined { return this._hoverEvent ? this._hoverEvent : this.parent.hoverEvent; }
    get insertion(): string | undefined { return this._insertion ? this._insertion : this.parent.insertion; }
    get code(): string {
        if (this.isEmpty()) {
            return this.parent != null ? this.parent.code : "";
        } else {
            let code = "";
            if (this.color) {
                code += this.color;
            }
            if (this.bold) {
                code += (TextFormatting.BOLD);
            }
            if (this.italic) {
                code += (TextFormatting.ITALIC);
            }
            if (this.underlined) {
                code += (TextFormatting.UNDERLINE);
            }
            if (this.obfuscated) {
                code += (TextFormatting.OBFUSCATED);
            }
            if (this.strikethrough) {
                code += (TextFormatting.STRIKETHROUGH);
            }
            return code;
        }
    }

    public isEmpty(): boolean {
        return this.bold == null && this.italic == null && this.strikethrough == null &&
            this.underlined == null && this.obfuscated == null && this.color == null &&
            this.clickEvent == null && this.hoverEvent == null && this.insertion == null;
    }
}

class RootStyle extends Style {
    constructor() { super(); }
    set parent(style: Style) { this._parent = style; }
    get parent(): Style { return this; }
    get color(): TextFormatting | undefined { return TextFormatting.BLACK; }
    get bold(): boolean { return false; }
    get italic(): boolean { return false; }
    get underlined(): boolean { return false; }
    get strikethrough(): boolean { return false; }
    get obfuscated(): boolean { return false; }
    get clickEvent(): Style.Event<string> | undefined { return undefined; }
    get hoverEvent(): Style.Event<TextComponent> | undefined { return undefined; }
    get insertion(): string | undefined { return undefined; }
}
export namespace Style {
    export const ROOT: Style = new RootStyle();
    export interface Action {
        readonly canonicalName: string;
        readonly allowInChat: boolean;
    }

    export const SHOW_TEXT: Action = { canonicalName: "show-text", allowInChat: true };
    export const SHOW_ACHIEVEMENT: Action = { canonicalName: "show_achievement", allowInChat: true };
    export const SHOW_ITEM: Action = { canonicalName: "show_item", allowInChat: true };
    export const SHOW_ENTITY: Action = { canonicalName: "show_entity", allowInChat: true };
    export const OPEN_URL: Action = { canonicalName: "open_url", allowInChat: true };
    export const OPEN_FILE: Action = { canonicalName: "open_file", allowInChat: false };
    export const RUN_COMMAND: Action = { canonicalName: "run_command", allowInChat: true };
    export const SUGGEST_COMMAND: Action = { canonicalName: "suggest_command", allowInChat: true };
    export const CHANGE_PAGE: Action = { canonicalName: "change_page", allowInChat: true };

    export interface Event<T> {
        action: Action;
        value: T;
    }
}

export interface TextComponent {
    readonly text: string;
    readonly siblings: TextComponent[];
}
export interface TextComponent {

    /**
     * Gets the style of this component. Returns a direct reference; changes to this style will modify the style of this
     * component (IE, there is no need to call {@link #style(Style)} again after modifying it).
     * <p>
     * If this component's style is currently <code>null</code>, it will be initialized to the default style, and the
     * parent style of all sibling components will be set to that style. (IE, changes to this style will also be
     * reflected in sibling components.)
     * <p>
     * This method never returns <code>null</code>.
     */
    style: Style;
    readonly unformatted: string;
    readonly formatted: string;
    readonly siblings: TextComponent[];
    readonly iterator: TextComponent[];

    /**
     * Adds a new component to the end of the sibling list, setting that component's style's parent style to this
     * component's style.
     *
     * @return This component, for chaining (and not the newly added component)
     */
    append(component: string | TextComponent): TextComponent;
}

const colorCode = new Array<number>(32);
for (let i = 0; i < 32; i += 1) {
    const j = ((i >> 3) & 1) * 85; // eslint-disable-line no-bitwise
    let k = (((i >> 2) & 1) * 170) + j; // eslint-disable-line no-bitwise
    let l = (((i >> 1) & 1) * 170) + j; // eslint-disable-line no-bitwise
    let i1 = ((i & 1) * 170) + j; // eslint-disable-line no-bitwise
    if (i === 6) { k += 85; }
    if (i >= 16) {
        k /= 4;
        l /= 4;
        i1 /= 4;
    }
    colorCode[i] = ((k & 255) << 16) | ((l & 255) << 8) | (i1 & 255); // eslint-disable-line no-bitwise
}


export namespace TextComponent {
    /**
     * Provide a standard rendering for text component to html/css element
     * @param src The text component
     */
    export function render(src: TextComponent): Array<{ style: string; text: string }> {
        function itr(comp: any) {
            const comps = [comp];
            if (comp._siblings.length !== 0) {
                for (const s of comp._siblings) {
                    comps.push(...itr(s));
                }
            }
            return comps;
        }

        const elems: Array<{ style: string; text: string }> = [];

        let iterator = src.iterator;
        if ("iterator" in src) {
            iterator = src.iterator;
        } else if ((src as any)._siblings) {
            iterator = itr(src);
        }
        if (iterator) {
            for (const component of iterator) {
                let style = "";
                if (component.style.bold) { style += "font-weight:bold;"; }
                if (component.style.underlined) { style += "text-decoration:underline;"; }
                if (component.style.italic) { style += "font-style:italic;"; }
                if (component.style.strikethrough) { style += "text-decoration:line-through;"; }
                if (component.style.color) {
                    const code = colorCode[component.style.color.colorIndex || -1];
                    if (code !== undefined) {
                        const r = (code >> 16); // eslint-disable-line no-bitwise
                        const g = ((code >> 8) & 255); // eslint-disable-line no-bitwise
                        const b = (code & 255); // eslint-disable-line no-bitwise
                        style += `color: rgb(${r}, ${g}, ${b});`;
                    }
                }
                elems.push({ style, text: component.unformatted });
            }
        }

        return elems;
    }

    export function str(s?: string): TextComponent {
        return new TextComponentString(s);
    }

    /**
     * Convert json format (server motd) or string to TextComponent Object
     */
    export function from(obj: string | TextComponentFrame): TextComponent {
        if (typeof obj === "string") {
            return fromFormattedString(obj);
        }
        let component: TextComponent | undefined;
        if (obj.text) { component = TextComponent.str(obj.text); }
        if (!component) { component = TextComponent.str(""); }
        // component.style = Style.create(obj);
        if (obj.extra instanceof Array) {
            for (const element of obj.extra) {
                component.append(from(element));
            }
        }
        return component;
    }

    function fromFormattedString(formatted: string): TextComponent {
        const firstCode = formatted.indexOf("§");
        if (firstCode === -1) { return new TextComponentString(formatted); }

        let builder: string = "";
        let colorIdx: number = 0;
        let boldStyle = false, strikethroughStyle = false, underlineStyle = false, italicStyle = false;

        const s: TextComponentString = new TextComponentString();
        for (let i = 0; i < formatted.length; i++) {
            const c = formatted.charCodeAt(i);
            if (c === 167 && i + 1 < formatted.length) {
                if (builder.length !== 0) {
                    s.append(new TextComponentString(builder.toString(), Style.create(
                        {
                            bold: boldStyle,
                            strikethrough: strikethroughStyle,
                            underline: underlineStyle,
                            italic: italicStyle,
                            color: TextFormatting.getValueByChar(colorIdx.toString()),
                        },
                    )));
                    builder = "";
                }
                let idx = "0123456789abcdefklmnor".indexOf(formatted.charAt(i + 1).toLowerCase());
                if (idx < 16) {
                    if (idx < 0) {
                        idx = 15;
                    }
                    colorIdx = idx;
                } else if (idx === 17) { boldStyle = true; } else if (idx === 18) { strikethroughStyle = true; } else if (idx === 19) { underlineStyle = true; } else if (idx === 20) { italicStyle = true; } else if (idx === 21) {
                    boldStyle = false;
                    strikethroughStyle = false;
                    underlineStyle = false;
                    italicStyle = false;
                }

                ++i; // ignore the next char
            } else { builder += String.fromCharCode(c); }
        }
        if (builder.length !== 0) {
            s.append(new TextComponentString(builder.toString(),
                Style.create({
                    bold: boldStyle,
                    strikethrough: strikethroughStyle,
                    underline: underlineStyle,
                    italic: italicStyle,
                    color: TextFormatting.getValueByChar(colorIdx.toString()),
                })));
        }
        return s;
    }
}
class TextComponentString implements TextComponent {
    protected _siblings: TextComponent[] = new Array();
    private _style?: Style;

    constructor(public readonly text: string = "", style?: Style, siblings?: TextComponent[]) {
        if (style) {
            this._style = style;
        }
        if (siblings) {
            this._siblings = siblings;
        }
    }

    toString(): string { return this.formatted; }

    get unformatted(): string {
        return this.text;
    }
    set style(style: Style) {
        this._style = style;
    }
    get style() {
        if (this._style) {
            return this._style;
        }
        this._style = new Style();
        for (const component of this.siblings) { component.style.parent = this._style; }
        return this._style;
    }

    get iterator() {
        let arr: TextComponent[] = [this];
        if (this.siblings.length !== 0) {
            for (const s of this.siblings) {
                arr = arr.concat(s.iterator);
            }
        }
        return arr;
    }

    get formatted(): string {
        let v = "";
        for (const component of this.iterator) {
            const s = component.unformatted;
            if (s.length !== 0) {
                v += component.style.code;
                v += s;
                v += TextFormatting.RESET;
            }
        }
        return v;
    }

    get siblings(): TextComponent[] { return this._siblings; }

    append(component: TextComponent | string): TextComponent {
        let comp: TextComponent;
        if (typeof component === "string") {
            comp = new TextComponentString(component);
        } else { comp = component; }
        comp.style.parent = this.style;
        this.siblings.push(comp);
        return this;
    }
}
