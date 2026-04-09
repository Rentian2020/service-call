import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders with default placeholder', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar onSearch={vi.fn()} placeholder="Find a plumber..." />);
    expect(screen.getByPlaceholderText('Find a plumber...')).toBeInTheDocument();
  });

  it('calls onSearch when input value changes', () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.value = 'test';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(handleSearch).toHaveBeenCalledWith('test');
  });
});
