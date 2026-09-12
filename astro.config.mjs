import clerk from '@clerk/astro';
import { defineConfig, passthroughImageService } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: 'compile',
  }),
  image: {
    service: passthroughImageService(),
  },
  integrations: [
    clerk({
      signInUrl: '/sign-in',
      signUpUrl: '/sign-up',
    }),
    tailwind(),
  ],
});