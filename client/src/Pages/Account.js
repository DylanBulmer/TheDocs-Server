import React from 'react';
import { Link } from 'react-router-dom';
import { TopBar, Footer } from '../Components';
import '../Styles/Base.css';
import '../Styles/Home.css';

class Home extends React.Component {

  render() {
    return (
      <div className="App">
        <TopBar/>
        
        <Footer/>
      </div>
    );
  }
}

export { Home as default };