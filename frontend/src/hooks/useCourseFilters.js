import { useState } from 'react';

const defaultFilters = {
  search: '',
  category: '',
  level: '',
  sort: 'rating',
  page: 1,
};

export function useCourseFilters() {
  const [filters, setFilters] = useState(defaultFilters);

  const updateFilters = (changes) => {
    setFilters((previous) => ({ ...previous, ...changes }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  return { filters, setFilters: updateFilters, resetFilters };
}
