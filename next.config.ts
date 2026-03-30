/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Wyłączamy sprawdzanie typów przy budowaniu, aby oszczędzić pamięć
    ignoreBuildErrors: true,
  },
  eslint: {
    // Wyłączamy lintowanie przy budowaniu, aby zapobiec błędom konfiguracji i OOM
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
