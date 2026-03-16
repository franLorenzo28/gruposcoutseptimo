import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { describe, expect, it } from 'vitest';

describe('Button', () => {
  it('renders a button with the correct text', () => {
    render(<Button>Hello Vitest</Button>);
    expect(screen.getByText('Hello Vitest')).toBeInTheDocument();
  });

  it('renders a button with a custom type', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders a button with a custom variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-destructive');
  });
});
