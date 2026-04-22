/**
 * Shop API client — Vendure shop-api GraphQL endpoint.
 * Browser-only. Token is cached in memory + localStorage.
 */
const SHOP_API = process.env.NEXT_PUBLIC_SHOP_API || 'http://127.0.0.1:3000/shop-api';
const TOKEN_KEY = 'avs_shop_token';

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}
function setToken(t) {
    if (typeof window === 'undefined') return;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
}

export async function gql(query, variables = {}) {
    if (!query || !query.trim()) throw new Error('Empty GraphQL query.');
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(SHOP_API, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ query: query.trim(), variables }),
    });

    // Capture auth token returned by Vendure
    const fresh = res.headers.get('vendure-auth-token');
    if (fresh) setToken(fresh);

    const json = await res.json();
    if (json.errors) {
        const msg = json.errors[0]?.message || 'GraphQL Error';
        throw new Error(msg);
    }
    return json.data;
}

export { setToken, getToken };
