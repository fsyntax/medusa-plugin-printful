require('cross-fetch/polyfill')

class PrintfulClient {
    constructor(token, options = {}) {
        if (!token)
            throw new Error('No API key provided')

        const {headers} = options

        this.token = token

        this.options = {
            baseUrl: 'https://api.printful.com',
            ...options,
        }

        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...headers,
        }
    }

    async request({method, endpoint, data, params = {}}) {
        const {baseUrl} = this.options
        const headers = this.headers

        const queryString = Object.keys(params).length
            ? `?${Object.keys(params)
                .map(
                    k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`,
                )
                .join('&')}`
            : ''

        const url = `${baseUrl}/${endpoint}${queryString}`

        const response = await fetch(url, {
            headers,
            ...(method && {method}),
            ...(data && {body: JSON.stringify(data)}),
        })

        const json = await response.json()

        if (!response.ok)
            throw json

        return json
    }

    get(endpoint, params) {
        return this.request({endpoint, params})
    }

    post(endpoint, data) {
        return this.request({method: 'POST', endpoint, data})
    }

    put(endpoint, data) {
        return this.request({method: 'PUT', endpoint, data})
    }

    delete(endpoint, data) {
        return this.request({method: 'DELETE', endpoint, data})
    }
}

async function request(endpoint, {token, ...rest}) {
    const client = new PrintfulClient(token)

    return client.request({endpoint, ...rest})
}

module.exports = {
    PrintfulClient,
    request,
}
