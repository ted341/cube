const bgname = ['darksalmon','tomato','orange','palegreen','dodgerblue','mediumseagreen','slateblue','violet']
const bghex = ['#e9967a','#ff6347','#ffa500','#98fb98','#1e90ff','#3cb371','#6a5acd','#ee82ee']

var size, nblocks, cnum, arr; // arr: list of odds
function createBoard(){

  // initialize
  arr = [];
  nblocks = 3*size**2;
  cnum = Math.floor(Math.random()*3 + size);
  pass = Array(cnum).fill(false);

  spath = Array(cnum);
  for (let i = 0; i < cnum; i++)
    spath[i] = [];

  // create blank element of board
  for (let i = 0; i < nblocks; i++){

    let newel = document.createElement('div');
    newel.id = i;
    newel.className = "square";
    newel.style.backgroundColor = 'white';
    newel.addEventListener('click', changeColor, false);

    switch(size){
      case 3:
        newel.style.height = newel.style.width = '50px';
        break;
      case 4:
        newel.style.height = newel.style.width = '38px';
        break;
      case 5:
        newel.style.height = newel.style.width = '30px';
        break;
    }

    if (i < size ** 2) r.appendChild(newel);
    else if (i < 2 * size ** 2) t.appendChild(newel);
    else l.appendChild(newel);
  }

  // randomly pick odds
  while(arr.length < cnum*2){
    let randnum = Math.floor(Math.random()*nblocks);
    if(arr.indexOf(randnum) > -1) continue;

    // valid number
    arr[arr.length] = randnum;

    // set odd style
    let img = 'url("data/frame.png")';
    let e = document.getElementById(randnum).style;
    e.backgroundImage = img;
    e.backgroundPosition = "center";
    e.backgroundRepeat = "no-repeat";
    e.backgroundColor = bgname[Math.floor((arr.length-1)/2)];

    switch(size){
      case 3: e.backgroundSize = "40px 40px"; break;
      case 4: e.backgroundSize = "30px 30px"; break;
      case 5: e.backgroundSize = "24px 24px"; break;
    }
  }

  setBoardStyle();
  constructEdgeList();
}

function destroyBoard(){

  if (size === undefined) return;

  var top = document.querySelector('#TopFace'),
      left = document.querySelector('#LeftFace'),
      right = document.querySelector('#RightFace');

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
  }
}

(function fetchBoard(){
  fetch('data/3.json', {method: 'get'})
  .then(response => {
    //ok 代表狀態碼在範圍 200-299
    if (!response.ok) throw new Error(response.statusText)
    return response.json();
  })
  .catch(err => console.log(err))
  .then(t => console.log(t))
})();

var t = document.getElementById("TopFace"),
    l = document.getElementById("LeftFace"),
    r = document.getElementById("RightFace");
function setBoardStyle(){

  var trans_t = ""

  switch(size){
    case 3:
      t.style.height = t.style.width = '162px';
      r.style.height = r.style.width = '162px';
      l.style.height = l.style.width = '162px';

      t.style.transform = "rotate(-90deg) translate(-60px,168px) skew(30deg,-60deg) scale(0.58, 1)";
      r.style.transform = "translate(-89px,26px) skew(0deg,-30deg)";
      l.style.transform = "rotate(90deg) translate(25px,-87px) skew(-30deg,0deg)";
      break;
    case 4:
      t.style.height = t.style.width = '168px';
      r.style.height = r.style.width = '168px';
      l.style.height = l.style.width = '168px';

      t.style.transform = "rotate(-90deg) translate(-60px,168px) skew(30deg,-60deg) scale(0.58, 1)";
      r.style.transform = "translate(-80px, 25px) skew(0deg,-30deg)";
      l.style.transform = "rotate(90deg) translate(24px, -84px) skew(-30deg,0deg)";
      break;
    case 5:
      t.style.height = t.style.width = '170px';
      r.style.height = r.style.width = '170px';
      l.style.height = l.style.width = '170px';

      t.style.transform = "rotate(-90deg) translate(-60px,168px) skew(30deg,-60deg) scale(0.58, 1)";
      r.style.transform = "translate(-77px,24px) skew(0deg,-30deg)";
      l.style.transform = "rotate(90deg) translate(24px,-83px) skew(-30deg,0deg)";
      break;
  }
}

var edge;
function constructEdgeList(){

  edge = Array(nblocks);

  for (let i = 0; i < nblocks; i++)
  {
    let plane = size**2;
    edge[i] = [];

  	for (let j = 0; j < nblocks; j++){

      if (i > j){
    		// section Y
    		if (j % plane < size)
    			if ((i%plane) == (j%plane*size) && (Math.floor(j/plane)+1) == Math.floor(i/plane))
            {edge[i].push(j); edge[j].push(i);}

    		if (j % plane % size == 0) // 0, 3, 6
    			if ((j%plane) == (i%plane*size) && (Math.floor(j/plane)+2) == Math.floor(i/plane))
      			{edge[i].push(j); edge[j].push(i);}

    		// general...
    		if (i == (j+1) && Math.floor(j/size) == Math.floor(i/size))
          {edge[i].push(j); edge[j].push(i);}

    		if (i == (j+size) && Math.floor(j/plane) == Math.floor(i/plane))
          {edge[i].push(j); edge[j].push(i);}
      }
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
    if (checkConnection())
      document.getElementById("pass").innerHTML = "Complete!";
  }
}

function changeSize(){

  destroyBoard();

  switch(this.id){
    case "3x": size = 3; break;
    case "4x": size = 4; break;
    case "5x": size = 5; break;
  }
  curColor = "white";

  createBoard();

  if (timerId !== undefined){
    clearInterval(timerId);
    document.getElementById("time").innerHTML = "Time: 00:00:00";
  }
  timer();
}

var pass, spath;
var log = new URL('https://script.google.com/macros/s/AKfycbxsvNzRf4sXFbgCZrovJNipy9rK3rYdcN5_o5PQJSrcA5DN985M/exec');
function checkConnection(){

  var finish = true;

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
    // all color is connected
    // stop timer when finish
    clearInterval(timerId);
    ///*
    let formRecord = new FormData();
    //formRecord.append('name', person);
    formRecord.append('duration', time);
    formRecord.append('size', size);
    formRecord.append('color', cnum);
    console.log(formRecord);

    //let params = {name: person, duration: time, size: size, color: cnum};
    //log.search = new URLSearchParams(params);

    fetch(log, { method: 'post', body: formRecord, mode: 'cors', headers: {'Content-Type': 'multipart/form-data'}})
    //fetch(log, { method: 'get', mode: 'no-cors'})
    .then(response => {
      if (!response.ok) throw new Error(response.statusText)
    })
    .catch(err => console.log(err))
    //*/
    return true;
  }
  return false;
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

document.getElementById("clear").onclick = function(){resetBoard()};

var button = document.getElementsByClassName("boardsize");
for (let i = 0; i < button.length; i++)
  button[i].addEventListener('click', changeSize, false);
