import axios from "axios"

export const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        'Accept': 'application/json'
    }
});

export const apiConnector = (method, url, bodyData, headers, params, config = {}) => {
    // Debug logging
    console.log('API Request:', {
        method,
        url,
        bodyData,
        headers,
        params,
        config
    });

    // Determine if we're sending FormData (for file uploads)
    const isFormData = bodyData instanceof FormData;
    
    // Set default headers, but don't override Content-Type for FormData
    const defaultHeaders = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(headers?.Authorization ? { 'Authorization': headers.Authorization } : {})
    };

    // Debug token
    if (headers?.Authorization) {
        console.log('Token being used:', headers.Authorization);
    }

    return axiosInstance({
        method: `${method}`,
        url: `${url}`,
        data: bodyData !== undefined && bodyData !== null ? bodyData : undefined,
        headers: {
            ...defaultHeaders,
            ...headers
        },
        params: params ? params : null,
        withCredentials: true,
        ...config  // Spread additional axios config options like responseType
    }).then(response => {
        console.log('API Response:', {
            url,
            status: response.status,
            data: response.data
        });
        return response;
    }).catch(error => {
        console.error('API Error:', {
            url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    });
}
