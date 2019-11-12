import { TextComponent, TextComponentFrame, TextComponentString } from "./index";

describe("TextComponent", () => {
    describe("#from", () => {
        test("should convert normal string", () => {
            const raw = "testCommon tesxt";
            const comp = TextComponent.from(raw);
            expect(comp.text).toEqual(raw);
            expect(comp.style.bold).toBeFalsy();
            expect(comp.style.obfuscated).toBeFalsy();
            expect(comp.style.strikethrough).toBeFalsy();
            expect(comp.style.italic).toBeFalsy();
            expect(comp.style.underlined).toBeFalsy();
            expect(comp.style.color).toBeFalsy();
        });
        test("should convert colored string", () => {
            const raw = "§1colored§r";
            const comp = TextComponent.from(raw).siblings[0];
            expect(comp.text).toEqual("colored");
            expect(comp.style.color).toEqual("dark_blue");
            expect(comp.style.bold).toBeFalsy();
            expect(comp.style.obfuscated).toBeFalsy();
            expect(comp.style.strikethrough).toBeFalsy();
            expect(comp.style.italic).toBeFalsy();
            expect(comp.style.underlined).toBeFalsy();
        });
        test("should convert styled string", () => {
            const raw = "§ostyled";
            const comp = TextComponent.from(raw).siblings[0];
            expect(comp.text).toEqual("styled");
            expect(comp.style.color).toBeFalsy();
            expect(comp.style.bold).toBeFalsy();
            expect(comp.style.obfuscated).toBeFalsy();
            expect(comp.style.strikethrough).toBeFalsy();
            expect(comp.style.italic).toBeTruthy();
            expect(comp.style.underlined).toBeFalsy();
        });
        test("should convert from text component frame", () => {
            const raw: TextComponentFrame = {
                text: "hello",
            };
            const comp = TextComponent.from(raw);
            expect(comp.text).toEqual("hello");
            expect(comp.style.color).toBeFalsy();
            expect(comp.style.bold).toBeFalsy();
            expect(comp.style.obfuscated).toBeFalsy();
            expect(comp.style.strikethrough).toBeFalsy();
            expect(comp.style.italic).toBeFalsy();
            expect(comp.style.underlined).toBeFalsy();
        });
        test("should convert from styled text component frame", () => {
            const raw: TextComponentFrame = {
                text: "hello",
                color: "red",
                bold: true,
                obfuscated: true,
                strikethrough: true,
                italic: true,
                underlined: true
            };
            const comp = TextComponent.from(raw);
            expect(comp.text).toEqual("hello");
            expect(comp.style.color).toEqual("red");
            expect(comp.style.bold).toBeTruthy();
            expect(comp.style.obfuscated).toBeTruthy();
            expect(comp.style.strikethrough).toBeTruthy();
            expect(comp.style.italic).toBeTruthy();
            expect(comp.style.underlined).toBeTruthy();
        });
        test("should convert from styled text component frame", () => {
            const raw: TextComponentFrame = {
                text: "hello",
                color: "red",
                bold: true,
                obfuscated: true,
                strikethrough: true,
                italic: true,
                underlined: true,
                extra: [
                    {
                        text: "world",
                        color: "blue",
                        bold: true,
                        obfuscated: true,
                        strikethrough: true,
                        italic: true,
                        underlined: true,
                    },
                    {} as any,
                ]
            };
            const comp = TextComponent.from(raw);
            expect(comp.text).toEqual("hello");
            expect(comp.style.color).toEqual("red");
            expect(comp.style.bold).toBeTruthy();
            expect(comp.style.obfuscated).toBeTruthy();
            expect(comp.style.strikethrough).toBeTruthy();
            expect(comp.style.italic).toBeTruthy();
            expect(comp.style.underlined).toBeTruthy();

            expect(comp.siblings).toHaveLength(2);
            const child = comp.siblings[0];
            expect(child.text).toEqual("world");
            expect(child.style.color).toEqual("blue");
            expect(child.style.bold).toBeTruthy();
            expect(child.style.obfuscated).toBeTruthy();
            expect(child.style.strikethrough).toBeTruthy();
            expect(child.style.italic).toBeTruthy();
            expect(child.style.underlined).toBeTruthy();

            const empty = comp.siblings[1];
            expect(empty.text).toEqual("");
            expect(empty.style.color).toBeFalsy();
            expect(empty.style.bold).toBeFalsy();
            expect(empty.style.obfuscated).toBeFalsy();
            expect(empty.style.strikethrough).toBeFalsy();
            expect(empty.style.italic).toBeFalsy();
            expect(empty.style.underlined).toBeFalsy();
        });
    });
    test("#getSuggestedCss", () => {
        const style = {
            bold: true,
            underlined: true,
            strikethrough: true,
            italic: true,
            color: "red",
            obfuscated: true,
        };
        const css = TextComponent.getSuggestedCss(style);
        expect(css).toEqual("color: #FF5555; font-weight: bold; text-decoration:line-through; text-decoration: underline; font-style: italic;");
    });
    describe("#render", () => {
        test("should render string correctly", () => {
            const node = TextComponent.render({
                text: "hello",
                siblings: [
                    {
                        text: "world",
                        siblings: [],
                        style: {},
                    }
                ],
                style: {
                    bold: true,
                    underlined: true,
                    strikethrough: true,
                    italic: true,
                    color: "red",
                    obfuscated: true,
                },
            });
            expect(node.text).toEqual("hello");
            expect(node.style).toEqual("color: #FF5555; font-weight: bold; text-decoration:line-through; text-decoration: underline; font-style: italic;");
            expect(node.children).toHaveLength(1);
            expect(node.children[0].text).toEqual("world");
            expect(node.children[0].style).toEqual("");
        });
    });
    describe("#toFormattedString", () => {
        const comp = {
            text: "hello",
            siblings: [
                {
                    text: "world",
                    siblings: [],
                    style: {},
                }
            ],
            style: {
                bold: true,
                underlined: true,
                strikethrough: true,
                italic: true,
                color: "red",
                obfuscated: true,
            },
        };
        const str = TextComponent.toFormattedString(comp);
        expect(str).toEqual("§c§k§l§m§n§ohello§rworld§r");
    });
    describe("#str", () => {

    })
});

describe("TextComponentString", () => {
    describe("#toString", () => {
        test("should equal to original one", () => {
            const raw = "§1colored§r";
            const str = TextComponentString.of(raw);
            expect(str.toString()).toEqual(raw);
        });
    });
});

