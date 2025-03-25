import React from 'react';
import { Boxicons } from 'boxicons';

function LoginForm() {
  return (
    <div className="form-box login">
      <form>
        <h1>Login</h1>
        <div className="input-box">
          <input type="text" placeholder="Username" required />
          <i className='bx bxs-user'></i>
        </div>
        <div className="input-box">
          <input type="password" placeholder="Password" required />
          <i className='bx bxs-lock-alt'></i>
        </div>
        <div className="forgot-link">
          <a href="#">Forgot password?</a>
        </div>
        <button type="submit" className="btn">Login</button>
        <p>or Login with Social Platforms</p>
        <div className="social-icons">
          <a href="#"><i className='bx bxl-google'></i></a>
          <a href="#"><i className='bx bxl-facebook'></i></a>
          <a href="#"><i className='bx bxl-github'></i></a>
          <a href="#"><i className='bx bxl-linkedin'></i></a>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;