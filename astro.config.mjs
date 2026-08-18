// @ts-check
import { defineConfig } from 'astro/config';

// Custom domain: https://shitegolf.co.uk/
// If you move back to https://<user>.github.io/shitegolf/, restore base: '/shitegolf'.
export default defineConfig({
  site: 'https://shitegolf.co.uk',
  base: '/',
});
