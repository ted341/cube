const log = new URL('https://script.google.com/macros/s/AKfycbxsvNzRf4sXFbgCZrovJNipy9rK3rYdcN5_o5PQJSrcA5DN985M/exec');
const bgname = ['darksalmon','tomato','orange','palegreen','dodgerblue','mediumseagreen','slateblue','violet']
const bghex = ['#e9967a','#ff6347','#ffa500','#98fb98','#1e90ff','#3cb371','#6a5acd','#ee82ee']
const top3 = [0, 3, 8, 1, 2, 7, 4, 5, 6], top4 = [0, 3, 8, 15, 1, 2, 7, 14, 4, 5, 6, 13, 9, 10, 11, 12],
      top5 = [0, 3, 8, 15, 24, 1, 2, 7, 14, 23, 4, 5, 6, 13, 22, 9, 10, 11, 12, 21, 16, 17, 18, 19, 20];

var col, toplist;
function createBoard(){

  toplist = []; // buffer
  arr = [];

  col = Array(size*2);
  for (let i = 0; i < size; i++){
    col[i] = i*2 + 1;
    col[i + size] = size*2;
  }

  var t = document.getElementById("TopFace"),
      l = document.getElementById("LeftFace"),
      r = document.getElementById("RightFace");

  // create blank element of board
  for (let i = 0; i < size*2; i++){
    for (let j = 0; j < col[i]; j++){

      let newel = document.createElement('div');

      newel.id = i*size*2+j;
      newel.className = "square";
      newel.style.backgroundColor = 'white';
      newel.style.height = newel.style.width = String(150/size) + "px";
      newel.addEventListener('click', changeColor, false);

      if (i < size) toplist.push(newel);
      else if (j < size) l.appendChild(newel);
      else r.appendChild(newel);
    }
  }

  for (let i = 0; i < toplist.length; i++)
    switch (size){ // raarrange top face element
      case 3: t.appendChild(toplist[top3[i]]); break;
      case 4: t.appendChild(toplist[top4[i]]); break;
      case 5: t.appendChild(toplist[top5[i]]); break;
    }

  fetchBoard().then(q => {
    console.log(q);
    pass  = Array(cnum).fill(false);
    spath = new Array(cnum); // shortest path container
    for (let i = 0; i < cnum; i++) spath[i] = [];
  })

  setBoardStyle();
  constructEdgeList();
}

function destroyBoard(){

  if (size === undefined) return;

  var top = document.getElementById("TopFace"),
      left = document.getElementById("LeftFace"),
      right = document.getElementById("RightFace");

  var topElement = document.querySelectorAll('#TopFace .square'),
      leftElement = document.querySelectorAll('#LeftFace .square'),
      rightElement = document.querySelectorAll('#RightFace .square');

  for (let i = 0; i < size**2; i++){
    top.removeChild(topElement[i]);
    left.removeChild(leftElement[i]);
    right.removeChild(rightElement[i]);
  }
}

var complete;
function resetBoard(){

  if (complete !== undefined && complete) return;

  var el = document.getElementsByClassName("square");
  for (let i = 0; i < el.length; i++){
    let idx = arr.indexOf(parseInt(el[i].id));
    if (idx > -1) el[i].style.backgroundColor = bgname[Math.floor(idx/2)];
    else el[i].style.backgroundColor = "white";
    el[i].style.borderColor = "black";
  }
}

function generateBoard(){
  // randomly pick odds
  while(arr.length < cnum*2){

    let a = Math.floor(Math.random()*size*2),
        b = Math.floor(Math.random()*col[a]),
        c = a*size*2+b;

    if(arr.indexOf(c) > -1) continue;
    arr.push(c);
    setOddStyle(c);
  }
}

