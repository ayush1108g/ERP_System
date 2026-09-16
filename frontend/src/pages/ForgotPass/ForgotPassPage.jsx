import axios from "axios";
import classes from "./ForgotPass.module.css";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../../constant.js";

const ForgotPassPage = () => {
  const navigate = useNavigate();
  const emailInputRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [errormsg, setErrormsg] = useState("");

  //redirect to login page
  const loginpageHandler = () => {
    navigate(-1);
  };

  //function to handle reset password
  const proceedtoResethandler = async (event) => {
    event.preventDefault();
    const emailEntered = emailInputRef.current.value; //get email entered by user

    //check if email is entered
    if (emailEntered.trim().length === 0) {
      return setErrormsg("Please provide all the details");
    }
    const body = { email: emailEntered };
    try {
      setIsLoading(true);
      const resp = await axios.post(`${backendUrl}/api/v1/users/forgotpassword`, body, { timeout: 30000 });

      //if email is found
      if (resp.data.status === "success") {
        setErrormsg(`Password reset email sent to ${emailEntered}`);
        localStorage.setItem("Passcode", "1");
        navigate(`fpass987-${emailEntered}`);
      }
    } catch (error) {
      if (error.code === "ERR_BAD_REQUEST") {
        setErrormsg("Email not found");
      } else {
        setErrormsg("Something went wrong. Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className={`row d-flex align-items-center ${classes.container}`}>
        <motion.form transition={{ duration: 0.5, ease: "easeInOut" }} className={`border-bottom-0 ${classes.form}`} onSubmit={proceedtoResethandler}>
          <p className="h2">Forgot Password</p>
          <p>Enter your email to reset your password.</p>
          {!isLoading && <p className={classes.loading}> {errormsg}</p>}

          {/* Spacing */}
          <div style={{ minHeight: '50px' }} />

          <div className="input-group mb-3">
            <input className="form-control shadow-none" type="email" id="email" autoComplete="on" placeholder="email-id" ref={emailInputRef}
              title="Please enter a valid email address in the format user@example.com" required />
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
            <button onClick={loginpageHandler} className={"small font-monospace text-center row text-dark " + classes.signin}
              style={{ backgroundColor: 'transparent', border: 'none', fontWeight: 'bold' }}>
              Back to Login?
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};
export default ForgotPassPage;
