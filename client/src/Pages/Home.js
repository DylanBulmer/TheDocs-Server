import React from 'react';
import { TopBar, Footer } from '../Components';
import header from '../Images/header.svg';
import '../Styles/Base.css';
import '../Styles/Home.css';

class Home extends React.Component {

  render() {
    return (
      <div className="App">
        <TopBar/>
        <header className="Header">
          <img src={header} className="App-logo" alt="logo" />
        </header>
        <div className="App-body" >
          <div className="App-body-content">
            <h3>Project Description:</h3>
            <p>Throughout my work experience, I have found that there is a lot of documentation in everything that is going on 
            including lists upon lists of objects and its location or documentation on how to work a piece of software. 
            I have also found that because there is so much documentation, it can be hard to keep it organized. 
            The Docs is an extensive research project and development process to make sure the desktop application is clear
            on how to use it without needing a lot of training and three well developed and secure servers. Each server has 
            its own function and purpose. The first server will be a general web-interface that will allow admin users to 
            register and manage their organization’s preferences, data and user’s accounts. The second server will contain 
            all of the API calls (application protocol interface) for both the desktop application and the web-interface as 
            well as managing files that are uploaded to the system. Finally, the third server will be optional for organizations 
            which will be used to store their files in their own secure location which will allow them to have more control of 
            how secure they want their data.</p>
            <h3>Main Goal:</h3>
            <p>The goal for this project is not to organize and manage documentation, but to do this in a secure way. 
            I want people to know that everything about the servers that I’m developing will be secure to hopefully create 
            a bond of trust. To start, I want to notice that all data is going to be transported through encrypted transport 
            tunnels. Data will not just pass through with a HTTPS certificate, but it will also be encrypted and decrypted 
            between the server and the client and vise-versa.</p>
            <h3>Minor Goals:</h3>
            <ul>
              <li>Be able to upload, manage and organize documentation.</li>
              <li>Accept all forms of documentation from PDF and plain text documents to Microsoft Office documents.</li>
            </ul>
          </div>
          <Footer/>
        </div>
      </div>
    );
  }
}

export { Home as default };