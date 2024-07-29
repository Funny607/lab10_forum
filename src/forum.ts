import HTTPError from 'http-errors';
import request, { HttpVerb, Response } from 'sync-request';

// Replace this with your deployed URL
const DEPLOYED_URL = 'https://z5508595lab10-forum.vercel.app';

const parseResponse = (res: Response, path: string) => {
  let caughtError = 'Unknown error';
  const body = res.body.toString();
  try {
    const jsonBody = JSON.parse(body);
    if ('error' in jsonBody && ![400].includes(res.statusCode)) {
      caughtError = `Returned error object with status code ${res.statusCode}`;
    } else {
      return jsonBody;
    }
  } catch (e: any) {
    caughtError = e.message;
  }
  const ret = {
    testName: expect.getState().currentTestName,
    returnedBody: body,
    statusCode: res.statusCode,
    caughtError,
  };
  console.log(`Logging Error:`, ret);
  return ret;
};

const requestHelper = (method: HttpVerb, path: string, payload: object) => {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method)) {
    qs = payload;
  } else {
    json = payload;
  }
  const res = request(method, DEPLOYED_URL + path, { qs, json, timeout: 20000 });
  return parseResponse(res, path);
};

export const DATABASE_FILE = 'database.json';

interface Post {
  postId: number;
  sender: string;
  title: string;
  content: string;
  timeSent: number;
}

interface Comment {
  commentId: number;
  postId: number;
  sender: string;
  comment: string;
  timeSent: number;
}

interface Data {
  posts: Post[];
  comments: Comment[];
}

export const getData = async (): Promise<Data> => {
  try {
    const res = await requestHelper('GET', '/data', {});
    console.log(`Data retrieved: ${JSON.stringify(res.data)}`); // 添加日志记录
    return res.data || { posts: [], comments: [] };
  } catch (e) {
    console.error(`Error retrieving data: ${e.message}`); // 添加错误日志
    return { posts: [], comments: [] };
  }
};

export const setData = async (newData: Data) => {
  await requestHelper('PUT', '/data', newData);
  console.log(`Data set: ${JSON.stringify(newData)}`); // 添加日志记录
};

const getTimeStamp = () => Math.floor(Date.now() / 1000);

const checkLength = (label: string, inputString: string, minLength: number, maxLength: number) => {
  if (!inputString || inputString.length < minLength || inputString.length > maxLength) {
    throw HTTPError(400,
      `For our reference solution, we have restricted the length of '${label}'` +
      ` to be between '${minLength}' and '${maxLength}' characters. However, you` +
      ' do not need to do this and should instead follow the specification!'
    );
  }
};

const checkValidPostDetails = (sender: string, title: string, content: string) => {
  checkLength('sender', sender, 1, 20);
  checkLength('title', title, 1, 20);
  checkLength('content', content, 1, 250);
};

export async function postCreate(sender: string, title: string, content: string) {
  checkValidPostDetails(sender, title, content);
  const data = requestHelper('GET', '/data', {});
  const postId = data.posts.length * 2 + 2041;
  data.posts.push({ postId, sender, title, content, timeSent: getTimeStamp() });
  await setData(data);
  console.log(`Post created: ${JSON.stringify(data.posts[data.posts.length - 1])}`); 
  return { postId }; 
}

export async function postsList() {
  const posts = requestHelper('GET', '/data', {}).posts
    .map(p => ({
      postId: p.postId,
      sender: p.sender,
      title: p.title,
      timeSent: p.timeSent,
    }))
    .sort((p1, p2) => p2.postId - p1.postId);
  console.log(`Posts list: ${JSON.stringify(posts)}`); 
  return { posts };
}

export const clear = async () => {
  const data = await getData();
  data.posts = [];
  data.comments = [];
  await setData(data);
  console.log(`Data cleared: ${JSON.stringify(data)}`); 
  return {};
};
