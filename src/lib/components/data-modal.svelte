<script lang="ts">
	import { Download, Upload, Trash2, AlertTriangle } from 'lucide-svelte';
	import { exportAllData, importData, clearAllData, type FazExport } from '$lib/db/data-manager';

	let { onclose }: { onclose: () => void } = $props();

	let showClearConfirm = $state(false);
	let clearText = $state('');
	let status = $state<{ text: string; ok: boolean } | null>(null);

	const CLEAR_PHRASE = 'delete all data';

	$effect(() => {
		if (status) {
			const timer = setTimeout(() => (status = null), 4000);
			return () => clearTimeout(timer);
		}
	});

	async function handleExport() {
		try {
			const data = await exportAllData();
			const json = JSON.stringify(data, null, 2);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `faz-backup-${data.exportedAt.slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			status = { text: 'Download started', ok: true };
		} catch {
			status = { text: 'Something went wrong exporting', ok: false };
		}
	}

	function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				if (data.app !== 'faz' || !Array.isArray(data.docs)) {
					status = { text: "This isn't a Faz backup file", ok: false };
					return;
				}
				const result = await importData(data);
				if (result.skipped > 0) {
					status = {
						text: `Imported ${result.imported} items, ${result.skipped} already existed`,
						ok: true
					};
				} else {
					status = { text: `Imported ${result.imported} items`, ok: true };
				}
			} catch {
				status = { text: 'Something went wrong importing', ok: false };
			}
		};
		input.click();
	}

	async function handleClear() {
		try {
			await clearAllData();
			location.reload();
		} catch {
			status = { text: 'Something went wrong clearing data', ok: false };
		}
	}
</script>

<dialog class="modal modal-bottom modal-open">
	<div class="modal-box max-w-lg">
		<h3 class="font-bold text-lg mb-4">Your data</h3>

		{#if status}
			<div
				role="alert"
				class="alert mb-4"
				class:alert-success={status.ok}
				class:alert-error={!status.ok}
			>
				<span class="text-sm">{status.text}</span>
			</div>
		{/if}

		{#if showClearConfirm}
			<div class="border border-error/30 rounded-lg p-4 bg-error/5">
				<div class="flex items-center gap-2 text-error font-semibold mb-2">
					<AlertTriangle class="size-5 shrink-0" />
					This can't be undone
				</div>
				<p class="text-sm opacity-70 mb-3">
					All your tasks, goals, cares, and inbox items will be permanently removed. There is no way
					to recover them.
				</p>
				<input
					type="text"
					class="input input-bordered input-error w-full mb-3"
					placeholder="Type 'delete all data' to confirm"
					bind:value={clearText}
					autocomplete="off"
				/>
				<div class="flex gap-2 justify-end">
					<button
						class="btn btn-sm btn-ghost"
						onclick={() => {
							showClearConfirm = false;
							clearText = '';
						}}
					>
						Cancel
					</button>
					<button
						class="btn btn-sm btn-error"
						disabled={clearText !== CLEAR_PHRASE}
						onclick={handleClear}
					>
						Remove everything
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				<div>
					<p class="text-sm opacity-70 mb-2">Download a copy of all your data as a JSON file.</p>
					<button class="btn btn-outline btn-sm" onclick={handleExport}>
						<Download class="size-4" />
						Export all data
					</button>
				</div>

				<div>
					<p class="text-sm opacity-70 mb-2">Load data from a Faz backup file.</p>
					<button class="btn btn-outline btn-sm" onclick={handleImport}>
						<Upload class="size-4" />
						Import data
					</button>
				</div>

				<div class="divider text-xs opacity-40">Danger zone</div>

				<div>
					<button
						class="btn btn-outline btn-error btn-sm"
						onclick={() => (showClearConfirm = true)}
					>
						<Trash2 class="size-4" />
						Clear all data
					</button>
				</div>
			</div>
		{/if}

		<div class="modal-action">
			<button class="btn btn-sm" onclick={onclose}>Done</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={onclose}>close</button>
	</form>
</dialog>
