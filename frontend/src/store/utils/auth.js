import axios from "axios";
import { backendUrl } from "./../../constant";

export const refreshAccessToken = async (func, loginCtx) => {
  const rtoken = loginCtx.RefreshToken;
  loginCtx.setLoading(true);
  try {
    const resp = await axios.get(
      `${backendUrl}/api/v1/user/verifyrefreshtoken`,
      { headers: { Authorization: `Bearer ${rtoken}` } },
    );
    console.log(resp);
    if (
      resp.status === 200 ||
      resp.status === 201 ||
      resp.status === "success" ||
      resp.status === "Success"
    ) {
      loginCtx.setAccessToken(resp.data.AccessToken);
      loginCtx.setRefreshToken(resp.data.RefreshToken);
      setTimeout(() => {
        func(resp.data.AccessToken);
      }, 1000);
    } else {
      alert("Please login again");
    }
  } catch (err) {
    console.log(err);
    alert("Please login again");
  } finally {
    setTimeout(() => {
      loginCtx.setLoading(false);
    }, 500);
  }
};

export const verifyToken = async (token) => {
  try {
    const response = await axios.get(`${backendUrl}/api/v1/users/verifytoken`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response);
    if (response.status === 200) {
      return { isLoggedin: true, name: response.data.name };
    }
  } catch (err) {
    console.log(err);
    return { isLoggedin: false, name: null };
  }
};
