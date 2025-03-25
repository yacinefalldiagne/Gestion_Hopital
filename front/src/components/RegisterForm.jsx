import React from 'react';

function RegisterForm() {
  return (
    <div className="form-box register">
      <form>
        <h1>Registration</h1>
        <div className="input-box">
          <input type="text" placeholder="Username" required />
          <i className='bx bxs-user'></i>
        </div>
        <div className="input-box">
          <input type="email" placeholder="Email" required />
          <i className='bx bxs-envelope'></i>
        </div>
        <div className="input-box">
          <input type="password" placeholder="Password" required />
          <i className='bx bxs-lock-alt'></i>
        </div>
        <button type="submit" className="btn">Register</button>
        <p>or Register with Social Platforms</p>
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

export default RegisterForm;