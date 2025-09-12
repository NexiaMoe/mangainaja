import { GRAPHQL_ENDPOINT } from './constants';
import type { 
  MangaSearchParams, 
  MangaSearchResponse,
  MangaDetailsResponse,
  ChapterDetailsResponse,
  ChapterListResponse 
} from '@/types/api';

/**
 * Execute GraphQL query
 */
async function executeGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error('GraphQL endpoint not configured. Please set NEXT_PUBLIC_GRAPHQL_ENDPOINT environment variable.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    
    // Handle specific network errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error - please check your internet connection');
      }
    }
    
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

/**
 * Search for manga
 */
export async function searchManga(params: MangaSearchParams): Promise<MangaSearchResponse> {
  const query = `
    query get_content_searchComic($select: SearchComic_Select) {
      get_content_searchComic(select: $select) {
        reqPage
        reqSize
        reqSort
        reqWord
        newPage
        paging {
          total
          pages
          page
          init
          size
          skip
          limit
        }
        items {
          id
          data {
            name
            slug
            authors
            artists
            genres
            urlCover300
            dateCreate
            datePublic
            uploadStatus
            originalStatus
            origLang
            tranLang
          }
        }
      }
    }
  `;

  const variables = {
    select: {
      page: params.page || 1,
      size: params.size || 30,
      where: 'browse',
      word: params.searchTerm || '',
      sort: params.sortBy || 'field_upload',
      ...(params.genres && params.genres.length > 0 && {
        incGenres: params.genres,
      }),
      ...(params.origLangs && params.origLangs.length > 0 && {
        incOLangs: params.origLangs,
      }),
      ...(params.tranLangs && params.tranLangs.length > 0 && {
        incTLangs: params.tranLangs,
      }),
    },
  };

  const data = await executeGraphQL<{ get_content_searchComic: MangaSearchResponse }>(
    query, 
    variables
  );
  
  return data.get_content_searchComic;
}

/**
 * Get manga details
 */
export async function getMangaDetails(id: string): Promise<MangaDetailsResponse> {
  const query = `
    query get_content_comicNode($id: ID!) {
      get_content_comicNode(id: $id) {
        id
        data {
          name
          slug
          authors
          artists
          genres
          summary {
            text
          }
          urlCover300
          urlCover600
          urlCoverOri
          dateCreate
          datePublic
          dateModify
          origLang
          tranLang
          readDirection
          uploadStatus
          originalStatus
        }
        last_chapterNodes(amount: 10) {
          id
          data {
            dname
            urlPath
            dateCreate
            datePublic
            chaNum
            volNum
            count_images
          }
        }
      }
    }
  `;

  const data = await executeGraphQL<{ get_content_comicNode: MangaDetailsResponse }>(
    query, 
    { id }
  );
  
  return data.get_content_comicNode;
}

/**
 * Get complete chapter list for a manga
 */
export async function getChapterList(comicId: string): Promise<ChapterListResponse> {
  const query = `
    query get_content_chapterList($comicId: ID!) {
      get_content_chapterList(comicId: $comicId) {
        id
        data {
          dname
          urlPath
          chaNum
          volNum
          dateCreate
          datePublic
          count_images
          comicId
          dbStatus
          isNormal
          isHidden
          isDeleted
          isFinal
        }
      }
    }
  `;

  const data = await executeGraphQL<{ get_content_chapterList: ChapterListResponse }>(
    query, 
    { comicId }
  );
  
  return data.get_content_chapterList;
}

/**
 * Get chapter details with images
 */
export async function getChapterDetails(id: string): Promise<ChapterDetailsResponse> {
  const query = `
    query get_content_chapterNode($id: ID!) {
      get_content_chapterNode(id: $id) {
        id
        data {
          dname
          title
          urlPath
          volNum
          chaNum
          count_images
          userId
          comicId
          dbStatus
          dateCreate
          datePublic
          imageFiles
        }
      }
    }
  `;

  const data = await executeGraphQL<{ get_content_chapterNode: ChapterDetailsResponse }>(
    query,
    { id }
  );
  
  return data.get_content_chapterNode;
}

/**
 * Get popular manga for static generation
 */
export async function getPopularManga(limit: number = 50): Promise<MangaSearchResponse> {
  const query = `
    query get_content_searchComic($select: SearchComic_Select) {
      get_content_searchComic(select: $select) {
        reqPage
        reqSize
        reqSort
        reqWord
        newPage
        paging {
          total
          pages
          page
          init
          size
          skip
          limit
        }
        items {
          id
          data {
            name
            slug
            authors
            artists
            genres
            urlCover300
            dateCreate
            datePublic
            uploadStatus
            originalStatus
            origLang
            tranLang
          }
        }
      }
    }
  `;

  const variables = {
    select: {
      page: 1,
      size: limit,
      where: 'browse',
      word: '',
      sort: 'field_upload',
    },
  };

  const data = await executeGraphQL<{ get_content_searchComic: MangaSearchResponse }>(
    query,
    variables
  );
  
  return data.get_content_searchComic;
}