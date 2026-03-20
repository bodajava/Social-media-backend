import { redisClient } from "../../db/index.js";

export const revokeTokenKey = ({ userId, jti }) => {
  return `${baseRevokeTokenKey(userId)}::${jti}`
}

export const otpKey = ({ email, subject = "comfirmEmail" } = {}) => {
  return `OTP::User::${email}::${subject}`
}

export const bloockOtpKey = ({ email, subject = "comfirmEmail" } = {}) => {
  return `${otpKey({ email, subject })}::Bloock`
}


export const maxAttempOtp = ({ email, subject = "comfirmEmail" } = {}) => {
  return `${otpKey({ email, subject })}::Maxtrial`
}

export const pendingUserKey = (email) => {
  return `PendingUser::${email}`
}

export const baseRevokeTokenKey = (userId) => {
    return `RevokeToken::${userId.toString()}`
  }

/* SET */
export const set = async ({ key, value, ttl } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);

    if (ttl) {
      return await redisClient.set(key, data, { EX: ttl });
    }

    return await redisClient.set(key, data);
  } catch (error) {
    console.log(`failed in redis set operation ${error}`);
  }
};

/* UPDATE */
export const update = async ({ key, value, ttl } = {}) => {
  try {
    const isExist = await redisClient.exists(key);

    if (!isExist) return 0;

    return await set({ key, value, ttl });
  } catch (error) {
    console.log(`failed in redis update operation ${error}`);
  }
};

/* GET */
export const get = async (key) => {
  try {
    const data = await redisClient.get(key);

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    console.log(`failed in redis get operation ${error}`);
  }
};

/* TTL */
export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log(`failed in redis ttl operation ${error}`);
  }
};

/* EXISTS */
export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log(`failed in redis exists operation ${error}`);
  }
};

/* EXPIRE */
export const expire = async ({ key, ttl } = {}) => {
  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.log(`failed in redis expire operation ${error}`);
  }
};

/* MULTI GET */
export const mget = async (keys = []) => {
  try {
    if (!keys.length) return [];

    const data = await redisClient.mGet(keys);

    return data.map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    });
  } catch (error) {
    console.log(`failed in redis mget operation ${error}`);
  }
};

/* GET KEYS BY PREFIX */
export const keys = async (prefix = "") => {
  try {
    return await redisClient.keys(`${prefix}*`);
  } catch (error) {
    console.log(`failed in redis keys operation ${error}`);
  }
};

/* DELETE KEY */
export const del = async (key) => {
  try {
    return await redisClient.del(key);
  } catch (error) {
    console.log(`failed in redis delete operation ${error}`);
  }
};

/* DELETE MULTIPLE KEYS */
export const deleteKeys = async (keys = []) => {
  try {
    if (!keys.length) return 0;

    return await redisClient.del(keys);
  } catch (error) {
    console.log(`failed in redis delete keys operation ${error}`);
  }
};

/* INCREMENT */
export const incr = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log(`failed in redis incr operation ${error}`);
  }
};

/* DECREMENT */
export const decr = async (key) => {
  try {
    return await redisClient.decr(key);
  } catch (error) {
    console.log(`failed in redis decr operation ${error}`);
  }
};