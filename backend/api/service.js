import dotenv from 'dotenv';
dotenv.config();

import AsyncLock from 'async-lock';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { AccessError, InputError } from './error.js';

const MONGO_URL = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URL || !JWT_SECRET) {
  throw new Error('Missing required environment variables');
}

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const lock = new AsyncLock();

const StoreSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: String,
  name: String,
  storeData: Object,
});

const Store = mongoose.model('Store', StoreSchema);

const userLock = (callback) =>
  lock.acquire("userAuthLock", () => {
    return new Promise(callback);
  });

export const getEmailFromAuthorization = async (authorization) => {
  try {
    const token = authorization.replace('Bearer ', '');
    const { email } = jwt.verify(token, JWT_SECRET);
    const user = await Store.findOne({ email });
    if (!user) throw new AccessError('Invalid Token');
    return email;
  } catch (error) {
    throw new AccessError('Invalid token');
  }
};

export const login = (email, password) =>
  userLock((resolve, reject) => {
    Store.findOne({ email }).then((user) => {
      if (user && user.password === password) {
        const token = jwt.sign({ email }, JWT_SECRET, { algorithm: 'HS256' });
        resolve(token);
      } else {
        reject(new InputError('Invalid username or password'));
      }
    });
  });

export const register = (email, password, name) =>
  userLock((resolve, reject) => {
    Store.findOne({ email }).then((existing) => {
      if (existing) {
        return reject(new InputError('Email address already registered'));
      }
      const newUser = new Store({ email, password, name, storeData: {} });
      newUser.save().then(() => {
        const token = jwt.sign({ email }, JWT_SECRET, { algorithm: 'HS256' });
        resolve(token);
      });
    });
  });

export const logout = () =>
  userLock((resolve) => {
    resolve();
  });

export const getStore = (email) =>
  userLock((resolve, reject) => {
    Store.findOne({ email }).then((user) => {
      if (!user) return reject(new AccessError('User not found'));
      resolve(user.storeData || {});
    });
  });

export const setStore = (email, store) =>
  userLock((resolve, reject) => {
    Store.findOneAndUpdate(
      { email },
      { storeData: store },
      { new: true, upsert: false }
    )
      .then(() => resolve())
      .catch((err) => reject(err));
  });