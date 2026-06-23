/** @type {import('next').NextConfig} */
const nextConfig = {
    // compiler: {
    //     removeConsole: process.env.NODE_ENV === 'production',
    // },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: true, // Use false (307) for temporary or true (308) for permanent
            },
        ]
    },
    experimental: {
        serverActions: {
            allowedOrigins: []
        }
    }
}

export default nextConfig
