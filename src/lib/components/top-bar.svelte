<script lang="ts">
  import { onMount } from 'svelte';
  import MoreVertical from 'lucide-svelte/icons/more-vertical';
  import Palette from 'lucide-svelte/icons/palette';
  import Database from 'lucide-svelte/icons/database';
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
    const layoutEl = document.getElementById('layout');
    const computed = layoutEl ? getComputedStyle(layoutEl).backgroundColor : '';

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
  class="navbar absolute top-0 px-4 left-0 right-0 z-50 bg-base-100 backdrop-blur border-b border-base-300"
>
  <div class="navbar-start gap-2">
    <div
      class="h-6 w-6 bg-primary"
      style="mask-image: url('/logo.svg'); -webkit-mask-image: url('/logo.svg'); mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat; mask-position: center; -webkit-mask-position: center;"
    ></div>
    <span class="text-xl font-bold tracking-tight">Faz</span>
  </div>
  <div class="navbar-end">
    <div class="dropdown dropdown-end">
      <button tabindex="0" class="btn btn-ghost btn-circle btn-sm">
        <MoreVertical class="size-5" />
      </button>
      <ul
        tabindex="0"
        role="menu"
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

<dialog class="modal modal-bottom" class:modal-open={showThemeModal}>
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

<DataModal open={showDataModal} onclose={() => (showDataModal = false)} />
