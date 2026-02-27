/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    '@delivery-app/ui',
    '@delivery-app/app',
    'nativewind',
    'react-native-css-interop',
    'expo-av',
    'expo-modules-core',
    'expo-router',
    'expo-linking',
    'expo-constants',
    'solito',
    '@react-navigation/native',
    '@react-navigation/core',
    '@react-navigation/elements',
    '@react-navigation/bottom-tabs',
    '@react-navigation/native-stack',
    'expo-asset',
    'expo-font',
    'expo',
  ],
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: process.env.NODE_ENV !== 'production',
      })
    );
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/(expo-router|@react-navigation)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['babel-preset-expo'],
        },
      },
    });
    config.module.rules.push({
      test: /\.wav$/,
      type: 'asset/resource',
    });
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    return config;
  },
};

export default nextConfig;
