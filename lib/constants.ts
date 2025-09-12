import { getCategorizedGenres, getAllGenres } from './utils';

export const CATEGORIZED_GENRES = getCategorizedGenres();

// GraphQL endpoint - set via environment variable for security
export const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

if (!GRAPHQL_ENDPOINT) {
  console.error('❌ NEXT_PUBLIC_GRAPHQL_ENDPOINT environment variable is required');
  console.error('Please create a .env.local file with your GraphQL endpoint');
}

// Legacy flat genres for backward compatibility
export const MANGA_GENRES = getAllGenres();