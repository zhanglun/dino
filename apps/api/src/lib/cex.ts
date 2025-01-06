import https from 'https';
import crypto from 'crypto';
import querystring from 'querystring';

// 定义 API 凭证和项目 ID
const api_config = {
  "api_key": process.env.API_KEY,
  "secret_key": process.env.SECRET_KEY,
  "passphrase": process.env.PASSPHRASE,
};

function preHash(timestamp, method, request_path, params) {
  // 根据字符串和参数创建预签名
  let query_string = '';
  if (method === 'GET' && params) {
    query_string = '?' + querystring.stringify(params);
  }
  if (method === 'POST' && params) {
    query_string = JSON.stringify(params);
  }
  return timestamp + method + request_path + query_string;
}

function sign(message, secret_key) {
  // 使用 HMAC-SHA256 对预签名字符串进行签名
  const hmac = crypto.createHmac('sha256', secret_key);
  hmac.update(message);
  return hmac.digest('base64');
}

function createSignature(method, request_path, params) {
  // 获取 ISO 8601 格式时间戳
  const timestamp = new Date().toISOString().slice(0, -5) + 'Z';
  // 生成签名
  const message = preHash(timestamp, method, request_path, params);
  const signature = sign(message, api_config['secret_key']);
  return { signature, timestamp };
}

export async function sendGetRequest(request_path, params) {
  // 生成签名
  const { signature, timestamp } = createSignature("GET", request_path, params);

  // 生成请求头
  const headers = {
    'OK-ACCESS-KEY': api_config['api_key'],
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': api_config['passphrase'],
    // 'OK-ACCESS-PROJECT': api_config['project'] // 这仅适用于 WaaS APIs
  };

  const options = {
    hostname: 'www.okx.com',
    path: request_path + (params ? `?${querystring.stringify(params)}` : ''),
    method: 'GET',
    headers: headers
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(data);
    });
  });

  req.end();
}

export async function sendPostRequest(request_path, params) {
  // 生成签名
  const { signature, timestamp } = createSignature("POST", request_path, params);

  // 生成请求头
  const headers = {
    'OK-ACCESS-KEY': api_config['api_key'],
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': api_config['passphrase'],
    // 'OK-ACCESS-PROJECT': api_config['project'], // 这仅适用于 WaaS APIs
    'Content-Type': 'application/json' // POST 请求需要加上这个头部
  };

  const options = {
    hostname: 'www.okx.com',
    path: request_path,
    method: 'POST',
    headers: headers
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(data);
    });
  });

  if (params) {
    req.write(JSON.stringify(params));
  }

  req.end();
}

