export declare class TypeaheadMatch<ItemType = any> {
    readonly value: string;
    readonly item: ItemType;
    protected header: boolean;
    constructor(item: ItemType, value?: string, header?: boolean);
    isHeader(): boolean;
    toString(): string;
}
