/** @type {import('next').NextConfig} */
export default {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/landing.html' },
        { source: '/portal', destination: '/portal-app.html' },
      ],
    };
  },
};
