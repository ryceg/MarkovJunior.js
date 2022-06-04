import XmlElement from "../script/xmlElement";

class Grid {
    public state: char[];
    public mask: boolean[];
    public MX: number;
    public MY: number;
    public MZ: number;
    public C: byte;
    public characters: byte[];
    public values: Map<char, byte>;
    public waves: Map<char, number>;
    public folder: string;

    transparent: number;
    statebuffer: byte[];

    public Load(script: XmlElement, MX: number, MY: number, MZ: number) {
        this.MX = MX;
        this.MY = MY;
        this.MZ = MZ;
        let valueString: string = script.get<string>("values", null)?.replace(" ", "");
        if (valueString == null) {
            return null;
        }

        this.C = <byte>valueString.length;
        this.values = new Map<char, byte>();
        this.waves = new Map<char, number>();

        this.characters = new Array<byte>(this.C);

        for (let i: uint8 = 0; i < this.C; i++) {
            let symbol = <uint8>valueString[i].charCodeAt(0);
            if (this.values.has(symbol)) {
                return null;
            }
            else {
                this.characters[i] = symbol;
                this.values[symbol] = i;
                this.waves[symbol] = i;
            }
        }

        let transparentString: string = script.get<string>("transparent", null);
        if (transparentString != null) {
            this.transparent = this.Wave(transparentString);
        }
        let xunions: XmlElement[] = new Array<XmlElement>();
        for (const ele of script.MyDescendants(["markov", "sequence", "union"])) {
            if (ele.name == "union") {
                xunions.push(ele);
            }
        }
        this.waves["*"] = (1 << this.C) - 1;
        xunions.forEach(element => {
            let symbol:char = element.get<char>("symbol", null);
            if (this.waves.has(symbol)) {
                return null;
            }
            else {
                const w = this.Wave(element.get<string>("values", null));
                this.waves[symbol] = w;
            }
        });
        this.state = new Array<byte>(this.MX * this.MY * this.MZ);
        this.statebuffer = new Array<byte>(this.MX * this.MY * this.MZ);
        this.mask = new Array<boolean>(this.MX * this.MY * this.MZ);
        this.folder = script.get<string>("folder", null);
    }

    public Clear(origin: number):void
    {
        for (let i = 0; i < this.state.length; i++) { 
            this.state[i] = 0;
        }
        if (origin >= 0) { 
            this.state[origin] = 1;
        }
    }

    public Wave(values: string): number {
        let sum: number = 0;
        for (let index = 0; index < values.length; index++) {
            sum += 1 << this.values[values[index]];
        }
        return sum;
    }

}