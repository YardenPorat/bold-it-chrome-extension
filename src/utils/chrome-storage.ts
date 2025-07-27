export class ChromeStorage<T> {
    private storage!: T;
    private defaultStorage!: T;
    public initPromise!: Promise<void>;

    constructor(public key: string, defaultStorage: T) {
        this.key = key;
        this.defaultStorage = defaultStorage;

        this.initPromise = this.readFromStorage<T>().then((storage) => {
            if (!storage) {
                void this.saveToStorage<T>(defaultStorage);
                this.storage = defaultStorage;
            } else {
                this.storage = storage;
            }
        });
    }

    public get(): T {
        return { ...this.defaultStorage, ...this.storage };
    }

    public async set(data: Partial<T>): Promise<void> {
        this.storage = { ...this.storage, ...data };
        await this.saveToStorage<T>(this.storage);
    }

    public async clear(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.remove(this.key, resolve);
        });
    }

    public async getAll(): Promise<Record<string, T>> {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (items) => {
                resolve(items as Record<string, T>);
            });
        });
    }

    private saveToStorage = async <T>(storage: T): Promise<void> => {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ [this.key]: storage }, resolve);
        });
    };

    private readFromStorage = <T>(): Promise<T | undefined> => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(this.key, (response) => {
                resolve(response[this.key]);
            });
        });
    };
}
