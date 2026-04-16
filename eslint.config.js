import js from 'eslint-plugin-svelte';

export default [
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	},
	...js.configs['flat/recommended'],
	{
		rules: {
			'no-undef': 'off'
		}
	}
];
