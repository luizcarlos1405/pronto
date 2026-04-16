<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { page } from '$app/state';
	import { ListChecks, Inbox, Target, Heart } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { runSchedulerNow } from '$lib/scheduler';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/tasks', label: 'Tasks', icon: ListChecks },
		{ href: '/inbox', label: 'Inbox', icon: Inbox },
		{ href: '/objectives', label: 'Goals', icon: Target },
		{ href: '/cares', label: 'Cares', icon: Heart }
	];

	onMount(() => {
		runSchedulerNow();
		const interval = setInterval(() => runSchedulerNow(), 5 * 60 * 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Pronto</title>
</svelte:head>

<div class="flex flex-col h-dvh">
	<main class="flex-1 overflow-y-auto pb-20">
		{@render children()}
	</main>

	<nav class="dock dock-md fixed bottom-0 left-0 right-0 z-50">
		{#each navItems as item}
			<a
				href={item.href}
				class={page.url.pathname === item.href ||
				(item.href !== '/' && page.url.pathname.startsWith(item.href + '/'))
					? 'dock-active'
					: ''}
			>
				<item.icon class="size-5" />
				<span class="dock-label">{item.label}</span>
			</a>
		{/each}
	</nav>
</div>
