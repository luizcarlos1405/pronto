<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import '../app.css';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { ListChecks, Inbox, Target, Heart } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { runSchedulerNow } from '$lib/scheduler';
  import TopBar from '$lib/components/top-bar.svelte';
  import ToastContainer from '$lib/components/toast-container.svelte';
  import type { Snippet } from 'svelte';
  import { pwaInfo } from 'virtual:pwa-info';

  let { children }: { children: Snippet } = $props();

  const navItems = [
    { href: '/tasks', label: 'Tasks', icon: ListChecks },
    { href: '/inbox', label: 'Inbox', icon: Inbox },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/cares', label: 'Cares', icon: Heart }
  ] as const;

  const webManifestHref = pwaInfo?.webManifest.href ?? '';

  onMount(() => {
    runSchedulerNow();
    const interval = setInterval(() => runSchedulerNow(), 5 * 60 * 1000);

    if (pwaInfo) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        registerSW({ immediate: true });
      });
    }

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  {#if webManifestHref}
    <link rel="manifest" href={webManifestHref} />
  {/if}
  <link rel="icon" href={favicon} />
  <title>Faz</title>
</svelte:head>

<div id="layout" class="flex flex-col h-dvh max-w-lg mx-auto relative shadow-lg bg-base-100">
  <TopBar />

  <main class="flex-1 overflow-y-auto pt-14 pb-20">
    {@render children()}
  </main>

  <nav class="dock dock-md absolute bottom-0 left-0 right-0 z-50">
    {#each navItems as item (item.href)}
      <a
        href={resolve(item.href)}
        class={page.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')
          ? 'dock-active'
          : ''}
      >
        <item.icon class="size-5" />
        <span class="dock-label">{item.label}</span>
      </a>
    {/each}
  </nav>

  <ToastContainer />
</div>
