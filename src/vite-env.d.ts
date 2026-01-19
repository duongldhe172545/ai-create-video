/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly SSR: boolean;
    // Thêm các env variables khác nếu có
    [key: string]: any;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
