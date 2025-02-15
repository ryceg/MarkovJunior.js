import { XMLParser } from "fast-xml-parser";
import * as fs from 'fs';
import { IScriptElement } from '.';

const options = {
    ignoreAttributes: false,
    attributeNamePrefix: "@@"
};
const parser = new XMLParser(options);

export default class XmlElement implements IScriptElement {
    private jsObj: object;
    private identityPath: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(jsObj?: any, path?: string) {
        if (jsObj) {
            this.jsObj = jsObj;
            this.identityPath = path;
        }
    }

    public get name(): string {
        return Object.keys(this.jsObj)[0];
    }

    Get<T>(fieldName: string, defaultValue: T): T {
        const prefixFieldName = "@@" + fieldName;
        if (this.jsObj[this.name][prefixFieldName]) {
            return this.jsObj[this.name][prefixFieldName];
        } else {
            return defaultValue;
        }
    }

    public static LoadFromFile(xmlFileName: string): XmlElement {

        const jsObj = parser.parse(fs.readFileSync(xmlFileName, "utf8"));
        const identityPath = "0";
        return new XmlElement(jsObj, identityPath);
    }

    public static LoadFromString(xmlString: string): XmlElement {

        const jsObj = parser.parse(xmlString);
        const identityPath = "0";
        return new XmlElement(jsObj, identityPath);
    }

    Equals(ele: XmlElement) {
        return ele.identityPath === this.identityPath;
    }

    Elements(filterTags?: string[]): XmlElement[] {
        const elementArray = new Array<XmlElement>();
        let i = 0;
        const children = this.jsObj[this.name];
        for (const key in children) {
            if (!key.startsWith("@@")) {
                if (Array.isArray(children[key])) {
                    for (let j = 0; j < children[key].length; j++) {
                        elementArray.push(new XmlElement({
                           [key]: children[key][j]
                        }, this.identityPath + "/" + i.toString()));
                        i++;
                    }
                } else {
                    i++;
                    elementArray.push(new XmlElement({
                        [key]: children[key]
                    }, this.identityPath + "/" + i.toString()));
                }
            }
        }
        if (filterTags) {
            return elementArray.filter(element => filterTags.indexOf(element.name) >= 0);
        }
        return elementArray;
    }

    // this imp would be updated later
    *MyDescendants(tags: string[]): Generator<XmlElement, void, void> {
        const q = new Array<XmlElement>();
        q.push(this);
        while (q.length > 0) {
            const e: XmlElement = q.pop();
            if (!this.Equals(e)) {
                yield e;
            }
            const eles = e.Elements();
            eles.forEach(element => {
                if (tags.indexOf(element.name) >= 0) {
                    q.push(element);
                }
            });
        }
    }
}