import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: { root: path.resolve(__dirname, '../..') },
    images: {
        dangerouslyAllowLocalIP: true,
        remotePatterns: [
            { hostname: 'localhost' },
            { hostname: '127.0.0.1' },
            { hostname: 'demo.vendure.io' },
            { hostname: 'readonlydemo.vendure.io' },
        ],
    },
};

export default nextConfig;
