import React from 'react';
import axios from 'axios';
import { Autodesk, THREE, $, Snap } from './Autodesk';

const viewerRef = React.createRef(null);
const active = React.createRef(null);
const auth_URL = 'https://cif7emufj0.execute-api.us-east-2.amazonaws.com/demo/authCheck';
const ViewerComponent = function (props) {
  const [init, setInit] = React.useState(false);
  const [idArr, setIdArr] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [comment, setComment] = React.useState('');
  const options = {
    env: 'AutodeskProduction',
    api: 'derivativeV2',
    getAccessToken: getForgeToken,
  };
  ////////////////////////// ---------------- /////////////////////
  // var viewerRef.current;
  function initViewer() {
    //delegate the event of CAMERA_CHANGE_EVENT
    viewerRef.current.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, function (rt) {
      //find out all pushpin markups
      var $eles = $("div[id^='mymk']");
      console.log($eles);
      var DOMeles = $eles.get();
      console.log(DOMeles);
      for (var index in DOMeles) {
        // get each DOM element
        var DOMEle = DOMeles[index];
        var divEle = $('#' + DOMEle.id);
        // get out the 3D coordination
        var val = divEle.data('3DData');
        var pushpinModelPt = JSON.parse(val);
        // get the updated screen point
        var screenpoint = viewerRef.current.worldToClient(
          new THREE.Vector3(pushpinModelPt.x, pushpinModelPt.y, pushpinModelPt.z)
        );
        //update the SVG position.
        divEle.css({
          left: screenpoint.x - pushpinModelPt.rad,
          top: screenpoint.y - pushpinModelPt.rad,
        });
      }
      if (active.current) {
        $('#commentsDiv').css({
          top: $('#' + active.current).css('top'),
          left: parseFloat($('#' + active.current).css('left')) + 50 + 'px',
        });
      }
      console.log(active.current);
    });

    //delegate the mouse click event
    $(viewerRef.current.container).bind('click', onMouseClick);
  }
  function isColliding({ x, y }) {
    let viewer_pos = viewerRef.current.container.getBoundingClientRect();
    var $eles = $("div[id^='mymk']");
    var DOMeles = $eles.get();
    for (let elem of DOMeles) {
      const elemRect = $(elem)[0].getBoundingClientRect();
      const rect2 = {
        x: elemRect.left - viewer_pos.x,
        y: elemRect.top - viewer_pos.y,
        height: elemRect.height,
        width: elemRect.width,
      };
      const rect1 = {
        x: x - 14,
        y: y - 14,
        height: elemRect.height,
        width: elemRect.width,
      };
      const cond1 = rect1.x < rect2.x + rect2.width;
      const cond2 = rect1.x + rect1.width > rect2.x;
      const cond3 = rect1.y < rect2.y + rect2.height;
      const cond4 = rect1.y + rect1.height > rect2.y;
      if (cond1 && cond2 && cond3 && cond4) {
        active.current = $(elem).attr('id');
        return true;
      }
    }
    return false;
  }

  function onMouseClick(event) {
    let viewer_pos = viewerRef.current.container.getBoundingClientRect();
    var screenPoint = {
      x: event.clientX - viewer_pos.x,
      y: event.clientY - viewer_pos.y,
    };
    //get the selected 3D position of the object
    //viewer canvas might have offset from the webpage.
    var hitTest = viewerRef.current.impl.hitTest(screenPoint.x, screenPoint.y, true);
    if (hitTest) {
      if (!isColliding(screenPoint))
        drawPushpin({ x: hitTest.intersectPoint.x, y: hitTest.intersectPoint.y, z: hitTest.intersectPoint.z });
      else selectPin();
    }
  }
  //generate a random id for each pushpin markup
  function makeid() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

  function selectPin() {
    if (!active.current) return;
    const cDiv = document.getElementById('commentsDiv');
    const aDiv = document.getElementById(active.current);
    cDiv.style.zIndex = 2;
    cDiv.style.top = aDiv.style.top;
    cDiv.style.left = parseFloat(aDiv.style.left) + 50 + 'px';
  }
  function drawPushpin(pushpinModelPt) {
    //convert 3D position to 2D screen coordination
    var screenpoint = viewerRef.current.worldToClient(
      new THREE.Vector3(pushpinModelPt.x, pushpinModelPt.y, pushpinModelPt.z)
    );
    //build the div container
    var randomId = makeid();
    /// adding id to arr
    active.current = 'mymk' + randomId;
    setIdArr([...idArr, randomId]);
    ///
    var htmlMarker = '<div id="mymk' + randomId + '"></div>';
    var parent = viewerRef.current.container;
    $(parent).append(htmlMarker);
    $('#mymk' + randomId).css({
      'pointer-events': 'none',
      width: '28px',
      height: '28px',
      position: 'absolute',
      overflow: 'hidden',
      boxSizing: 'border-box',
    });
    //build the svg element and draw a circle
    $('#mymk' + randomId).append(`<svg id="mysvg${randomId}" width="28" height="28" viewBox="0 0 28 28"></svg>`);
    var snap = Snap($('#mysvg' + randomId)[0]);
    var rad = 12;
    var circle = snap.paper.circle(14, 14, rad);
    circle.attr({
      fill: '#FF8888',
      fillOpacity: 0.6,
      stroke: '#FF0000',
      strokeWidth: 3,
    });
    //set the position of the SVG
    //adjust to make the circle center is the position of the click point
    var $container = $('#mymk' + randomId);
    $container.css({
      left: screenpoint.x - 14,
      top: screenpoint.y - 14,
    });
    //store 3D point data to the DOM
    var div = $('#mymk' + randomId);
    //add radius info with the 3D data
    pushpinModelPt.rad = 14;
    var storeData = JSON.stringify(pushpinModelPt);
    div.data('3DData', storeData);
  }

  ////////////////////////// ---------------- /////////////////////
  function getForgeToken(callback) {
    //'/api/forge/oauth/public'
    console.log('getting forge token');
    axios
      .get(auth_URL)
      .then((res) => {
        console.log('cb about to init');
        const data = JSON.parse(res.data.body);
        console.log(data);
        callback(data.access_token, data.expires_in);
        ///
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function onDocumentLoadSuccess(doc) {
    // Load the default viewable geometry into the viewer.
    // Using the doc, we have access to the root BubbleNode,
    // which references the root node of a graph that wraps each object from the Manifest JSON.
    var viewable = doc.getRoot().getDefaultGeometry();
    if (viewable) {
      viewerRef.current
        .loadDocumentNode(doc, viewable)
        .then(function (result) {
          console.log('Viewable Loaded!');
          initViewer();
        })
        .catch(function (err) {
          console.log('Viewable failed to load.');
          console.log(err);
        });
    }
  }
  function onDocumentLoadFail(err) {
    console.log(err);
    console.log('failed to load document');
  }

  if (!init)
    Autodesk.Viewing.Initializer(options, function onInitialized() {
      let htmlElement = document.getElementById('viewerDiv');
      if (htmlElement) {
        const config = {
          // extensions: [''],
        };
        viewerRef.current = new Autodesk.Viewing.GuiViewer3D(htmlElement, config);
        setInit(true);
        viewerRef.current.start();
        // let docId = 'urn:' + props.match.params.id;
        // console.log(docId);
        let docId =
          'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bGFoYXB5emZjanZ2d2ZydjUzaGxveW95eDhlamgzZ3VfdHV0b3JpYWxfYnVja2V0L0FsdW0lMjBDYXN0aW5nLnN0ZXA=';
        Autodesk.Viewing.Document.load(docId, onDocumentLoadSuccess, onDocumentLoadFail);
      }
    });
  return (
    <React.Fragment>
      <div style={{ width: '90vw', height: '90vh', position: 'relative', overflow: 'hidden' }}>
        <div
          id='commentsDiv'
          style={{ position: 'absolute', width: '200px', height: '200px', backgroundColor: 'white', zIndex: 0 }}
        >
          <ul>
            {comments.map((comment) => (
              <li key={comment + Math.random()}>{comment}</li>
            ))}
          </ul>
          <input
            type='text'
            onKeyPress={(e) => {
              if (e.nativeEvent.key !== 'Enter') return;
              setComments([...comments, comment]);
              setComment('');
            }}
            onChange={(e) => setComment(e.target.value)}
            value={comment}
          />
        </div>
        <div id='viewerDiv' style={{ position: 'relative', height: '100%', width: '100%' }}></div>
      </div>
    </React.Fragment>
  );
};
export default ViewerComponent;
