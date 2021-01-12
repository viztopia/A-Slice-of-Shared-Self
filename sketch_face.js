
let startImgIndex = 24;
let imgCount = 1415;
let imgVidArray = [];
let vidArray = [];
let imgWidth = 640;
let imgHeight = 480;

let net;
let netReady = false
let currentFaceKeypoints;
let cam;

let startPlaying = false;
let lastRefreshTime = 0;
let refreshPeriod = 5000;
let matchedImg1, matchedImg2, matchedImg3;
// let bgImg;

let cnv;
let sliceMiddle = true;

function preload() {
  loadJSON('face640x480.json', replaceImgVidArray);
  // bgImg = createImg('bg.jpg');
}

function setup() {
  cnv = createCanvas(imgWidth, imgHeight);
  // cnvDiv = createDiv();
  // cnvDiv.id('center');
  cnv.parent('center');

  pixelDensity(1);

  cam = createCapture(VIDEO);
  cam.size(imgWidth, imgHeight);
  cam.hide();
  loadFace();
  // noLoop();
  background(255);
  textSize(16);
  let title = "A Slice of Shared Self";
  let intro1 = "In a society infiltrated by ubiquitous AI systems, how are we perceived and understood? How do we respond? Are we more connected or more divided? Are we becoming the greatest collective ever, or are we losing the notion of an individual?"
  let intro2 = "Abstracted, generalized, and profiled, the way we're blended in these systems has already reshaped our perception of the world. When phones and webcams become our new mirror, when the reflected us is no longer the real us, how would we confront and live with these polarized/muted fractions of ourselves, and how would we move forward?"
  let intro3 = "Here's a slice of our shared-self in the eyes of an AI, reflected off an algorithmically aligned/mis-aligned collective of webcam feeds, including yours in real-time. Please grant access to the camera, observe, move or hold your positions once in a while (if you want to). Your feed won't be recorded."
  text(title, 240, 50);
  text(intro1, 40, 80, 560, 100);
  text(intro2, 40, 170, 560, 200);
  text(intro3, 40, 290, 560, 200);
  rect(270, 405, 80, 40);
  text("show", 292, 430);
}

function modelReady() {
  select('#status').html('Model Loaded');
}

function imgLoad() {
}



function draw() {
  // background(255, 0, 255);

  if (startPlaying & netReady) {

    estimateFace();

    if (currentFaceKeypoints && matchedImg1) {


      if (millis() > lastRefreshTime + refreshPeriod) {
        matchedImg1 = getMinFace(imgVidArray, currentFaceKeypoints);
        // matchedImg1.vid.stop();
        // matchedImg1.vid.loop();
        // [matchedImg1, matchedImg2] = getMinFace2(imgVidArray, currentFaceKeypoints);

        lastRefreshTime = millis();
        console.log("refreshed matched img");
        if (frameCount % 5 == 0) {
          sliceMiddle = !sliceMiddle;
        }
      }

      // push();
      // translate(width, 0);
      // scale(-1, 1);
      if (!sliceMiddle) {
        // image(matchedImg1.vid, 0, 0, imgWidth, imgHeight / 3, 0, 0, imgWidth, imgHeight / 3);
        image(matchedImg1.vid, 0, imgHeight / 3, imgWidth, imgHeight / 3, 0, imgHeight / 3, imgWidth, imgHeight / 3);
      } else {
        image(matchedImg1.vid, 0, 0, imgWidth, imgHeight / 3, 0, 0, imgWidth, imgHeight / 3);
        image(matchedImg1.vid, 0, imgHeight / 3 * 2, imgWidth, imgHeight / 3, 0, imgHeight / 3 * 2, imgWidth, imgHeight / 3);
      }
      // pop();
      // fill(0);
      // text(frameRate(), 10, 10);

    } else {
      // fill(0);
      background(255);
      textSize(16);
      text("Analyzing webcam...", 240, 200);
      text("This might take a while.", 230, 250);
    }
  }
}

function getMinFace(imgVids, faceKeypoints) {
  if (imgVids.length > 0) {
    let minImg = imgVids[0];
    let minDist = getDist(minImg.keypoints, faceKeypoints);
    imgVidArray.forEach(img => {
      let currentDist = getDist(img.keypoints, faceKeypoints);
      if (currentDist < minDist) {
        minImg = img;
        minDist = currentDist;
      }
    })

    return minImg;
  } else {
    return null;
  }
}

