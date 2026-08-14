/**
 * Tests for the DonateWidget component.
 *
 * @vitest-environment jsdom
 */

import {beforeEach, describe, expect, it} from 'vitest';
import {
  createDonateWidget,
  DONATE_DISMISSED_KEY,
  DONATE_URL,
  isDonateWidgetDismissed,
  mountDonateWidget,
} from './DonateWidget';

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('createDonateWidget', () => {
  it('links to the donation page from both the link and the QR code', () => {
    const widget = createDonateWidget();
    const links = [...widget.querySelectorAll('a')];

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute('href')).toBe(DONATE_URL);
      // Opening in a new tab keeps a half-finished design on screen.
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('renders the QR code inline so the standalone build needs no network', () => {
    const widget = createDonateWidget();
    const qr = widget.querySelector('a svg');

    expect(qr).not.toBeNull();
    expect(qr?.querySelector('path')).not.toBeNull();
  });

  it('honours a caller-supplied donation URL', () => {
    const widget = createDonateWidget({donateUrl: 'https://example.test/give'});

    expect(widget.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.test/give',
    );
  });

  it('labels the dismiss control for assistive technology', () => {
    const button = createDonateWidget().querySelector('button');

    expect(button?.getAttribute('aria-label')).toBe(
      'Dismiss donation message',
    );
  });
});

describe('dismissal', () => {
  it('removes the widget and remembers the choice', () => {
    const widget = createDonateWidget();
    document.body.appendChild(widget);

    widget.querySelector('button')?.click();

    expect(document.body.contains(widget)).toBe(false);
    expect(isDonateWidgetDismissed()).toBe(true);
  });

  it('reports the dismissal to the caller', () => {
    let dismissed = false;
    const widget = createDonateWidget({onDismiss: () => (dismissed = true)});

    widget.querySelector('button')?.click();

    expect(dismissed).toBe(true);
  });
});

describe('mountDonateWidget', () => {
  it('mounts into the page on a first visit', () => {
    const widget = mountDonateWidget();

    expect(widget).not.toBeNull();
    expect(document.body.contains(widget!)).toBe(true);
  });

  it('stays away once dismissed', () => {
    localStorage.setItem(DONATE_DISMISSED_KEY, 'true');

    expect(mountDonateWidget()).toBeNull();
    expect(document.body.children).toHaveLength(0);
  });
});
