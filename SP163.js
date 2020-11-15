var trackIds = [];
var timestamp = Date.now();

function escapeHtml(unsafe) {
  return unsafe
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#039;");
 }

 function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

$(document).ready(function() {
  $.get('api/login/status', function(data){
    if(data.code == 200){
      loadUserInfo(data);
    }
  }, "json");
});

function login(){
  var email =$("#email").val();
  var password = $("#password").val();
  $.get('api/login', {email:email, password:password}, function(data){
    if(data.code != 200){
      alert("登陆失败："+data.msg);
      return;
    }
    loadUserInfo(data);
  }, "json");
  return false;
}

function loadUserInfo(data){
    $("#username").text("当前用户："+data.profile.nickname);
    var uid = data.profile.userId;
    getPlayList(uid);
}

function getPlayList(uid){
  $.get('api/user/playlist', {uid:uid, limit: 100}, function(data){
    $("#playlist").empty();
    var playlist = data.playlist;
    playlist.filter(p => p.trackCount > 2 && p.creator.userId == uid).forEach(p =>
      $("#playlist").append(`<a id="${p.id}" href="#" onclick="selectPlaylist(${p.id});return false;">${escapeHtml(p.name)}</a><br/>`)
    );
  },"json");
}

function selectPlaylist(pid){
  $.get("api/playlist/detail", {id:pid, timestamp:timestamp}, function(data){
    if(data.code != 200){
      alert("获取歌单详情失败："+data.msg);
      return;
    }
    $("#music").empty();
    $(".selected").removeClass("selected");
    $(`#${pid}`).addClass("selected");
    trackIds = data.playlist.trackIds.map(t => t.id);
    var tracks = data.playlist.tracks;
    tracks.slice(0, 20).forEach(m =>
      $("#music").append(`<li>${escapeHtml(m.name)}</li>`)
    );
    window.location = "#music_legend";
  }, "json");
}

function shufflePlaylist(){
  var selected = $(".selected:first");
  if(selected.length == 0 || trackIds.length == 0){
    alert("未选择歌单！");
    return;
  }
  var pid = selected[0].getAttribute("id");
  var pname = selected[0].text;
  var from = parseInt($("#from").val()) || 1;
  var to = parseInt($("#to").val()) || Number.MAX_SAFE_INTEGER;
  to = Math.min(to, trackIds.length);
  if(to - from < 2){
    alert("序号填写错误，没有歌曲需要打乱！");
    return;
  }
  from--;
  $.get("api/song/detail", {ids:`${trackIds[from]},${trackIds[to-1]}`}, function(data){
    if(data.code != 200){
      alert("获取歌曲详情失败："+data.msg);
      return;
    }
    if(confirm(`确定要打乱歌单【${pname}】从【${data.songs[0].name}】到【${data.songs[1].name}】的所有歌曲吗？`)){
      var shuffled = shuffle(trackIds.slice(from, to));
      var i;
      for(i=0;i<shuffled.length;i++){
        trackIds[from+i] = shuffled[i];
      }
      $.get("api/song/order/update",{pid:pid, ids:`[${trackIds.toString()}]`}, function(data){
        if(data.code != 200){
          alert("打乱歌单失败："+data.msg);
          return;
        }
        alert("成功打乱歌单！");
        timestamp = Date.now();
        selectPlaylist(pid);
      }, "json");
    }
  }, "json");
}