function getMinFace2(imgVids, faceKeypoints) {
  if (imgVids.length > 0) {
    let distArray = [];
    imgVidArray.forEach(img => {
      let currentDist = getDist(img.keypoints, faceKeypoints);
      distArray.push(currentDist);
    })


    let min1 = Math.max.apply(null, distArray); // get the max of the array
    let min1Idx = distArray.indexOf(min1);
    distArray[min1Idx] = -Infinity; // replace max in the array with -infinity
    let min2 = Math.max.apply(null, distArray); // get the new max 
    let min2Idx = distArray.indexOf(min2); // get the new max 
    // distArray[min1Idx] = min1;

    return [imgVids[min1Idx], imgVids[min2Idx]];

  } else {
    return null;
  }
}



function keyPressed() {
  if (key == 'p') {
    console.log("start playing!");
    startPlaying = true;
  } else if (key == 'e') {
    console.log("start estimating face!");

  } else if (key == 'l') {
    // loadJSON('face640x360.json', replaceImgArray);
  }
}


function mousePressed() {
  startPlaying = true;
  console.log(mouseX, mouseY);
  console.log(imgVidArray);
  imgVidArray.forEach((imgVid) => {
    imgVid.vid.loop();
  })
}

function getDist(imgKeypoints, currentKeypoints, keypoints = null) {

  let sum = 0;
  let count = 0;

  // // if (keypoints == null){
  //   for (let i = 0; i < imgKeypoints.length; i++) {
  //     let ptNum = imgKeypoints[i].pt;
  //     let [x, y, z] = currentKeypoints[ptNum];
  //     sum += dist(imgKeypoints[i].x, imgKeypoints[i].y, x, y);
  //     count++;
  //   }
  // } else {
  // }

  for (let i = 0; i < imgKeypoints.length; i++) {
    let ptNum = imgKeypoints[i].pt;
    let [x, y, z] = currentKeypoints[ptNum];
    sum += dist(imgKeypoints[i].x, imgKeypoints[i].y, x, y);
    count++;
  }

  let avgDist = sum / count; //get the averaged
  return avgDist;
}


//------------------------------------Face Model-------------------------------------------

async function loadFace() {
  net = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
    maxFaces: 1
  });

  netReady = true;
}

async function estimateFace() {

  cam.size(imgWidth, imgHeight);
  const predictions = await net.estimateFaces({
    input: cam.elt,
    flipHorizontal: true
  });
  // poses = pose;
  // setTimeout(estimateFace, 25);
  // if (!poses) return;

  if (predictions.length > 0) {

    push();
    translate(width, 0);
    scale(-1, 1);
    image(cam, 0, 0, imgWidth, imgHeight);
    pop();

    for (let i = 0; i < predictions.length; i++) {
      const keypoints = predictions[i].scaledMesh;

      // Log facial keypoints.
      currentFaceKeypoints = keypoints;

      // for (let i = 20; i < 40; i++) {
      //   const [x, y, z] = keypoints[i];

      //   currentFaceKeypoints.push({
      //     x: x,
      //     y: y
      //   });
      //   // console.log(currentFaceKeypoints);
      //   // console.log(`Keypoint ${i}: [${x}, ${y}, ${z}]`);
      //   ellipse(x, y, 10);
      // }
    }


    // console.log("estimated " + faceImg.name);
  }

}

//------------------------------------Load JSON-------------------------------------------

function replaceImgVidArray(faces) {
  imgVidArray = [];


  let keys = Object.keys(faces);
  keys.forEach(k => {

    let newImgName = faces[k].name;
    let newImg = createImg(newImgName, imgLoad);
    newImg.size(imgWidth, imgHeight);
    newImg.hide();
    faces[k].img = newImg;

    let newVidName = faces[k].vidName;
    let newVid = createVideo(newVidName);
    newVid.size(imgWidth, imgHeight);
    // newVid.loop();
    newVid.hide();
    faces[k].vid = newVid;

    imgVidArray.push(faces[k]);

  })

  matchedImg1 = imgVidArray[0];

  console.log("loaded json! Now start playing");
  // console.log(imgArray);

}