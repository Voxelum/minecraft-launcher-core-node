/// <reference types="node" />

declare module "fast-html-parser" {
    interface Node {
        text: string;
        rawText: string;
        structuredText: string;

        firstChild: Node;
        lastChild: Node;
        childNodes: Node[];

        removeWhitespace(): Node;
        trimRight(): Node;

        attributes: { [key: string]: string };
        rawAttributes: string;
        rawAttrs: string;
        tagName: string;
        id: string;
        classNames: string[];

        querySelectorAll(selector: string): Node[];
        querySelector(selector: string): Node;
    }
    interface HTMLElement extends Node {
        querySelectorAll(selector: string): Node[];
        querySelector(selector: string): Node;

        removeWhitespace(): HTMLElement;
        trimRight(): HTMLElement;
    }

    function parse(raw: string, options?: {
        lowerCaseTagName?: false,  // convert tag name to lower case (hurt performance heavily)
        script?: false,            // retrieve content in <script> (hurt performance slightly)
        style?: false,             // retrieve content in <style> (hurt performance slightly)
        pre?: false,
    }): HTMLElement;
}
