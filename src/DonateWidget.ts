/**
 * DonateWidget Component
 * A dismissible floating card inviting support for the project, with a link
 * and a scannable QR code for the donation page.
 */

// The QR code is generated ahead of time and inlined, so it renders crisply at
// any size and the standalone file:// build needs no network to show it.
import donateQrSvg from './assets/donate-qr.svg?raw';

/** Donation page the widget links to */
export const DONATE_URL =
  'https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800';

/** localStorage key recording that the user has dismissed the widget */
export const DONATE_DISMISSED_KEY = 'coinDesigner.donateDismissed';

/**
 * Configuration for the DonateWidget component
 */
export interface DonateWidgetConfig {
  /** Donation page URL */
  donateUrl?: string;
  /** Called after the user dismisses the widget */
  onDismiss?: () => void;
}

/**
 * Reads whether the widget has already been dismissed.
 *
 * Storage can throw - Safari's private mode and blocked third-party storage
 * both do - so a failure is treated as "not dismissed" and the widget shows.
 *
 * @returns True if the user has dismissed the widget before
 */
export function isDonateWidgetDismissed(): boolean {
  try {
    return localStorage.getItem(DONATE_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Records that the user dismissed the widget.
 */
function rememberDismissal(): void {
  try {
    localStorage.setItem(DONATE_DISMISSED_KEY, 'true');
  } catch {
    // A dismissal that cannot be stored still hides the widget for this visit.
  }
}

/**
 * Creates the floating donation card.
 * @param config - Component configuration
 * @returns HTMLElement containing the widget
 */
export function createDonateWidget(
  config: DonateWidgetConfig = {},
): HTMLElement {
  const donateUrl = config.donateUrl ?? DONATE_URL;

  const container = document.createElement('aside');
  container.className = [
    'fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)]',
    'bg-white rounded-xl shadow-lg border border-gray-200',
    'p-4 pr-8 animate-slide-in',
  ].join(' ');
  container.setAttribute('aria-label', 'Support this project');

  // Dismiss button
  const dismissButton = document.createElement('button');
  dismissButton.type = 'button';
  dismissButton.className = [
    'absolute top-2 right-2 w-6 h-6 flex items-center justify-center',
    'rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100',
    'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-secondary',
  ].join(' ');
  dismissButton.setAttribute('aria-label', 'Dismiss donation message');
  dismissButton.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round"/>
    </svg>
  `;
  dismissButton.addEventListener('click', () => {
    rememberDismissal();
    container.remove();
    config.onDismiss?.();
  });

  const layout = document.createElement('div');
  layout.className = 'flex items-start gap-3';

  // QR code. Hidden on the narrowest screens, where the card has no room for it
  // and the phone holding it cannot scan its own display anyway.
  const qrCode = document.createElement('a');
  qrCode.href = donateUrl;
  qrCode.target = '_blank';
  qrCode.rel = 'noopener noreferrer';
  qrCode.className = [
    // 24 units across for 35 QR modules leaves each module wide enough for a
    // phone camera to resolve on a standard-density display.
    'hidden xs:block shrink-0 w-24 h-24 p-1 bg-white rounded',
    'border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary',
  ].join(' ');
  qrCode.setAttribute('aria-label', 'Scan to open the donation page');
  qrCode.innerHTML = donateQrSvg;
  const qrSvg = qrCode.querySelector('svg');
  qrSvg?.setAttribute('class', 'w-full h-full');

  const content = document.createElement('div');
  content.className = 'min-w-0';

  const message = document.createElement('p');
  message.className = 'text-[13px] xs:text-sm text-gray-700 leading-snug';
  message.textContent =
    'If this app, code, or repository has helped you or someone you know, ' +
    'please consider donating. I appreciate any help to offset the costs of ' +
    'development and/or AI credits.';

  const donateLink = document.createElement('a');
  donateLink.href = donateUrl;
  donateLink.target = '_blank';
  donateLink.rel = 'noopener noreferrer';
  donateLink.className = [
    'inline-block mt-2 text-sm font-medium text-brand-primary',
    'hover:text-brand-primary-hover hover:underline rounded',
    'focus:outline-none focus:ring-2 focus:ring-brand-secondary',
  ].join(' ');
  donateLink.textContent = 'Donate via Stripe →';

  content.appendChild(message);
  content.appendChild(donateLink);
  layout.appendChild(qrCode);
  layout.appendChild(content);
  container.appendChild(dismissButton);
  container.appendChild(layout);

  return container;
}

/**
 * Adds the donation card to the page unless it has already been dismissed.
 * @param parent - Element to mount into; defaults to the document body
 * @returns The mounted widget, or null when previously dismissed
 */
export function mountDonateWidget(
  parent: HTMLElement = document.body,
): HTMLElement | null {
  if (isDonateWidgetDismissed()) {
    return null;
  }

  const widget = createDonateWidget();
  parent.appendChild(widget);

  return widget;
}
