'use strict';
/* Imports */
import { SearchEngine, fuzzySearch, Range } from './search-engine';

/* Tests */
describe('SearchEngine', () => {
  it('should work', () => {
    new SearchEngine();
  });
});

describe('fuzzySearch', () => {
  it('should work', () => {
    fuzzySearch('hl', 'hello');
  });

  it.each<[string, string, Range[]]>([
    [
      'hl',
      'hello',
      [
        [0, 1],
        [2, 3]
      ]
    ],
    [
      'lo',
      'hello',
      [
        [2, 3],
        [4, 5]
      ]
    ],
    ['he', 'hello', [[0, 2]]],
    ['ll', 'hello', [[2, 4]]],
    ['hello', 'hello', [[0, 5]]],
    ['', 'hello', []]
  ])('should match %p in %p', (needle, haystack, expectedPositions) => {
    const { found, positions } = fuzzySearch(needle, haystack);

    expect(found).toBe(true);
    expect(positions).toEqual(expectedPositions);
  });

  it.each<[string, string, Range[]]>([
    ['buy', 'hello', []],
    ['ol', 'hello', []],
    ['hle', 'hello', []],
    ['hello!', 'hello', []]
  ])('should not match %p in %p', (needle, haystack, expectedPositions) => {
    const { found, positions } = fuzzySearch(needle, haystack);

    expect(found).toBe(false);
    expect(positions).toEqual(expectedPositions);
  });
});
