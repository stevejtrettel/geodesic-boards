//this is all to run the glsl plugin
import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
export default defineConfig({
    plugins: [glsl()]
});
