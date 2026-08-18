import axiosClient from "./axiosClient";

export const getApi = (url, params = {}) => {
  return axiosClient.get(url, { params });
};

export const postApi = (url, data) => {
  return axiosClient.post(url, data);
};

export const putApi = (url, data) => {
  return axiosClient.put(url, data);
};

export const deleteApi = url => {
  return axiosClient.delete(url);
};