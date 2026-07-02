// Feature: life-timeline, Property 10: Event filter correctness
// Validates: Requirements 8.2, 8.3, 8.4, 8.5

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { EventNode, EventCategory, EventSentiment } from '@/types/event';
import {
  filterEvents,
  isFilterEmpty,
  type FilterCriteria,
} from '@/lib/event-filter';

// --- Arbitraries ---

const ALL_CATEGORIES: EventCategory[] = [
  'education', 'work', 'life', 'achievement', 'health', 'travel', 'other',
];

const ALL_SENTIMENTS: EventSentiment[] = ['positive', 'neutral', 'negative'];

const categoryArb: fc.Arbitrary<EventCategory> = fc.constantFrom(...ALL_CATEGORIES);

const sentimentArb: fc.Arbitrary<EventSentiment> = fc.constantFrom(...ALL_SENTIMENTS);

const eventNodeArb: fc.Arbitrary<EventNode> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  eventDate: fc.date({
    min: new Date('1900-01-01'),
    max: new Date('2034-12-31'),
  }).map((d) => d.toISOString().slice(0, 10)),
  category: categoryArb,
  sentiment: sentimentArb,
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
});

const eventNodeArrayArb: fc.Arbitrary<EventNode[]> = fc.array(eventNodeArb, {
  minLength: 0,
  maxLength: 20,
});

const keywordArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 10 }),
);

const categoriesSubsetArb: fc.Arbitrary<EventCategory[]> = fc.subarray(ALL_CATEGORIES);

const sentimentsSubsetArb: fc.Arbitrary<EventSentiment[]> = fc.subarray(ALL_SENTIMENTS);

const filterCriteriaArb: fc.Arbitrary<FilterCriteria> = fc.record({
  keyword: keywordArb,
  categories: categoriesSubsetArb,
  sentiments: sentimentsSubsetArb,
});

// --- Property Tests ---

describe('Property 10: Event filter correctness', () => {
  it('Property 10.1: Empty filter returns all events', () => {
    fc.assert(
      fc.property(eventNodeArrayArb, (events) => {
        const emptyCriteria: FilterCriteria = {
          keyword: '',
          categories: [],
          sentiments: [],
        };

        const result = filterEvents(events, emptyCriteria);
        expect(result.filteredEvents.length).toBe(events.length);
        expect(result.matchedCount).toBe(events.length);
        expect(result.totalCount).toBe(events.length);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 10.2: matchedCount + unmatchedCount === totalCount', () => {
    fc.assert(
      fc.property(eventNodeArrayArb, filterCriteriaArb, (events, criteria) => {
        const result = filterEvents(events, criteria);
        const unmatchedCount = result.totalCount - result.matchedCount;
        expect(result.matchedCount + unmatchedCount).toBe(result.totalCount);
        expect(result.totalCount).toBe(events.length);
        expect(result.matchedCount).toBe(result.filteredEvents.length);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 10.3: Keyword filter - every matched event contains the keyword (case-insensitive) in title or description', () => {
    fc.assert(
      fc.property(
        eventNodeArrayArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        (events, keyword) => {
          const criteria: FilterCriteria = {
            keyword,
            categories: [],
            sentiments: [],
          };

          const result = filterEvents(events, criteria);
          const lowerKeyword = keyword.toLowerCase().trim();

          // If keyword is non-empty after trim, all matched events must contain it
          if (lowerKeyword !== '') {
            for (const event of result.filteredEvents) {
              const titleMatch = event.title.toLowerCase().includes(lowerKeyword);
              const descMatch = event.description.toLowerCase().includes(lowerKeyword);
              expect(titleMatch || descMatch).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10.4: Category filter - every matched event has category in the criteria.categories list', () => {
    fc.assert(
      fc.property(
        eventNodeArrayArb,
        fc.array(categoryArb, { minLength: 1, maxLength: 7 }),
        (events, categories) => {
          // Deduplicate categories
          const uniqueCategories = [...new Set(categories)];
          const criteria: FilterCriteria = {
            keyword: '',
            categories: uniqueCategories,
            sentiments: [],
          };

          const result = filterEvents(events, criteria);

          for (const event of result.filteredEvents) {
            expect(uniqueCategories).toContain(event.category);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10.5: Sentiment filter - every matched event has sentiment in the criteria.sentiments list', () => {
    fc.assert(
      fc.property(
        eventNodeArrayArb,
        fc.array(sentimentArb, { minLength: 1, maxLength: 3 }),
        (events, sentiments) => {
          // Deduplicate sentiments
          const uniqueSentiments = [...new Set(sentiments)];
          const criteria: FilterCriteria = {
            keyword: '',
            categories: [],
            sentiments: uniqueSentiments,
          };

          const result = filterEvents(events, criteria);

          for (const event of result.filteredEvents) {
            expect(uniqueSentiments).toContain(event.sentiment);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10.6: AND logic - filtering with keyword AND categories returns intersection of both filters', () => {
    fc.assert(
      fc.property(
        eventNodeArrayArb,
        fc.string({ minLength: 1, maxLength: 5 }),
        fc.array(categoryArb, { minLength: 1, maxLength: 4 }),
        (events, keyword, categories) => {
          const uniqueCategories = [...new Set(categories)];

          // Combined filter
          const combinedCriteria: FilterCriteria = {
            keyword,
            categories: uniqueCategories,
            sentiments: [],
          };
          const combinedResult = filterEvents(events, combinedCriteria);

          // Individual filters
          const keywordOnly: FilterCriteria = {
            keyword,
            categories: [],
            sentiments: [],
          };
          const categoryOnly: FilterCriteria = {
            keyword: '',
            categories: uniqueCategories,
            sentiments: [],
          };
          const keywordResult = filterEvents(events, keywordOnly);
          const categoryResult = filterEvents(events, categoryOnly);

          // AND logic: combined result should be subset of both individual results
          const keywordIds = new Set(keywordResult.filteredEvents.map((e) => e.id));
          const categoryIds = new Set(categoryResult.filteredEvents.map((e) => e.id));

          for (const event of combinedResult.filteredEvents) {
            expect(keywordIds.has(event.id)).toBe(true);
            expect(categoryIds.has(event.id)).toBe(true);
          }

          // Also, the intersection should equal the combined result
          const intersectionIds = new Set(
            keywordResult.filteredEvents
              .filter((e) => categoryIds.has(e.id))
              .map((e) => e.id)
          );
          const combinedIds = new Set(combinedResult.filteredEvents.map((e) => e.id));
          expect(combinedIds).toEqual(intersectionIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10.7: Order preservation - filteredEvents maintains original relative order', () => {
    fc.assert(
      fc.property(eventNodeArrayArb, filterCriteriaArb, (events, criteria) => {
        const result = filterEvents(events, criteria);

        // Check that filtered events appear in the same relative order as in the original array
        let lastIndex = -1;
        for (const filteredEvent of result.filteredEvents) {
          const currentIndex = events.findIndex((e) => e.id === filteredEvent.id);
          expect(currentIndex).toBeGreaterThan(lastIndex);
          lastIndex = currentIndex;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 10.8: isFilterEmpty returns true only when keyword is empty and both arrays are empty', () => {
    fc.assert(
      fc.property(filterCriteriaArb, (criteria) => {
        const isEmpty = isFilterEmpty(criteria);
        const shouldBeEmpty =
          criteria.keyword.trim() === '' &&
          criteria.categories.length === 0 &&
          criteria.sentiments.length === 0;

        expect(isEmpty).toBe(shouldBeEmpty);
      }),
      { numRuns: 100 }
    );
  });
});
