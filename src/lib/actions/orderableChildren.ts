const moveEvents = ['touchmove', 'mousemove'] as const;
const endEvents = ['touchend', 'mouseup'] as const;

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

export function orderableChildren(
  containerNode: HTMLElement,
  {
    startEvents = ['mousedown'],
    handleSelector,
    preventClickWhenReleasing = false,
    onStart,
    onMove,
    onEnd
  }: OrderableOptions = {}
): { update: () => void; destroy: () => void } {
  let itemNodes = Array.from(containerNode?.children || []) as HTMLElement[];
  let itemNode: HTMLElement | null = null;
  let itemNodeCopy: HTMLElement | null = null;
  let itemNodeIndex = -1;
  let lastOverNode: HTMLElement | null = null;
  let translateOffset = { x: 0, y: 0 };
  let activeStartEvent: string | null = null;

  const makeStopPropagationOnce = (useCapture: boolean): EventListener => {
    const handler: EventListener = (event) => {
      event.stopPropagation();
      event.currentTarget!.removeEventListener(event.type, handler, useCapture);
    };
    return handler;
  };

  const startEventHandlers = new Map<HTMLElement, Map<string, EventListener>>();

  const handleStartEvent = (event: Event) => {
    if (activeStartEvent) return;
    activeStartEvent = event.type;

    if (handleSelector) {
      const target = event.target as HTMLElement;
      if (!target.closest(handleSelector)) return;
    }

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
    document.body.style.setProperty('cursor', 'grabbing', 'important');

    onStart?.({
      event,
      position,
      containerNode,
      itemNodeCopy,
      itemNode,
      itemNodes
    });
  };

  const handleMoveEvent = (event: Event) => {
    if (!itemNodeCopy) return;

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
    if (!itemNodeCopy) return;
    event.stopPropagation();
    event.stopImmediatePropagation();
    const position = extractEventClientPosition(event);

    if (itemNode) {
      itemNode.style.removeProperty('pointer-events');
      itemNode.style.removeProperty('touch-action');
    }
    itemNodeCopy.remove();
    itemNodeCopy = null;
    lastOverNode = null;
    activeStartEvent = null;

    containerNode.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');

    onEnd?.({
      event,
      itemNode: itemNode!,
      position,
      containerNode,
      itemNodeCopy: null as unknown as HTMLElement,
      itemNodes
    });
  };

  const addEventListeners = (node: HTMLElement) => {
    const handlers = new Map<string, EventListener>();
    for (const eventName of startEvents) {
      const handler: EventListener = (event) => handleStartEvent(event);
      node.addEventListener(eventName, handler);
      handlers.set(eventName, handler);
    }
    startEventHandlers.set(node, handlers);
    moveEvents.forEach((eventName) => window.addEventListener(eventName, handleMoveEvent));
    endEvents.forEach((eventName) => window.addEventListener(eventName, handleEndEvent));
  };

  const removeEventListeners = (node: HTMLElement) => {
    const handlers = startEventHandlers.get(node);
    if (handlers) {
      for (const [eventName, handler] of handlers) {
        node.removeEventListener(eventName, handler);
      }
      startEventHandlers.delete(node);
    }
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

  return {
    update: () => {
      console.error(
        'Parameter updating is not implemented. The dragging behavior will not change.'
      );
    },
    destroy: () => {
      itemNodes.forEach(removeEventListeners);
      observer.disconnect();
    }
  };
}