var cnum, arr; // arr: list of odds
async function fetchBoard(){

  try {
    var res = await fetch('data/' + String(size) + '.json');
    var board = await res.json();
  } catch(e){ return Promise.reject(e); }

  var index = Math.floor(Math.random()*Object.keys(board).length);
  var pairs = board[index].pairs;
  cnum = parseInt(board[index].color);

  for (let i = 0; i < pairs.length; i++){
    let id = parseInt(pairs[i][0])*size*2+parseInt(pairs[i][1]);
    arr.push(id);
    setOddStyle(id);
  }

  return Promise.resolve(board[index]);
}

function setOddStyle(id){
  let img = 'url("data/frame.png")';
  let e = document.getElementById(id).style;
  e.backgroundImage = img;
  e.backgroundPosition = "center";
  e.backgroundRepeat = "no-repeat";
  e.backgroundColor = bgname[Math.floor((arr.length-1)/2)];

  let len = String(120/size) + "px";
  e.backgroundSize = len + " " + len;
}

function setBoardStyle(){

  var t = document.getElementById("TopFace").style,
      l = document.getElementById("LeftFace").style,
      r = document.getElementById("RightFace").style;
  var trans = "rotate(90deg) translate(60px,-168px) \
               skew(30deg,-60deg) scale(0.58, 1)";

  switch(size){
    case 3:
      t.height = t.width = '162px';
      r.height = r.width = '162px';
      l.height = l.width = '162px';

      t.transform = trans;
      r.transform = "translate(-89px,26px)";
      l.transform = "translate(87px,26px)";
      break;
    case 4:
      t.height = t.width = '168px';
      r.height = r.width = '168px';
      l.height = l.width = '168px';

      t.transform = trans;
      r.transform = "translate(-79px, 22px)";
      l.transform = "translate(87px, 22px)";
      break;
    case 5:
      t.height = t.width = '170px';
      r.height = r.width = '170px';
      l.height = l.width = '170px';

      t.transform = trans;
      r.transform = "translate(-77px,24px)";
      l.transform = "translate(83px,24px)";
      break;
  }

  r.transform += "skew(0deg,-30deg)";
  l.transform += "skew(0deg,30deg)";
}

var edge;
function constructEdgeList(){

  var dsize = size*2;
  edge = Array(dsize**2);

  for (let i = 0; i < dsize**2; i++)
    edge[i] = [];

  for (let i = 1; i < dsize; i++){ // horizontal
    for (let j = 0; j < Math.floor(col[i]/2); j++){
      //console.log((i - 1)*dsize + j);
      edge[(i - 1)*dsize + j].push(i*dsize + j);
      edge[i*dsize + j].push((i - 1)*dsize + j);
      edge[(i - 1)*dsize + col[i-1] - 1 - j].push(i*dsize + col[i] - 1 - j);
      edge[i*dsize + col[i] - 1 - j].push((i - 1)*dsize + col[i-1] - 1 - j);
    }
  }

  for (let i = 0; i < dsize; i++){ // vertical
    for (let j = 0; j < col[i]-1; j++){
      edge[i*dsize + j].push(i*dsize + j + 1);
      edge[i*dsize + j + 1].push(i*dsize + j)
    }
  }
}

var curColor;
function changeColor(){

  var clkColor = this.style.backgroundColor;

  if (complete !== undefined && complete) return;
  if (arr.indexOf(parseInt(this.id)) > -1){
    if (curColor == clkColor) curColor = 'white';
    else curColor = clkColor;
  }
  else if (curColor != clkColor && curColor != 'white'){
    this.style.backgroundColor = curColor;
    if (checkConnection()){
      document.getElementById("pass").innerHTML = "Complete!";
      complete = true;
    }
  }
}

var size;
function changeSize(){
  // entrance of the web app
  destroyBoard();

  // resetting
  size = parseInt(this.id[0]);
  curColor = "white";
  complete = false;
  document.getElementById("pass").innerHTML = "";

  createBoard();

  if (timerId !== undefined){
    clearInterval(timerId);
    document.getElementById("time").innerHTML = "Time: 00:00:00";
  }
  timer();
}

