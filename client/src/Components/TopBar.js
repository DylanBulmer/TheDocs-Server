import React from 'react';
import { Link } from 'react-router-dom';
import logoText from '../Images/logoTextWhite.svg'
import logo from '../Images/logoWhite.svg'

const TopBar = () => {

  return (
    <div className="TopBar">
      <Link to="/" style={{position: "absolute", top: 0, left: 0}}>
        <img src={logoText}></img>
        <img src={logo} id="logo" ></img>
      </Link>
      <Link to="/account">Account</Link>
      <Link to="/support">Support</Link>
      <Link to="/docs">Docs</Link>
    </div>
  );
};

export default TopBar;