import React, { useState, useRef, useContext } from "react";
import classes from "./ForgotPass.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { useParams, Navigate } from "react-router";
import { RiEyeFill, RiEyeOffFill } from "react-icons/ri";
import axios from "axios";
import { backendUrl } from "../../constant.js";
import { useAlert } from "../../store/context/Alert-context.js";
import LoginContext from "../../store/context/loginContext.js";

const ForgotPassConfirmPage = () => {
  const loginctx = useContext(LoginContext);
  const alertCtx = useAlert();
  const { id } = useParams();
  const navigate = useNavigate();
  const [, setCookie] = useCookies(["AccessToken", "RefreshToken"]);
  const passwordref = useRef();
  const Confpasswordref = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [errormsg, setErrormsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  //check if id is valid or not else redirect to error page
  const decodedId = decodeURIComponent(id || "");
  if (!decodedId.startsWith("fpass987-") || !decodedId.includes("@")) {
    return <Navigate to={`/*?error=Not%20Authorised`} />;
  }
  const lastSeparator = decodedId.lastIndexOf("-");
  const emailid = decodedId.slice("fpass987-".length, lastSeparator);
  const code = decodedId.slice(lastSeparator + 1);

  //redirect to login page
  const proceedtoLogin = async (event) => {
    event.preventDefault();
    const passwordEntered = passwordref.current.value;
    const ConfpasswordEntered = Confpasswordref.current.value;

    //check if password and confirm password are entered
    if (passwordEntered.trim().length === 0 || ConfpasswordEntered.trim().length === 0) {
      return setErrormsg("Please provide all the details");
    }

    //check if password and confirm password are same
    if (passwordEntered !== ConfpasswordEntered) {
      return setErrormsg("Passwords do not match");
    }
    if (passwordEntered.length < 8) {
      return setErrormsg("Password must be at least 8 characters long");
    }
    const body = { password: passwordEntered };
    try {
      setErrormsg("");
      setIsLoading(true);
      const resp = await axios.patch(`${backendUrl}/api/v1/users/resetpassword/${code}`, body, { timeout: 30000, });

      setCookie("AccessToken", resp.data.AccessToken, { path: "/", maxAge: 60 * 60 * 24 * 1 * 0.2 }); // 20% of 1 day = 4.8 hours
      setCookie("RefreshToken", resp.data.RefreshToken, { path: "/", maxAge: 60 * 60 * 24 * 1 * 0.6 }); // 60% of 1 day = 14.4 hours
      loginctx.login(resp.data.AccessToken, resp.data.RefreshToken, resp.data.data.user); // login user
      if (resp.data.status === "success") {
        localStorage.removeItem("Passcode");
        localStorage.removeItem("Passcode2");
        alertCtx.showAlert('success', 'Password changed successfully');
      }
      navigate(`/login`); // redirect to login page
      console.log(resp);
    } catch (error) {
      console.log(error);
      if (error?.response?.data?.message) {
        return setErrormsg(error.response.data.message);
      }
      setErrormsg("Something went wrong. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = localStorage.getItem("Passcode2");

  return (
    <>
      <div className={`row d-flex align-items-center ${classes.container}`}>
        {!isValid && (<p className="h1 d-flex align-items-center justify-content-center">Not Authorised</p>)}

        <AnimatePresence>
          {isValid === "1" && (
            <motion.form className={`border-bottom-0 ${classes.form}`} onSubmit={proceedtoLogin}>

              <p className="h2" >Forgot Password</p>
              <p>Enter new Password for {emailid}</p>

              {/* Spacing */}
              <div style={{ minHeight: '50px' }} />
              {!isLoading && <p className={classes.loading}> {errormsg}</p>}

              <div className="input-group mb-3">
                <input type={showPassword ? "text" : "password"} placeholder={!showPassword ? " · · · · · · · ·  " : "New-Password"}
                  className="form-control shadow-none" id="code" autoComplete="on" ref={passwordref} pattern=".{8,}"
                  title="Password must be at least 8 characters long" required />
                <span className="input-group-text" onClick={() => { setShowPassword(!showPassword); }}>
                  {showPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                </span>
              </div>

              <div className="input-group mb-3">
                <input type={showPassword2 ? "text" : "password"} placeholder={!showPassword2 ? " · · · · · · · ·  " : "Confirm-Password"}
                  className="form-control shadow-none" id="code2" ref={Confpasswordref} pattern=".{8,}"
                  title="Password must be at least 8 characters long" required />
                <span className="input-group-text" onClick={() => { setShowPassword2(!showPassword2); }}>
                  {showPassword2 ? <RiEyeOffFill /> : <RiEyeFill />}
                </span>
              </div>

              {/* Spacing */}
              <div style={{ minHeight: '50px' }} />

              <div className={classes.buttons}>
                <button className="btn btn-primary w-100" type="submit" disabled={isLoading}
                  style={{ height: isLoading ? "" : "50px" }}>
                  {isLoading ? (<div className="spinner-border text-danger" role="status" />) : "Confirm Password"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ForgotPassConfirmPage;
