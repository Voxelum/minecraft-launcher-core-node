const registry: { [key: string]: TextFormatting } = {}

export class TextFormatting {
    static readonly RESET: TextFormatting = new TextFormatting("RESET", 'r', null);

    static readonly BLACK: TextFormatting = new TextFormatting('BLACK', '0', 0);
    static readonly DARK_BLUE: TextFormatting = new TextFormatting("DARK_BLUE", '1', 1);
    static readonly DARK_GREEN: TextFormatting = new TextFormatting("DARK_GREEN", '2', 2);
    static readonly DARK_AQUA: TextFormatting = new TextFormatting("DARK_AQUA", '3', 3);
    static readonly DARK_RED: TextFormatting = new TextFormatting("DARK_RED", '4', 4);
    static readonly DARK_PURPLE: TextFormatting = new TextFormatting("DARK_PURPLE", '5', 5);
    static readonly GOLD: TextFormatting = new TextFormatting("GOLD", '6', 6);
    static readonly GRAY: TextFormatting = new TextFormatting("GRAY", '7', 7);
    static readonly DARK_GRAY: TextFormatting = new TextFormatting("DARK_GRAY", '8', 8);
    static readonly BLUE: TextFormatting = new TextFormatting("BLUE", '9', 9);
    static readonly GREEN: TextFormatting = new TextFormatting("GREEN", 'a', 10);
    static readonly AQUA: TextFormatting = new TextFormatting("AQUA", 'b', 11);
    static readonly RED: TextFormatting = new TextFormatting("RED", 'c', 12);
    static readonly LIGHT_PURPLE: TextFormatting = new TextFormatting("LIGHT_PURPLE", 'd', 13);
    static readonly YELLOW: TextFormatting = new TextFormatting("YELLOW", 'e', 14);
    static readonly WHITE: TextFormatting = new TextFormatting("WHITE", 'f', 15);

    static readonly OBFUSCATED: TextFormatting = new TextFormatting("OBFUSCATED", 'k');
    static readonly BOLD: TextFormatting = new TextFormatting("BOLD", 'l');
    static readonly STRIKETHROUGH: TextFormatting = new TextFormatting("STRIKETHROUGH", 'm');
    static readonly UNDERLINE: TextFormatting = new TextFormatting("UNDERLINE", 'n');
    static readonly ITALIC: TextFormatting = new TextFormatting("ITALIC", 'o');

    private static FORMATTING_CODE_PATTERN = /\b§[0-9A-FK-OR]/;

    readonly fancyStyling: boolean;
    readonly controlString: string;
    readonly colorIndex?: number;

    // private static registry: Map<string, TextFormatting> = new Map<string, TextFormatting>();

    private constructor(readonly formatName: string, readonly formattingCode: string, param: number | null | undefined = undefined) {
        if (param) {
            this.fancyStyling = true;
        }
        else if (param == null) {
            this.fancyStyling = true;
        }
        else if (typeof param === 'number') {
            this.colorIndex = param;
            this.fancyStyling = false;
        }
        else throw new Error();
        this.controlString = "§" + this.formattingCode;
        registry[formatName.toLowerCase().replace(/[^a-z]/, "")] = this;
    }

    toString() { return this.controlString; }
    getFriendlyName() { return this.formatName.toLocaleLowerCase(); }

    static getTextWithoutFormattingCode(text: string): string | null { return text == null ? null : text.replace(TextFormatting.FORMATTING_CODE_PATTERN, ""); }
    static getValueByChar(formattingCode: string): TextFormatting {
        for (let key in registry) {
            let textFormatting = registry[key];
            if (textFormatting.formattingCode == formattingCode)
                return textFormatting;
        }
        return TextFormatting.BLACK;
    }
    static getValueByName(friendlyName: string | null): TextFormatting | null {
        return friendlyName == null ? null : registry[friendlyName.toLocaleLowerCase().replace(/[^a-z]/, "")];
    }
}


