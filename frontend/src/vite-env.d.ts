/// <reference types="vite/client" />

// Declare our custom env variable so `import.meta.env.VITE_API_BASE_URL`
// is typed as `string` instead of being loosely typed
interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}