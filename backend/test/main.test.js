import request from 'supertest';
import server from '../api/index.js';
import { reset } from '../api/service.js';

const postTry = async (path, status, payload, token) => sendTry('post', path, status, payload, token);
const getTry = async (path, status, payload, token) => sendTry('get', path, status, payload, token);
const deleteTry = async (path, status, payload, token) => sendTry('delete', path, status, payload, token);
const putTry = async (path, status, payload, token) => sendTry('put', path, status, payload, token);

const sendTry = async (typeFn, path, status = 200, payload = {}, token = null) => {
  let req = request(server);
  if (typeFn === 'post') {
    req = req.post(path);
  } else if (typeFn === 'get') {
    req = req.get(path);
  } else if (typeFn === 'delete') {
    req = req.delete(path);
  } else if (typeFn === 'put') {
    req = req.put(path);
  }
  if (token !== null) {
    req = req.set('Authorization', `Bearer ${token}`);
  }
  const response = await req.send(payload);
  expect(response.statusCode).toBe(status);
  return response.body;
};

const validToken = async () => {
  const { token } = await postTry('/admin/auth/login', 200, {
    email: 'hayden.smith@unsw.edu.au',
    password: 'bananapie',
  });
  return token;
};

describe('API Integration Tests', () => {

  beforeAll(async () => {
    await reset();  // 清空数据库内容
  });

  /***************************************************************
                        Auth Tests
  ***************************************************************/

  test('Register a new user', async () => {
    const body = await postTry('/admin/auth/register', 200, {
      email: 'hayden.smith@unsw.edu.au',
      password: 'bananapie',
      name: 'Hayden',
    });
    expect(typeof body.token).toBe('string');
  });

  test('Re-registering the same user should fail', async () => {
    await postTry('/admin/auth/register', 400, {
      email: 'hayden.smith@unsw.edu.au',
      password: 'bananapie',
      name: 'Hayden',
    });
  });

  test('Login with correct credentials', async () => {
    const body = await postTry('/admin/auth/login', 200, {
      email: 'hayden.smith@unsw.edu.au',
      password: 'bananapie',
    });
    expect(typeof body.token).toBe('string');
  });

  test('Login with wrong email', async () => {
    await postTry('/admin/auth/login', 400, {
      email: 'wrong@unsw.edu.au',
      password: 'bananapie',
    });
  });

  test('Login with wrong password', async () => {
    await postTry('/admin/auth/login', 400, {
      email: 'hayden.smith@unsw.edu.au',
      password: 'wrongpassword',
    });
  });

  test('Logout with valid token', async () => {
    const token = await validToken();
    const body = await postTry('/admin/auth/logout', 200, {}, token);
    expect(body).toMatchObject({});
  });

  test('Logout without token should fail', async () => {
    await postTry('/admin/auth/logout', 403, {});
  });

  /***************************************************************
                        Store Tests
  ***************************************************************/

  const STORE_1 = {
    name: 'Hayden',
    height: 180,
  };

  test('Initially the store is empty', async () => {
    const body = await getTry('/store', 200, {}, await validToken());
    expect(body.store).toMatchObject({});
  });

  test('Set store data', async () => {
    const res = await putTry('/store', 200, { store: STORE_1 }, await validToken());
    expect(res).toMatchObject({});
  });

  test('Check if store was updated', async () => {
    const body = await getTry('/store', 200, {}, await validToken());
    expect(body.store).toMatchObject(STORE_1);
  });
});