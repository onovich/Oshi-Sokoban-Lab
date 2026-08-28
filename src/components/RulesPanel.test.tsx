import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RulesPanel } from './RulesPanel';

describe('RulesPanel', () => {
  it('uses the same source-faithful SVG glyph vocabulary as the board legend', () => {
    const { container } = render(<RulesPanel mechanics={['Rain']} />);

    expect(container.querySelector('[data-glyph="player"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="block"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="gate-blue"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="moving-spike"]')).toBeTruthy();
    expect(container.textContent).not.toContain('●');
    expect(container.textContent).not.toContain('↔');
    expect(container.textContent).not.toContain('内部箭头');
    expect(container.textContent).not.toContain('橙色角标');
  });
});
