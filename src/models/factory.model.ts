export interface Factory<T> {
    make(json: any): T;
    CollectionName: string;
    getUrl(id?: string): string;
}
