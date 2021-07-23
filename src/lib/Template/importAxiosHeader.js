var axiosConfigTemplate = (options, config) => {
  return `

  export function axios(configs: IRequestConfig, resolve: (p: any) => void, reject: (p: any) => void) {

    ${config}

    const req = serviceOptions.axios ? serviceOptions.axios.request(configs) : axiosStatic(configs);

    return req.then((res) => { resolve(res.data); }).catch(err => { reject(err); });
  }
  `;
};

exports.axiosConfigTemplate = axiosConfigTemplate

var importAxiosHeader = (options) => {
  return `
  // tslint:disable
  /* eslint-disable */
  import axiosStatic, { AxiosInstance } from 'axios';

  export interface IRequestOptions {
    headers?: any;
    baseURL?: string;
    responseType?: string;
  }

  interface IRequestConfig {
    method?: any;
    headers?: any;
    url?: any;
    baseURL?: any;
    data?: any;
    params?: any;
  }

  export interface ServiceOptions {
    axios?: AxiosInstance,
  }

  export const serviceOptions: ServiceOptions = {
  };

  export function getConfigs(method: string, contentType: string, url: string,options: any):IRequestConfig {
    const configs: IRequestConfig = { ...options, method, url };
    configs.headers = {
      ...options.headers,
      'Content-Type': contentType,
    };
    return configs
  }
  `;
}

exports.importAxiosHeader = importAxiosHeader