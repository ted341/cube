
size = 3;
nblocks = 3*size**2;
sqLen = '50px';
faceLen = '162px';
ttx = '-24px';
tty = '119px';
btx = '-10px';
bty = '-38px';

const bgname = ['darksalmon','tomato','orange','palegreen','dodgerblue','mediumseagreen','slateblue','violet']
const bghex = ['#e9967a','#ff6347','#ffa500','#98fb98','#1e90ff','#3cb371','#6a5acd','#ee82ee']

///*
// unused
function increaseLuminance(hex, lum) {
  // Validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, "");
  if (hex.length < 6) hex = hex.replace(/(.)/g, '$1$1');
  lum = lum || 0;
  // Convert to decimal and change luminosity
  var rgb = "#", c;
  for (var i = 0; i < 3; ++i) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00" + c).substr(c.length);
  }
  return rgb;
}
//*/

cnum = Math.floor(Math.random()*3 + size);
odd = Array(nblocks);
arr = [];

// randomly pick odds
function setOdds(){

  while(arr.length < cnum*2){
    let randnum = Math.floor(Math.random()*nblocks);
    if(arr.indexOf(randnum) > -1) continue;
    arr[arr.length] = randnum;
  }
  document.write(arr);
  for (let i = 0; i < arr.length; i++)
  {
    odd[arr[i]] = 1;
    let img = 'url("data/frame.png")';
    document.getElementById(arr[i]).style.backgroundImage = img;
    document.getElementById(arr[i]).style.backgroundSize = "40px 40px";
    document.getElementById(arr[i]).style.backgroundPosition = "center";
    document.getElementById(arr[i]).style.backgroundRepeat = "no-repeat";
  }
}

// color the odds
function setOddsColor(){

  for (let i = 0; i < arr.length; i+=2){
    let x = Math.floor(i/2);
    document.getElementById(arr[i]).style.backgroundColor = bgname[x];
    document.getElementById(arr[i+1]).style.backgroundColor = bgname[x];
  }
}

// construct edge list
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
          edge[i].push(j); edge[j].push(i);

  		if (j % plane % size == 0) // 0, 3, 6
  			if ((j%plane) == (i%plane*size) && (Math.floor(j/plane)+2) == Math.floor(i/plane))
    			edge[i].push(j); edge[j].push(i);

  		// general...
  		if (i == (j+1) && Math.floor(j/size) == Math.floor(i/size))
        edge[i].push(j); edge[j].push(i);

  		if (i == (j+size) && Math.floor(j/plane) == Math.floor(i/plane))
        edge[i].push(j); edge[j].push(i);
    }
	}
}
for (let i = 0; i < edge.length; i++)
  document.write(i + ": " + edge[i] + "<br>");

// create the cube
for (let i = 0; i < nblocks; i++)
{
  odd[i] = 0;
  let newel = document.createElement('div');
  newel.setAttribute('class', 'square');
  newel.setAttribute('id', i);
  newel.style.backgroundColor = 'white';

  if (i < size ** 2) // right face
    document.querySelector('#RightFace').appendChild(newel);
  else if (i < 2 * size ** 2) // top face
    document.querySelector('#TopFace').appendChild(newel);
  else // (i < nblocks) left face
    document.querySelector('#LeftFace').appendChild(newel);
}

setOdds();
setOddsColor();

// check each color
var log = new URL('https://script.google.com/macros/s/AKfycbxsvNzRf4sXFbgCZrovJNipy9rK3rYdcN5_o5PQJSrcA5DN985M/exec');
pass = Array(cnum).fill(false);
spath = Array(cnum);
for (let i = 0; i < cnum; i++) spath[i] = [];

function checkConnected()
{
  var finish = true;
  for (let j = 0; j < cnum; j++)
  {
    let que = [], // queue: shift/push
        vis = Array(nblocks).fill(false),
        pre = Array(nblocks),
        dis = Array(nblocks),
        flag = false;

    que.push(arr[j*2]);
    dis[arr[j*2]] = 0;
    vis[arr[j*2]] = true;

    while(que.length > 0 && !flag)
    {
      let tmp = que.shift();
      for (let i = 0; i < edge[tmp].length; i++)
      {
        let next = edge[tmp][i];
        if (!vis[next] && document.getElementById(next).style.backgroundColor == bgname[j])
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

    if (flag)
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
  //console.log(pass);
  if (finish)
  { // stop timer when finish
    alert("complete!");
    clearInterval(intid);

    let formRecord = new FormData();
    formRecord.append('name', person);
    formRecord.append('duration', time);
    formRecord.append('size', size);
    formRecord.append('color', cnum);
    console.log(formRecord);

    let params = {name: person, duration: time, size: size, color: cnum};
    //log.search = new URLSearchParams(params);

    fetch(log, { method: 'post', body: formRecord, mode: 'cors', headers: {'Content-Type': 'multipart/form-data'}})
    //fetch(log, { method: 'get', mode: 'no-cors'})
    .then(response => {
      if (!response.ok) throw new Error(response.statusText)
    })
    .catch(err => console.log(err))

  }
}

/*
aaa = Array(3).forEach((e, i, a) => a[i] = [])
//.fill([]) cause error for 2d array
for (let i = 0; i < 3; i++){
  //aaa[i] = [];
  for (let j = 0; j < 3; j++);
    //aaa[i].push(i*3+j)
}
console.log(aaa)
//*/

// deal with click event
crclr = 'white';
for (let i = 0; i < nblocks; i++)
{
  let sq = document.getElementById(i);
  // loop iterator invisible in function
  sq.onclick = function ()
  {
    var ckclr = this.style.backgroundColor;

    if (odd[this.id] == 1)
      if (crclr == ckclr) crclr = 'white';
      else crclr = ckclr;
    else if (crclr != ckclr && crclr != 'white')
    {
      this.style.backgroundColor = crclr;
      checkConnected(crclr);
    }
  };
}

function refresh(slen, flen, tx, ty, bx, by){

}

// set timer
time = "Time: 00:00:00";
document.getElementById("time").innerHTML = time;
intid = setInterval(timer, 1000);
function timer()
{
  time = String(time).replace(/[^0-9]/g, "");

  var hh, mm, ss, carry = false;
  hh = parseInt(time.substr(0, 2));
  mm = parseInt(time.substr(2, 2));
  ss = parseInt(time.substr(4, 2));

  if (ss < 59) ss = (ss + 1).toString();
  else { ss = "0"; carry = true; }
  ss = ("00" + ss).substr(ss.length);

  if (carry) // mm
    if (mm < 59) { mm = (mm + 1).toString(); carry = false; }
    else { mm = "0"; carry = true; }
  else mm = mm.toString();
  mm = ("00" + mm).substr(mm.length);

  if (carry) // hh
    if (hh < 99) { hh = (hh + 1).toString(); carry = false; }
    else clearInterval(intid);
  else hh = hh.toString();
  hh = ("00" + hh).substr(hh.length);

  time = "Time: " + hh + ":" + mm + ":" + ss;
  document.getElementById("time").innerHTML = time;
}

// reset board
document.querySelector('#clear').onclick = function (){
  for (let i = 0; i < 3 * size * size; i++){
    let sq = document.getElementById(i);
    sq.style.backgroundColor = 'white';
  }
  setOddsColor();
}

// read user input
person = prompt("Please enter your name:", "Anonym");

fetch('data/3.json', { method: 'get' })
.then(response => {
  //ok 代表狀態碼在範圍 200-299
  if (!response.ok) throw new Error(response.statusText)
  return response.json();
})
.then(t => console.log(t))
.catch(err => console.log(err))
