// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://lukamucko.github.io',
    markdown: {
        shikiConfig: {
            theme: 'css-variables',
        },
    },
});
