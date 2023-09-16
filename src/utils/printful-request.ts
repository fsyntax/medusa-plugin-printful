import fetch from 'cross-fetch';

interface PrintfulClientOptions {
    headers?: Record<string, string>;
    baseUrl?: string;
}

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    data?: Record<string, any>;
    params?: Record<string, string | number>;
    customHeaders?: Record<string, string>;
}

export class PrintfulClient {
    private readonly token: string;
    private readonly options: PrintfulClientOptions;
    private readonly headers: Record<string, string>;

    constructor(token: string, options: PrintfulClientOptions = {}) {
        if (!token) {
            throw new Error('No API key provided');
        }

        const { headers } = options;

        this.token = token;

        this.options = {
            baseUrl: 'https://api.printful.com',
            ...options,
        };

        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...headers,
        };
    }

    private buildQueryString(params: Record<string, string | number | undefined>): string {
        return Object.keys(params).length
            ? '?' +
            Object.keys(params)
                .filter((k) => params[k] !== undefined)
                .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]!.toString())}`)
                .join('&')
            : '';
    }



    async request({ method, endpoint, data = {}, params = {}, customHeaders = {} }: RequestOptions) {
        const { baseUrl } = this.options;
        const queryString = this.buildQueryString(params);
        const url = `${baseUrl}${endpoint}${queryString}`;

        const requestConfig: any = {
            headers: { ...this.headers, ...customHeaders },
            method,
        };

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            requestConfig.body = JSON.stringify(data);
        }

        const response = await fetch(url, requestConfig);

        const json = await response.json();

        if (!response.ok) {
            throw json;
        }

        if (json && json['result'] && Array.isArray(json['result']) && json['code']) {
            return {
                code: json['code'],
                result: json['result']
            };
        }

        return json;
    }

    get(endpoint: string, params?: Record<string, string | number>, customHeaders?: Record<string, string>) {
        return this.request({ method: 'GET', endpoint, params, customHeaders });
    }

    post(endpoint: string, data?: Record<string, any>, customHeaders?: Record<string, string>) {
        return this.request({ method: 'POST', endpoint, data, customHeaders });
    }

    put(endpoint: string, data?: Record<string, any>, customHeaders?: Record<string, string>) {
        return this.request({ method: 'PUT', endpoint, data, customHeaders });
    }

    delete(endpoint: string, data?: Record<string, any>, customHeaders?: Record<string, string>) {
        return this.request({ method: 'DELETE', endpoint, data, customHeaders });
    }

}

interface RequestFunctionOptions extends Omit<RequestOptions, 'endpoint'> {
    token: string;
}

export async function request(endpoint: string, { token, ...rest }: RequestFunctionOptions) {
    const client = new PrintfulClient(token);
    return client.request({ endpoint, ...rest });
}
