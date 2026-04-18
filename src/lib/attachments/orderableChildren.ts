import type { Attachment } from 'svelte/attachments';

const moveEvents = ['touchmove', 'mousemove'] as const;
const endEvents = ['touchend', 'touchcancel', 'mouseup'] as const;

const EDGE_ZONE = 120;
const MAX_SCROLL_SPEED = 12;

function findScrollableAncestor(node: HTMLElement): HTMLElement | null {
  let current = node.parentElement;
  while (current) {
    const style = getComputedStyle(current);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function extractEventClientPosition(event: Event): { x: number; y: number } {
  const e = event as MouseEvent & TouchEvent;
  const position = {
    x:
      e.clientX ??
      e.changedTouches?.[0]?.clientX ??
      (e as unknown as { detail?: { clientX?: number } }).detail?.clientX,
    y:
      e.clientY ??
      e.changedTouches?.[0]?.clientY ??
      (e as unknown as { detail?: { clientY?: number } }).detail?.clientY
  };

  if (position.x == null || position.y == null) {
    console.error('Unable to extract position from the event:', event);
  }

  return position;
}

export interface OrderableContext {
  event: Event;
  position: { x: number; y: number };
  containerNode: HTMLElement;
  itemNodeCopy: HTMLElement;
  itemNode: HTMLElement;
  itemNodes: HTMLElement[];
}

export interface OrderableMoveContext extends OrderableContext {
  fromIndex: number;
  toIndex: number;
  toNode: HTMLElement;
}

export interface OrderableOptions {
  startEvents?: string[];
  handleSelector?: string;
  preventClickWhenReleasing?: boolean;
  onStart?: (ctx: OrderableContext) => void;
  onMove?: (ctx: OrderableMoveContext) => void;
  onEnd?: (ctx: OrderableContext) => void;
}

export function orderableChildren({
  startEvents = ['mousedown'],
  handleSelector,
  preventClickWhenReleasing = false,
  onStart,
  onMove,
  onEnd
}: OrderableOptions = {}): Attachment<HTMLElement> {
  return (containerNode: HTMLElement) => {
    let itemNodes = Array.from(containerNode?.children || []) as HTMLElement[];
    let itemNode: HTMLElement | null = null;
    let itemNodeCopy: HTMLElement;
    let itemNodeIndex = -1;
    let lastOverNode: HTMLElement | null = null;
    let translateOffset = { x: 0, y: 0 };
    let activeStartEvent: string | null = null;
    let scrollContainer: HTMLElement | null = null;
    let scrollRafId = 0;

    const makeStopPropagationOnce = (useCapture: boolean): EventListener => {
      const handler: EventListener = (event) => {
        event.stopPropagation();
        event.currentTarget!.removeEventListener(event.type, handler, useCapture);
      };
      return handler;
    };

    const handleStartEvent = (event: Event) => {
      if (activeStartEvent) return;

      if (handleSelector) {
        const target = event.target as HTMLElement;
        if (!target.closest(handleSelector)) return;
      }

      activeStartEvent = event.type;

      event.preventDefault();

      const currentTarget = event.currentTarget as HTMLElement;
      itemNode = currentTarget;

      if (preventClickWhenReleasing) {
        currentTarget.addEventListener('click', makeStopPropagationOnce(true), true);
      }

      const targetRect = currentTarget.getBoundingClientRect();
      const position = extractEventClientPosition(event);

      itemNodes = Array.from(containerNode?.children || []) as HTMLElement[];
      translateOffset.x = targetRect.left - position.x;
      translateOffset.y = targetRect.top - position.y;

      itemNodeIndex = itemNodes.findIndex((node) => node === itemNode);
      itemNodeCopy = currentTarget.cloneNode(true) as HTMLElement;

      itemNodeCopy.style.setProperty('pointer-events', 'none');
      itemNodeCopy.style.setProperty('touch-action', 'none');
      itemNodeCopy.style.setProperty('z-index', '1');
      itemNodeCopy.style.width = `${currentTarget.clientWidth}px`;
      itemNodeCopy.style.height = `${currentTarget.clientHeight}px`;
      itemNodeCopy.style.position = 'fixed';
      itemNodeCopy.style.top = '0';
      itemNodeCopy.style.left = '0';
      itemNodeCopy.style.transform = `translate(${targetRect.left}px, ${targetRect.top}px)`;
      itemNodeCopy.style.opacity = '0.9';
      itemNodeCopy.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

      containerNode.appendChild(itemNodeCopy);
      containerNode.style.setProperty('user-select', 'none');
      containerNode.style.setProperty('cursor', 'grabbing');
      scrollContainer = findScrollableAncestor(containerNode);

      onStart?.({
        event,
        position,
        containerNode,
        itemNodeCopy,
        itemNode,
        itemNodes
      });
    };

    const autoScrollNearEdges = (position: { x: number; y: number }) => {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = 0;

      if (!scrollContainer) return;

      const rect = scrollContainer.getBoundingClientRect();
      const distTop = position.y - rect.top;
      const distBottom = rect.bottom - position.y;

      if (distTop >= 0 && distTop < EDGE_ZONE) {
        const speed = MAX_SCROLL_SPEED * (1 - distTop / EDGE_ZONE);
        const step = () => {
          scrollContainer!.scrollTop -= speed;
          scrollRafId = requestAnimationFrame(step);
        };
        scrollRafId = requestAnimationFrame(step);
      } else if (distBottom >= 0 && distBottom < EDGE_ZONE) {
        const speed = MAX_SCROLL_SPEED * (1 - distBottom / EDGE_ZONE);
        const step = () => {
          scrollContainer!.scrollTop += speed;
          scrollRafId = requestAnimationFrame(step);
        };
        scrollRafId = requestAnimationFrame(step);
      }
    };

    const handleMoveEvent = (event: Event) => {
      if (!activeStartEvent) return;

      event.preventDefault();

      const position = extractEventClientPosition(event);
      const translate = {
        x: position.x + translateOffset.x,
        y: position.y + translateOffset.y
      };

      itemNodes = (Array.from(containerNode?.children || []) as HTMLElement[]).filter(
        (node) => node !== itemNodeCopy
      );
      itemNodeIndex = itemNodes.findIndex((node) => node === itemNode);
      itemNodeCopy.style.transform = `translate(${translate.x}px, ${translate.y}px)`;

      autoScrollNearEdges(position);

      const elementsUnderPoint = document.elementsFromPoint(position.x, position.y);
      const overNode = elementsUnderPoint.find(
        (node) => node?.parentNode === containerNode && node !== itemNodeCopy
      ) as HTMLElement | undefined;

      if (overNode === lastOverNode) return;

      const overNodeIndex = itemNodes.findIndex((node) => node === overNode);
      lastOverNode = overNode ?? null;

      if (overNodeIndex >= 0 && itemNodeIndex >= 0 && itemNodeIndex !== overNodeIndex) {
        onMove?.({
          event,
          position,
          fromIndex: itemNodeIndex,
          toIndex: overNodeIndex,
          toNode: overNode!,
          containerNode,
          itemNodeCopy,
          itemNode: itemNode!,
          itemNodes
        });
        itemNodeIndex = overNodeIndex;
      }
    };

    const handleEndEvent = (event: Event) => {
      if (!activeStartEvent) return;

      event.stopPropagation();
      event.stopImmediatePropagation();
      const position = extractEventClientPosition(event);

      if (itemNode) {
        itemNode.style.removeProperty('pointer-events');
        itemNode.style.removeProperty('touch-action');
      }
      itemNodeCopy.remove();
      lastOverNode = null;
      activeStartEvent = null;
      cancelAnimationFrame(scrollRafId);
      scrollRafId = 0;
      scrollContainer = null;

      containerNode.style.removeProperty('user-select');
      containerNode.style.removeProperty('cursor');

      onEnd?.({
        event,
        itemNode: itemNode!,
        position,
        containerNode,
        itemNodeCopy,
        itemNodes
      });
    };

    const addEventListeners = (node: HTMLElement) => {
      const startEventNode = (handleSelector && node.closest(handleSelector)) || node;

      startEvents.forEach((eventName) =>
        startEventNode.addEventListener(eventName, handleStartEvent, { passive: false })
      );
      moveEvents.forEach((eventName) =>
        window.addEventListener(eventName, handleMoveEvent, { passive: false })
      );
      endEvents.forEach((eventName) => window.addEventListener(eventName, handleEndEvent));
    };

    const removeEventListeners = (node: HTMLElement) => {
      const startEventNode = (handleSelector && node.closest(handleSelector)) || node;

      startEvents.forEach((eventName) =>
        startEventNode.removeEventListener(eventName, handleStartEvent)
      );
      moveEvents.forEach((eventName) => window.removeEventListener(eventName, handleMoveEvent));
      endEvents.forEach((eventName) => window.removeEventListener(eventName, handleEndEvent));
    };

    itemNodes.forEach(addEventListeners);

    const handleMutations = (mutationRecords: MutationRecord[]) => {
      for (const mutation of mutationRecords) {
        for (const newNode of mutation.addedNodes) {
          if (!(newNode instanceof HTMLElement)) continue;
          if (itemNodes.find((node) => node === newNode)) continue;

          addEventListeners(newNode);
          itemNodes.push(newNode);
        }
      }
    };
    const observer = new MutationObserver(handleMutations);
    observer.observe(containerNode, { childList: true });

    return () => {
      cancelAnimationFrame(scrollRafId);
      itemNodes.forEach(removeEventListeners);
      observer.disconnect();
    };
  };
}
