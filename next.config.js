/** @type {import('next').NextConfig} */
const nextConfig = {
  // मनीष भाई, यहाँ से 'output: export' हटा दिया है ताकि Chat काम करे
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;