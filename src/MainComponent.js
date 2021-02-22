import React from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';
const MainComponent = () => {
  const [auth, setAuth] = React.useState(false);
  const onClick = async () => {
    try {
      const res = await axios.get('/api/forge/oauth');
      setAuth(true);
    } catch (error) {}
  };

  if (auth) {
    return <Redirect to={`/upload`} />;
  }
  return (
    <main id='main'>
      <button type='button' onClick={onClick}>
        Authorize me!
      </button>
    </main>
  );
};

export default MainComponent;
