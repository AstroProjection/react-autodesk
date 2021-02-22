const express = require('express');
const app = express();
const config = require('./config');
const Axios = require('axios');
const path = require('path');
const cors = require('cors');
app.use(express.json());

// keys
const bucketKey = config.client_id.toLowerCase() + '_tutorial_bucket'; // Prefix with your ID so the bucket key is unique across all buckets on all other accounts
const policyKey = 'transient'; // Expires in 24hr
var FORGE_CLIENT_ID = config.client_id;
var FORGE_CLIENT_SECRET = config.client_secret;

var access_token = '';
var scopes = 'data:read data:write data:create bucket:create bucket:read';
const querystring = require('querystring');
// app.use(cors());
app.use((req, res, next) => {
  console.log('%s %s', req.method, req.url);
  next();
});
// // Route /api/forge/oauth
app.get('/api/forge/oauth', function (req, res) {
  Axios({
    method: 'POST',
    url: 'https://developer.api.autodesk.com/authentication/v1/authenticate',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: querystring.stringify({
      client_id: FORGE_CLIENT_ID,
      client_secret: FORGE_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: scopes,
    }),
  })
    .then(function (response) {
      // Success
      access_token = response.data.access_token;
      // console.log(response);
      res.redirect('/api/forge/datamanagement/bucket/create');
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send('Failed to authenticate');
    });
});

// Route /api/forge/oauth/public
app.get('/api/forge/oauth/public', function (req, res) {
  // Limit public token to Viewer read only
  const bucketKey = process.env.FORGE_CLIENT_ID + '_tutorial_bucket';
  const policyKey = 'transient'; // Expires in 24hr

  const FORGE_CLIENT_ID = process.env.FORGE_CLIENT_ID || 'lAhAPYZfcJvVwfrv53hloYOYX8ejH3GU';
  const FORGE_CLIENT_SECRET = process.env.FORGE_CLIENT_SECRET || 'DPT2srGtGVll4SzW';
  Axios({
    method: 'POST',
    url: 'https://developer.api.autodesk.com/authentication/v1/authenticate',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: querystring.stringify({
      client_id: FORGE_CLIENT_ID,
      client_secret: FORGE_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'viewables:read',
    }),
  })
    .then(function (response) {
      // Success
      // console.log(response);
      console.log(response.data);
      res.json({ access_token: response.data.access_token, expires_in: response.data.expires_in });
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.status(500).json(error);
    });
});

// Route /api/forge/datamanagement/bucket/create
app.get('/api/forge/datamanagement/bucket/create', function (req, res) {
  // Create an application shared bucket using access token from previous route
  // We will use this bucket for storing all files in this tutorial
  Axios({
    method: 'POST',
    url: 'https://developer.api.autodesk.com/oss/v2/buckets',
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + access_token,
    },
    data: JSON.stringify({
      bucketKey: bucketKey,
      policyKey: policyKey,
    }),
  })
    .then(function (response) {
      // Success
      console.log(response);
      res.redirect('/api/forge/datamanagement/bucket/detail');
    })
    .catch(function (error) {
      if (error.response && error.response.status == 409) {
        console.log('Bucket already exists, skip creation.');
        return res.redirect('/api/forge/datamanagement/bucket/detail');
      }
      // Failed
      console.log(error);
      res.send('Failed to create a new bucket');
    });
});

// Route /api/forge/datamanagement/bucket/detail
app.get('/api/forge/datamanagement/bucket/detail', function (req, res) {
  Axios({
    method: 'GET',
    url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/details',
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
  })
    .then(function (response) {
      // Success
      // console.log(response);
      console.log(access_token);
      res.status(200).json({ data: response.data, type: 1 });
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send('Failed to verify the new bucket');
    });
});

// For converting the source into a Base64-Encoded string
var Buffer = require('buffer').Buffer;
String.prototype.toBase64 = function () {
  // Buffer is part of Node.js to enable interaction with octet streams in TCP streams,
  // file system operations, and other contexts.
  return new Buffer.from(this).toString('base64');
};

var multer = require('multer'); // To handle file upload
var upload = multer({ dest: 'tmp/' }); // Save file into local /tmp folder

// Route /api/forge/datamanagement/bucket/upload
app.post('/api/forge/datamanagement/bucket/upload', upload.single('fileToUpload'), function (req, res) {
  var fs = require('fs'); // Node.js File system for reading files
  fs.readFile(req.file.path, function (err, filecontent) {
    Axios({
      method: 'PUT',
      url:
        'https://developer.api.autodesk.com/oss/v2/buckets/' +
        encodeURIComponent(bucketKey) +
        '/objects/' +
        encodeURIComponent(req.file.originalname),
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Disposition': req.file.originalname,
        'Content-Length': filecontent.length,
      },
      data: filecontent,
    })
      .then(function (response) {
        // Success
        // console.log(response);
        var urn = response.data.objectId.toBase64();
        // res.redirect('/api/forge/modelderivative/' + urn);
        var format_type = 'svf';
        var format_views = ['2d', '3d'];
        Axios({
          method: 'POST',
          url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + access_token,
          },
          data: JSON.stringify({
            input: {
              urn: urn,
            },
            output: {
              formats: [
                {
                  type: format_type,
                  views: format_views,
                },
              ],
            },
          }),
        })
          .then(function (response) {
            // Success
            console.log('successful modelderivative');
            res.status(200).send({ data: urn });
            // res.redirect('/viewer.html?urn=' + urn);
          })
          .catch(function (error) {
            // Failed
            console.log(error);
            res.send('Error at Model Derivative job.');
          });
      })
      .catch(function (error) {
        // Failed
        console.log(error);
        res.send('Failed to create a new object in the bucket');
      });
  });
});

// Route /api/forge/modelderivative
app.get('/api/forge/modelderivative/:urn', function (req, res) {
  var urn = req.params.urn;
  var format_type = 'svf';
  var format_views = ['2d', '3d'];
  Axios({
    method: 'POST',
    url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + access_token,
    },
    data: JSON.stringify({
      input: {
        urn: urn,
      },
      output: {
        formats: [
          {
            type: format_type,
            views: format_views,
          },
        ],
      },
    }),
  })
    .then(function (response) {
      // Success
      // console.log(response);
      console.log('successful modelderivative');
      res.redirect('/viewer.html?urn=' + urn);
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send('Error at Model Derivative job.');
    });
});

// app.use(express.static('../build'));
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
// });

app.listen(5000, () => {
  console.log('listening on port 5000');
});
