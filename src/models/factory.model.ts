export interface Factory<T> {
    make(json: any): T;
    getCollectionName(): string;
    getUrl(id?: string): string;
}
