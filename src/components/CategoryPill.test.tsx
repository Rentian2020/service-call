import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryPill } from './CategoryPill';
import type { ServiceCategory } from '../types';

describe('CategoryPill', () => {
  it('renders the category name', () => {
    const mockCategory = 'plumbing' as unknown as ServiceCategory;
    render(<CategoryPill category={mockCategory} onClick={vi.fn()} isSelected={false} />);
    expect(screen.getByText('plumbing')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockCategory = 'plumbing' as unknown as ServiceCategory;
    const handleClick = vi.fn();
    render(<CategoryPill category={mockCategory} onClick={handleClick} isSelected={false} />);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
