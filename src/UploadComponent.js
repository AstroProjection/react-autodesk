import axios from 'axios';
import React from 'react';
import { Redirect } from 'react-router-dom';
const UploadComponent = () => {
  const [file, setFile] = React.useState(null);
  const [urn, setUrn] = React.useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    let formData = new FormData();
    console.dir(file);
    formData.append('fileToUpload', file);
    const res = await axios.post('/api/forge/datamanagement/bucket/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    setUrn(res.data.data);
  };

  if (urn !== '') return <Redirect to={'/viewer/' + urn} />;
  return (
    <main id='main'>
      <h1>Upload a supported file to bucket</h1>
      <form onSubmit={handleSubmit} noValidate>
        <input type='file' name='fileToUpload' onChange={(e) => setFile(e.currentTarget.files[0])} />
        <button type='submit'>Submit</button>
      </form>
      <p></p>
      <p>Supported formats can be found here:</p>
      <p>
        <a
          target='_blank'
          href='https://developer.autodesk.com/en/docs/model-derivative/v2/overview/supported-translations/'
        >
          https://developer.autodesk.com/en/docs/model-derivative/v2/overview/supported-translations/
        </a>
      </p>
    </main>
  );
};

export default UploadComponent;