var nblocks, pass, spath;
function checkConnection(){

  var finish = true;
  nblocks = 3*size**2;

  for (let j = 0; j < cnum; j++){

    let que = [], // queue: shift/push
        vis = Array(nblocks).fill(false),
        pre = Array(nblocks),
        dis = Array(nblocks),
        flag = false;

    que.push(arr[j*2]);
    dis[arr[j*2]] = 0;
    vis[arr[j*2]] = true;

    while(que.length > 0 && !flag){

      let tmp = que.shift();
      for (let i = 0; i < edge[tmp].length; i++){

        let next = edge[tmp][i],
            color = document.getElementById(next).style.backgroundColor;

        if (!vis[next] && color == bgname[j])
        {
          vis[next] = true;
          dis[next] = dis[tmp] + 1;
          pre[next] = tmp;
          que.push(next);

          if (next == arr[j*2+1])
          {
            let p = next;
            while(pre[p] != arr[j*2])
            {
              spath[j].push(pre[p]);
              p = pre[p];
            }
            flag = true;
            break;
          }
        }
      }
    }

    if (flag) // the color is connected
    {
      pass[j] = true;
      for (let k = 0; k < spath[j].length; k++)
        document.getElementById(spath[j][k]).style.borderColor = "white";
    }
    else
    {
      pass[j] = finish = false;
      while (spath[j].length)
        document.getElementById(spath[j].pop()).style.borderColor = "black";
    }
  }

  if (finish){
    // stop timer when all color is connected
    clearInterval(timerId);
    postRecord();
    return true;
  }
  return false;
}

function postRecord(){
  ///*
  let record = { duration: time, size: size, color: cnum }
  let form = new FormData();
  form.append('duration', time);
  form.append('size', size);
  form.append('color', cnum);
  //let params = {name: person, duration: time, size: size, color: cnum};
  //log.search = new URLSearchParams(params);
  /*
  fetch(log, { method: 'options', headers: {'Access-Control-Request-Method': 'post', 'Access-Control-Request-Headers': 'Content-Type'}})
  .then(preflight => {
    if (!preflight.ok) throw new Error(preflight.statusText)

  })
  //*/
  fetch(log, { method: 'post', body: JSON.stringify(record), mode: 'cors', credentials: 'include', headers: {'Content-Type': 'application/json'}})
  .then(response => {
    if (!response.ok) throw new Error(response.statusText)
    return response.text()
  }).catch(err => console.log(err))
  .then(t => console.log(t))
  //*/
}

var time, timerId;
function timer(){

  timerId = setInterval(stringProcessor, 1000);

  function stringProcessor(){

    var e = document.getElementById("time");
    time = e.innerHTML.replace(/[^0-9]/g, "");

    var carry = false, // default radix is 10
        hh = parseInt(time.substr(0, 2)),
        mm = parseInt(time.substr(2, 2)),
        ss = parseInt(time.substr(4, 2));

    if (ss < 59) ss = (ss + 1).toString();
    else { ss = "0"; carry = true; }
    ss = ("00" + ss).substr(ss.length);

    if (carry)
      if (mm < 59) { mm = (mm + 1).toString(); carry = false; }
      else { mm = "0"; carry = true; }
    else mm = mm.toString();
    mm = ("00" + mm).substr(mm.length);

    if (carry)
      if (hh < 99) { hh = (hh + 1).toString(); carry = false; }
      else clearInterval(timerId);
    else hh = hh.toString();
    hh = ("00" + hh).substr(hh.length);

    time = "Time: " + hh + ":" + mm + ":" + ss;
    e.innerHTML = time;
  }
}

var button = document.getElementsByClassName("boardsize");
for (let i = 0; i < button.length; i++)
  button[i].addEventListener('click', changeSize, false);

document.getElementById("clear").onclick = resetBoard;