export class Style {
    static create(construct: {
        parent?: Style,
        color?: TextFormatting,
        bold?: boolean,
        italic?: boolean,
        underline?: boolean,
        strikethrough?: boolean,
        obfuscated?: boolean,
        clickEvent?: Style.Event<string>,
        hoverEvent?: Style.Event<TextComponent>,
        insertion?: string
    }): Style {
        return new Style(construct.parent, construct.color, construct.bold, construct.italic, construct.underline, construct.strikethrough, construct.obfuscated,
            construct.clickEvent, construct.hoverEvent, construct.insertion)
    }
    static readonly ROOT = new Style(null, undefined, false, false, false, false, false, undefined, undefined, undefined);

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
    get parent(): Style { return this._parent == null ? Style.ROOT : this._parent; }
    get color(): TextFormatting | undefined { return this._color ? this.parent.color : this._color; }
    get bold(): boolean | undefined { return this._bold ? this.parent.bold : this._bold; }
    get italic(): boolean | undefined { return this._italic ? this.parent.italic : this._italic; }
    get underlined(): boolean | undefined { return this._underlined ? this.parent.underlined : this._underlined; }
    get strikethrough(): boolean | undefined { return this._strikethrough ? this.parent.strikethrough : this._strikethrough; }
    get obfuscated(): boolean | undefined { return this._obfuscated ? this.parent.obfuscated : this._obfuscated; }
    get clickEvent(): Style.Event<string> | undefined { return this._clickEvent ? this.parent.clickEvent : this._clickEvent; }
    get hoverEvent(): Style.Event<TextComponent> | undefined { return this._hoverEvent ? this.parent.hoverEvent : this._hoverEvent; }
    get insertion(): string | undefined { return this._insertion ? this.parent.insertion : this._insertion; }
    get code(): string {
        if (this.isEmpty())
            return this.parent != null ? this.parent.code : "";
        else {
            let code = ''
            if (this.color != null)
                code += this.color;
            if (this.bold)
                code += (TextFormatting.BOLD);
            if (this.italic)
                code += (TextFormatting.ITALIC);
            if (this.underlined)
                code += (TextFormatting.UNDERLINE);
            if (this.obfuscated)
                code += (TextFormatting.OBFUSCATED);
            if (this.strikethrough)
                code += (TextFormatting.STRIKETHROUGH);
            return code;
        }
    }

    public isEmpty(): boolean {
        return this.bold == null && this.italic == null && this.strikethrough == null &&
            this.underlined == null && this.obfuscated == null && this.color == null &&
            this.clickEvent == null && this.hoverEvent == null && this.insertion == null;
    }
}
export namespace Style {
    export interface Action {
        readonly canonicalName: string;
        readonly allowInChat: boolean;
    }

    export const SHOW_TEXT: Action = { canonicalName: 'show-text', allowInChat: true };
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


	/**
	 * Adds a new component to the end of the sibling list, setting that component's style's parent style to this
	 * component's style.
	 *
	 * @return This component, for chaining (and not the newly added component)
	 */
    append(component: string | TextComponent): TextComponent;
}
export namespace TextComponent {
    export function str(s?: string): TextComponent {
        return new TextComponentString(s);
    }

    export function fromFormattedString(formatted: string): TextComponent {
        let string: TextComponentString = new TextComponentString()
        let builder: string = ''
        let colorIdx: number = 0
        let boldStyle = false, strikethroughStyle = false, underlineStyle = false, italicStyle = false
        for (let i = 0; i < formatted.length; i++) {
            let c = formatted.charCodeAt(i);
            if (c == 167 && i + 1 < formatted.length)// 167 is §
            {
                if (builder.length != 0) {
                    string.append(new TextComponentString(builder.toString(), Style.create(
                        {
                            bold: boldStyle,
                            strikethrough: strikethroughStyle,
                            underline: underlineStyle,
                            italic: italicStyle,
                            color: TextFormatting.getValueByChar(String.fromCharCode(colorIdx))
                        }
                    )))
                    builder = ''
                }
                let idx = "0123456789abcdefklmnor".indexOf(formatted.charAt(i + 1).toLowerCase());
                if (idx < 16)//is Color
                {
                    if (idx < 0)
                        idx = 15;
                    colorIdx = idx;
                }
                else if (idx == 17) boldStyle = true;
                else if (idx == 18) strikethroughStyle = true;
                else if (idx == 19) underlineStyle = true;
                else if (idx == 20) italicStyle = true;
                else if (idx == 21)//reset
                {
                    boldStyle = false;
                    strikethroughStyle = false;
                    underlineStyle = false;
                    italicStyle = false;
                }

                ++i;//ignore the next char
            }
            else builder += c;
        }
        if (builder.length != 0) {
            string.append(new TextComponentString(builder.toString(),
                Style.create({
                    bold: boldStyle,
                    strikethrough: strikethroughStyle,
                    underline: underlineStyle,
                    italic: italicStyle,
                    color: TextFormatting.getValueByChar(String.fromCharCode(colorIdx))
                })))
        }
        return string;
    }
}
class TextComponentString implements TextComponent {
    protected _siblings: TextComponent[] = new Array();
    private _style: Style;

    constructor(public readonly text: string = '', style?: Style) {
        if (style)
            this._style = style;
    }

    get unformatted(): string { return this.text; }

    get style() {
        if (this._style)
            return this._style
        this._style = new Style()
        for (let component of this.siblings) component.style.parent = this._style;
        return this._style;
    }

    get iterable() {
        let arr: TextComponent[] = [this]
        arr.concat(this._siblings);
        return arr;
    }

    get formatted(): string {
        let v = '';
        for (let component of this.iterable) {
            let s = component.unformatted;
            if (s.length != 0) {
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
        if (typeof component === 'string')
            comp = new TextComponentString(component);
        else comp = component;
        comp.style.parent = this.style;
        this.siblings.push(comp);
        return this;
    }
}
