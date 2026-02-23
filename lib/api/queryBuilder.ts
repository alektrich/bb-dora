export interface IBaseQuery {
  sort?: string;
  limit?: number;
  query?: string;
}

export const queryStringBuilder = (url: string, options: IBaseQuery) => {
  const { limit, sort, query } = options;

  if (limit) {
    url = `${url}pagelen=${limit}&`;
  }

  if (sort) {
    url = `${url}sort=${sort}&`;
  }

  if (query) {
    url = `${url}${query}`;
  }

  return url;
};
