import axios from 'axios';

const {API_ID, VERSION} = process.env;

const BASE_URL = `https://${API_ID}.execute-api.us-east-1.amazonaws.com/${VERSION}`

const client = axios.create({
    baseURL: BASE_URL,
})

client.interceptors.request.use(function (config) {
    return config;
}, function (error) {
    console.error(error);
    return Promise.reject(error);
});

// Add a response interceptor
client.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    console.error(error);
    return Promise.reject(error);
});

export default client;