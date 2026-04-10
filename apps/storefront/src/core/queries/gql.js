/**
 * GQL Utility for POS Storefront
 * Uses Vendure's token-based auth (vendure-auth-token header)
 */
const ADMIN_API = 'http://127.0.0.1:3000/admin-api';
const SHOP_API = 'http://127.0.0.1:3000/shop-api';
let _adminToken = null;
let _loginPromise = null;
async function ensureLogin() {
    if (_adminToken)
        return;
    if (_loginPromise)
        return _loginPromise;
    _loginPromise = (async () => {
        try {
            const res = await fetch(ADMIN_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `mutation { login(username: "superadmin", password: "superadmin") { ... on CurrentUser { id } } }`
                })
            });
            const json = await res.json();
            // Vendure returns auth token in response header
            const token = res.headers.get('vendure-auth-token');
            if (token) {
                _adminToken = token;
            }
            else if (json.data?.login?.id) {
                // Fallback: extract from set-cookie or use a fixed approach
                _adminToken = 'logged-in';
            }
        }
        catch (e) {
            console.error('Admin login failed:', e);
        }
    })();
    return _loginPromise;
}
export async function gql(query, options = {}) {
    const { useAdmin = false, variables = {} } = options;
    const url = useAdmin ? ADMIN_API : SHOP_API;
    if (!query || query.trim().length === 0) {
        throw new Error('GraphQL query cannot be empty.');
    }
    // Auto-login for admin API
    if (useAdmin) {
        await ensureLogin();
    }
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        // Attach auth token
        if (useAdmin && _adminToken && _adminToken !== 'logged-in') {
            headers['Authorization'] = `Bearer ${_adminToken}`;
        }
        const res = await fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
                query: query.trim(),
                variables: variables
            }),
        });
        // Capture auth token from response for future requests
        const newToken = res.headers.get('vendure-auth-token');
        if (newToken) {
            _adminToken = newToken;
        }
        const json = await res.json();
        if (json.errors) {
            // If auth error, retry login once
            if (json.errors[0]?.extensions?.code === 'FORBIDDEN' && useAdmin) {
                _adminToken = null;
                _loginPromise = null;
                await ensureLogin();
                // Retry the query
                const retryHeaders = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                };
                if (_adminToken && _adminToken !== 'logged-in') {
                    retryHeaders['Authorization'] = `Bearer ${_adminToken}`;
                }
                const retryRes = await fetch(url, {
                    method: 'POST',
                    headers: retryHeaders,
                    credentials: 'include',
                    body: JSON.stringify({ query: query.trim(), variables }),
                });
                const retryToken = retryRes.headers.get('vendure-auth-token');
                if (retryToken)
                    _adminToken = retryToken;
                const retryJson = await retryRes.json();
                if (retryJson.errors) {
                    console.error(`[GQL ERROR] URL: ${url}`, retryJson.errors);
                    throw new Error(retryJson.errors[0].message || 'GraphQL Error');
                }
                return retryJson.data;
            }
            console.error(`[GQL ERROR] URL: ${url}`, json.errors);
            throw new Error(json.errors[0].message || 'GraphQL Error');
        }
        return json.data;
    }
    catch (err) {
        console.error(`[FETCH ERROR] URL: ${url}`, err.message);
        throw err;
    }
}
