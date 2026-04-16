<script lang="ts">
	import { onMount } from 'svelte';
	import { MoreVertical, Palette, Database } from 'lucide-svelte';
	import DataModal from './data-modal.svelte';

	let showThemeModal = $state(false);
	let showDataModal = $state(false);
	let currentTheme = $state('light');

	const darkThemes = new Set([
		'dark',
		'synthwave',
		'halloween',
		'forest',
		'black',
		'luxury',
		'dracula',
		'business',
		'night',
		'coffee',
		'dim',
		'nord',
		'sunset',
		'abyss'
	]);

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
		requestAnimationFrame(updateThemeColor);
	});

	function selectTheme(name: string) {
		document.documentElement.setAttribute('data-theme', name);
		localStorage.setItem('theme', name);
		currentTheme = name;
		requestAnimationFrame(updateThemeColor);
	}

	function updateThemeColor() {
		const el = document.createElement('div');
		el.style.color = 'oklch(var(--p))';
		el.style.display = 'none';
		document.body.appendChild(el);
		const computed = getComputedStyle(el).color;
		document.body.removeChild(el);

		let meta = document.querySelector('meta[name="theme-color"]');
		if (!meta) {
			meta = document.createElement('meta');
			meta.setAttribute('name', 'theme-color');
			document.head.appendChild(meta);
		}
		meta.setAttribute('content', computed);
	}
</script>

<div
	class="navbar absolute top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur border-b border-base-300"
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
				<li>
					<button onclick={() => (showDataModal = true)}>
						<Database class="size-4" /> Your data
					</button>
				</li>
			</ul>
		</div>
	</div>
</div>

{#if showThemeModal}
	<dialog class="modal modal-bottom modal-open">
		<div class="modal-box max-w-lg">
			<h3 class="font-bold text-lg mb-4">Choose theme</h3>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
				{#each themes as theme (theme)}
					<button
						class="btn btn-sm flex capitalize"
						class:btn-primary={currentTheme === theme}
						class:btn-outline={currentTheme !== theme}
						onclick={() => selectTheme(theme)}
					>
						{theme}
						<span class="badge badge-xs ml-auto">
							{darkThemes.has(theme) ? 'dark' : 'light'}
						</span>
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

{#if showDataModal}
	<DataModal onclose={() => (showDataModal = false)} />
{/if}
