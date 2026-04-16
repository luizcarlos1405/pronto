<script lang="ts">
	import { onMount } from 'svelte';
	import { MoreVertical, Palette } from 'lucide-svelte';

	let showThemeModal = $state(false);
	let currentTheme = $state('light');

	const themes = [
		'light',
		'dark',
		'cupcake',
		'bumblebee',
		'emerald',
		'corporate',
		'synthwave',
		'retro',
		'cyberpunk',
		'valentine',
		'halloween',
		'garden',
		'forest',
		'aqua',
		'lofi',
		'pastel',
		'fantasy',
		'wireframe',
		'black',
		'luxury',
		'dracula',
		'cmyk',
		'autumn',
		'business',
		'acid',
		'lemonade',
		'night',
		'coffee',
		'winter',
		'dim',
		'nord',
		'sunset',
		'caramellatte',
		'abyss',
		'silk'
	].sort();

	onMount(() => {
		const saved = localStorage.getItem('theme');
		if (saved) {
			document.documentElement.setAttribute('data-theme', saved);
			currentTheme = saved;
		}
	});

	function selectTheme(name: string) {
		document.documentElement.setAttribute('data-theme', name);
		localStorage.setItem('theme', name);
		currentTheme = name;
	}
</script>

<div
	class="navbar fixed top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur border-b border-base-300"
>
	<div class="navbar-start">
		<span class="text-xl font-bold tracking-tight">Faz</span>
	</div>
	<div class="navbar-end">
		<div class="dropdown dropdown-end">
			<button tabindex="0" class="btn btn-ghost btn-circle btn-sm">
				<MoreVertical class="size-5" />
			</button>
			<ul
				tabindex="0"
				class="dropdown-content menu bg-base-100 rounded-box shadow-lg border border-base-300 z-[1] w-44 p-1"
			>
				<li>
					<button onclick={() => (showThemeModal = true)}>
						<Palette class="size-4" /> Themes
					</button>
				</li>
			</ul>
		</div>
	</div>
</div>

{#if showThemeModal}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-lg">
			<h3 class="font-bold text-lg mb-4">Choose theme</h3>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
				{#each themes as theme (theme)}
					<button
						class="btn btn-sm justify-start capitalize"
						class:btn-primary={currentTheme === theme}
						class:btn-outline={currentTheme !== theme}
						onclick={() => selectTheme(theme)}
					>
						{theme}
					</button>
				{/each}
			</div>
			<div class="modal-action">
				<button class="btn btn-sm" onclick={() => (showThemeModal = false)}>Close</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showThemeModal = false)}>close</button>
		</form>
	</dialog>
{/if}
