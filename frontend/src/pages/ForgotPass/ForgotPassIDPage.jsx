import React, { useState, useRef } from "react";
import classes from "./ForgotPass.module.css";
import { useNavigate } from "react-router-dom";
import { Navigate, useParams } from "react-router";
import { motion } from "framer-motion";
import axios from "axios";
import { backendUrl } from "../../constant.js";

const ForgotPassIDPage = () => {
  const passwordref = useRef();
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errormsg, setErrormsg] = useState("");

  //check if id is valid or not else redirect to error page
  if (!id.includes('-') || id.split("-").length !== 2 || !id.includes('@')) {
    return <Navigate to={`/*?error=Not%20Authorised`} />;
  }
  const emailid = id.split("-")[1];

  //redirect to login page
  const loginpageHandler = () => {
    navigate(-2);
  };

  //function to handle reset password code
  const proceedtoConfirmhandler = async (event) => {
    event.preventDefault();
    const passwordEntered = passwordref.current.value;

    //check if code is entered
    if (passwordEntered.trim().length === 0) {
      return setErrormsg("Please provide all the details");
    }
    const body = { code: passwordEntered };

    try {
      setErrormsg("");
      setIsLoading(true);
      const resp = await axios.post(`${backendUrl}/api/v1/users/verifycode`, body, { timeout: 30000, });

      //if code is correct
      if (resp.data.status === "success") {
        localStorage.setItem("Passcode2", "1");
        navigate(`/login/forgotpassword/fpass987-${emailid}-${body.code}/confirm`);
      }
    } catch (error) {
      if (error?.response?.data?.message) setErrormsg(error.response.data.message);
      else setErrormsg("Something went wrong. Please try again");
    }
    setIsLoading(false);
  };
  const isValid = localStorage.getItem("Passcode");

  return (
    <>
      <div className={`row d-flex align-items-center ${classes.container}`}>
        {!isValid && <p className="h1 d-flex align-items-center justify-content-center">Not Authorised</p>}
        {isValid === "1" && <motion.form className={`border-bottom-0 ${classes.form}`} onSubmit={proceedtoConfirmhandler}>

          <p className="h2">Forgot Password</p>
          <p>Password reset email sent to {emailid}</p>

          {/* Spacing */}
          <div style={{ minHeight: '50px' }} />

          {!isLoading && <p className={classes.loading}> {errormsg}</p>}

          <div className="input-group mb-3">
            <input className="form-control shadow-none" type="text" id="code" autoComplete="on" placeholder="Reset-Code" ref={passwordref}
              title="Please enter a code sent to your email address" required />
          </div>

          {/* Spacing */}
          <div style={{ minHeight: '50px' }} />

          <div className={classes.buttons}>
            <button className="btn btn-primary w-100" type="submit" disabled={isLoading}
              style={{ height: isLoading ? "" : "50px" }}>
              {isLoading ? (<div className="spinner-border text-danger" role="status" />) : "Proceed"}
            </button>
          </div>

          <div className={classes.pagechange}>
            <button onClick={loginpageHandler} className="small font-monospace text-center row text-dark "
              style={{ backgroundColor: "transparent", border: "none", fontWeight: "bold" }}>
              Back to Login?
            </button>
          </div>
        </motion.form>}
      </div>
    </>
  );
};
export default ForgotPassIDPage;
