import axios from "axios";
import { backendUrl } from "./../../constant";

export const refreshAccessToken = async (func, loginCtx, refreshToken) => {
  const rtoken = refreshToken || loginCtx.RefreshToken;
  if (!rtoken || String(rtoken).split(".").length !== 3) {
    loginCtx.logout();
    return false;
  }
  loginCtx.setLoading(true);
  try {
    const resp = await axios.get(
      `${backendUrl}/api/v1/users/verifyrefreshtoken`,
      { headers: { Authorization: `Bearer ${rtoken}` } },
    );
    if (resp.status === 200 || resp.status === 201) {
      loginCtx.setAccessToken(resp.data.AccessToken);
      loginCtx.setRefreshToken(resp.data.RefreshToken);
      await func(resp.data.AccessToken);
      return true;
    }
  } catch (err) {
    loginCtx.logout();
    return false;
  } finally {
    loginCtx.setLoading(false);
  }
};

export const verifyToken = async (token) => {
  try {
    const response = await axios.get(`${backendUrl}/api/v1/users/verifytoken`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return { isLoggedin: true, name: response.data.name };
    }
  } catch (err) {
    return {
      isLoggedin: false,
      expired:
        err?.response?.data?.message === "jwt expired" ||
        err?.response?.data?.message === "TokenExpiredError",
      name: null,
    };
  }
  return { isLoggedin: false, expired: false, name: null };
};
