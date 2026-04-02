/**
 * GQL Utility for POS Storefront
 */

const ADMIN_API = 'http://127.0.0.1:3000/admin-api';
const SHOP_API = 'http://127.0.0.1:3000/shop-api';

interface GqlOptions {
  useAdmin?: boolean;
  variables?: Record<string, any>;
}

export async function gql<T = any>(query: string, options: GqlOptions = {}): Promise<T> {
  const { useAdmin = false, variables = {} } = options;
  const url = useAdmin ? ADMIN_API : SHOP_API;

  if (!query || query.trim().length === 0) {
    throw new Error('GraphQL query cannot be empty.');
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        query: query.trim(), 
        variables: variables 
      }),
    });

    const json = await res.json();

    if (json.errors) {
      console.error(`[GQL ERROR] URL: ${url}`, json.errors);
      throw new Error(json.errors[0].message || 'GraphQL Error');
    }

    return json.data;
  } catch (err: any) {
    console.error(`[FETCH ERROR] URL: ${url}`, err.message);
    throw err;
  }
}
