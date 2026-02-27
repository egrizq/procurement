import { describe, it, expect } from 'vitest';
import getPaginationMeta from './paginate';

describe('getPaginationMeta', () => {
  it('should generate correct pagination metadata for first page', () => {
    const result = getPaginationMeta(1, 10, 50);

    expect(result.current_page).toBe(1);
    expect(result.total_pages).toBe(5);
    expect(result.total_items).toBe(50);
    expect(result.per_page).toBe(10);
    expect(result.from).toBe(1);
    expect(result.to).toBe(10);
    expect(result.has_prev).toBe(false);
    expect(result.has_next).toBe(true);
    expect(result.prev_page).toBe(null);
    expect(result.next_page).toBe(2);
  });

  it('should generate correct pagination metadata for middle page', () => {
    const result = getPaginationMeta(3, 10, 50);

    expect(result.current_page).toBe(3);
    expect(result.total_pages).toBe(5);
    expect(result.from).toBe(21);
    expect(result.to).toBe(30);
    expect(result.has_prev).toBe(true);
    expect(result.has_next).toBe(true);
    expect(result.prev_page).toBe(2);
    expect(result.next_page).toBe(4);
  });

  it('should generate correct pagination metadata for last page', () => {
    const result = getPaginationMeta(5, 10, 50);

    expect(result.current_page).toBe(5);
    expect(result.total_pages).toBe(5);
    expect(result.from).toBe(41);
    expect(result.to).toBe(50);
    expect(result.has_prev).toBe(true);
    expect(result.has_next).toBe(false);
    expect(result.prev_page).toBe(4);
    expect(result.next_page).toBe(null);
  });

  it('should handle empty results', () => {
    const result = getPaginationMeta(1, 10, 0);

    expect(result.total_pages).toBe(0);
    expect(result.total_items).toBe(0);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
  });

  it('should handle partial last page', () => {
    const result = getPaginationMeta(3, 10, 25);

    expect(result.total_pages).toBe(3);
    expect(result.from).toBe(21);
    expect(result.to).toBe(25);
    expect(result.has_next).toBe(false);
  });
});
