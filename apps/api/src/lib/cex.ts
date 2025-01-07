import crypto from "crypto";
import querystring from "querystring";
import axios from "axios";

axios.interceptors.response.use(function (response) {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  
  return response.data;
  return response;
}, function (error) {
  console.log("🚀 ~ file: cex.ts:10 ~ (error:", error)
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.resolve({
    data: error.response.data
  })
});

interface OKXAPIOptions {
  method: string;
  headers: {
    "OK-ACCESS-KEY": string;
    "OK-ACCESS-SIGN": string;
    "OK-ACCESS-TIMESTAMP": string;
    "OK-ACCESS-PASSPHRASE": string;
    "OK-ACCESS-PROJECT": string;
    "Content-Type"?: string;
  };
}

// 定义 API 凭证和项目 ID
const api_config = {
  api_key: process.env.API_KEY,
  secret_key: process.env.SECRET_KEY,
  passphrase: process.env.PASSPHRASE,
  access_project: process.env.ACCESS_PROJECT,
};

function preHash(timestamp, method, request_path, params) {
  // 根据字符串和参数创建预签名
  let query_string = "";
  if (method === "GET" && params) {
    query_string = "?" + querystring.stringify(params);
  }
  if (method === "POST" && params) {
    query_string = JSON.stringify(params);
  }
  return timestamp + method + request_path + query_string;
}

function sign(message, secret_key) {
  // 使用 HMAC-SHA256 对预签名字符串进行签名
  const hmac = crypto.createHmac("sha256", secret_key);
  hmac.update(message);
  return hmac.digest("base64");
}

function createSignature(method, request_path, params) {
  // 获取 ISO 8601 格式时间戳
  const timestamp = new Date().toISOString().slice(0, -5) + "Z";
  // 生成签名
  const message = preHash(timestamp, method, request_path, params);
  const signature = sign(message, api_config["secret_key"]);
  return { signature, timestamp };
}

export async function sendGetRequest(request_path: string, params?: any) {
  // 生成签名
  const { signature, timestamp } = createSignature("GET", request_path, params);

  const options: OKXAPIOptions = {
    method: "GET",
    headers: {
      "OK-ACCESS-KEY": api_config["api_key"] as string,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": api_config["passphrase"] as string,
      "OK-ACCESS-PROJECT": api_config['access_project'] as string,
      "Content-Type": "application/json",
    },
  };

  const url = `https://www.okx.com${request_path}${
    params ? `?${querystring.stringify(params)}` : ""
  }`;

  return axios.get(url, options);
}

export async function sendPostRequest(request_path, params) {
  // 生成签名
  const { signature, timestamp } = createSignature(
    "POST",
    request_path,
    params
  );

  const options: OKXAPIOptions = {
    method: "POST",
    headers: {
      "OK-ACCESS-KEY": api_config["api_key"] as string,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": api_config["passphrase"] as string,
      "OK-ACCESS-PROJECT": api_config['access_project'] as string,
      "Content-Type": "application/json",
    },
  };

  const url = `https://www.okx.com${request_path}`;

  return axios.post(url, params, options);
}
