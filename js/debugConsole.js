var userPerms;
var appKey;
var authToken;
var ortcObj;
var controlsPrefix = "Connection1_";
var mycode;
var selected;
var freeToSend = false;


 function escolheu (escolha) {
    if (escolha=='pedra') {
      $(".pedra").css("opacity","1");
      $(".papel").css("opacity","0");
      $(".tesoura").css("opacity","0");
    } else{
      if (escolha=='papel') {
        $(".pedra").css("opacity","0");
        $(".papel").css("opacity","1");
        $(".tesoura").css("opacity","0");
      } else{
        $(".pedra").css("opacity","0");
        $(".papel").css("opacity","0");
        $(".tesoura").css("opacity","1");
      };
    };
  }

  function embat(me , you) {
    $(".opt1").css("opacity","0").removeClass("pedra").addClass(me);
    $(".opt2").css("opacity","0").removeClass("papel").addClass("versus");
    $(".opt3").css("opacity","0").removeClass("tesoura").addClass(you);





  }

  function resultado() {

  }

  function playagain() {

  }

function play () {
    setInterval(
        function() {
        document.getElementById('notify2').play();
        setTimeout( function () {
            log("Play foi ativado");
        escolheu(selected);
        Send(selected); 
        },10000);
    }, 20000);
}

function sendChoosedMove(marker){
    if(marker == 64){
        selected = 'pedra';
    } else if(marker == 32) {
        selected='tesoura';
    } else if(marker == 16) {
        selected='papel';
    }
  }

window.onload = function () {
    var v = document.getElementsByTagName("audio")[0];
    mycode = makeid();
    var url = "http://ortc-developers.realtime.co/server/2.1";
    appKey = "v2HqOx";
    authToken = "YOUR_AUTENTICATION_TOKEN";
        
    loadOrtcFactory(IbtRealTimeSJType, function (factory, error) {    
        if (error != null) {
            alert('Factory error: ' + error.message);
        } else {
            // Create ORTC client
            ortcObj = factory.createClient();

            ortcObj.setId('ortcDebugConsole');
            ortcObj.setConnectionTimeout(5000);

            ortcObj.onConnected = function (ortc) { onConnected(ortc); };
            ortcObj.onDisconnected = function (ortc) { onDisconnected(ortc); };
            ortcObj.onSubscribed = function (ortc, channel) { onSubscribed(ortc, channel); };
            ortcObj.onUnsubscribed = function (ortc, channel) { onUnsubscribed(ortc, channel); };
            ortcObj.onException = function (ortc, event) { onException(ortc, event); };
            ortcObj.onReconnecting = function (ortc) { onReconnecting(ortc); };
            ortcObj.onReconnected = function (ortc) { onReconnected(ortc); };
        }
    });

    byId('loading').style.display = 'none';
    document.body.appendChild(video);

    var canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    canvas.style.display = 'block';

    var videoCanvas = document.createElement('canvas');
    videoCanvas.width = video.width;
    videoCanvas.height = video.height;

    var raster = new NyARRgbRaster_Canvas2D(canvas);
    var param = new FLARParam(320,240);

    var resultMat = new NyARTransMatResult();

    var detector = new FLARMultiIdMarkerDetector(param, 120);
    detector.setContinueMode(true);

    var ctx = canvas.getContext('2d');
    var glCanvas = document.createElement('canvas');
    glCanvas.style.webkitTransform = 'scale(-1.0, 1.0)';
    glCanvas.width = 600;
    glCanvas.height = 450;
    var s = glCanvas.style;
    document.body.appendChild(glCanvas);
    display = new Magi.Scene(glCanvas);
    display.drawOnlyWhenChanged = true;
    param.copyCameraMatrix(display.camera.perspectiveMatrix, 10, 10000);
    display.camera.useProjectionMatrix = true;
    var videoTex = new Magi.FlipFilterQuad();
    videoTex.material.textures.Texture0 = new Magi.Texture();
    videoTex.material.textures.Texture0.image = videoCanvas;
    videoTex.material.textures.Texture0.generateMipmaps = false;
    display.scene.appendChild(videoTex);

    var times = [];
    var pastResults = {};
    var lastTime = 0;
    var cubes = {};
    var images = [];

    window.updateImage = function() {
      display.changed = true;
    }

    var getMarkerNumber = function(idx) {
            var data = detector.getIdMarkerData(idx);
            if (data.packetLength > 4) {
                return -1;
            } 
            
            var result=0;
            for (var i = 0; i < data.packetLength; i++ ) {
                result = (result << 8) | data.getPacketData(i);
            }

            return result;
    }
    
    setInterval(function(){
      if (video.ended) video.play();
      if (video.paused) return;
      if (window.paused) return;
      if (video.currentTime == video.duration) {
        video.currentTime = 0;
      }
      if (video.currentTime == lastTime) return;
      lastTime = video.currentTime;
      videoCanvas.getContext('2d').drawImage(video,0,0);
      ctx.drawImage(videoCanvas, 0,0,320,240);
      var dt = new Date().getTime();

      videoTex.material.textures.Texture0.changed = true;

      canvas.changed = true;
      display.changed = true;

      var t = new Date();
        
      var detected = detector.detectMarkerLite(raster, threshold);
    
      for (var idx = 0; idx<detected; idx++) {
        currId = getMarkerNumber(idx);
        GLOBAL_currId = currId;
          
        if (!pastResults[currId]) {
          pastResults[currId] = {};
        }
          
        detector.getTransformMatrix(idx, resultMat);
        
        pastResults[currId].age = 0;
          
        pastResults[currId].transform = Object.asCopy(resultMat);
      }
      for (var i in pastResults) {
        var r = pastResults[i];
        if (r.age > 1) {
          delete pastResults[i];
        }
        r.age++;
      }
        
      for (var i in cubes) cubes[i].display = false;
      for (var i in pastResults) {
        if (!cubes[i]) {
            // O padrao bateu com algum marcador
            sendChoosedMove(GLOBAL_currId);
        }
          
        var mat = pastResults[i].transform;
          
        var cm = [];
        cm[0] = mat.m00;
        cm[1] = -mat.m10;
        cm[2] = mat.m20;
        cm[3] = 0;
        cm[4] = mat.m01;
        cm[5] = -mat.m11;
        cm[6] = mat.m21;
        cm[7] = 0;
        cm[8] = -mat.m02;
        cm[9] = mat.m12;
        cm[10] = -mat.m22;
        cm[11] = 0;
        cm[12] = mat.m03;
        cm[13] = -mat.m13;
        cm[14] = mat.m23;
        cm[15] = 1;
      }
    }, 15);
};


function onSubscribed(ortc, channel) {
    console.log('SUBSCRIBED TO: ' + channel);
    log('SUBSCRIBED TO: ' + channel);
    Send("ENTREI");
};

//var onmatch = false;
var me = "";
var stranger = "";


function onMessage(ortc, channel, message) {
    switch (channel) {
        case 'ortcClientConnected':
            log('A CLIENT CONNECTED: ' + message);
            break;
        case 'ortcClientDisconnected':
            log('A CLIENT DISCONNECTED: ' + message);
            break;
        case 'ortcClientSubscribed':
            log('A CLIENT SUBSCRIBED: ' + message);
            break;
        case 'ortcClientUnsubscribed':
            log('A CLIENT UNSUBSCRIBED: ' + message);
            break;
        default:

        var res = message.split("#");
        code = res[0];
        messagefinal = res[1];


        //if (!onmatch) {
            if(code == mycode ){
                log('RECEIVED AT ' + channel + ' from yourself: ' + message);
                me = messagefinal;

            }else{
                log('RECEIVED AT ' + channel + ': ' + message);
                stranger = messagefinal;

            }

            if (stranger == "ENTREI") {
                stranger = "";
                Send("ESTOUAQUI");
                document.getElementById('notify').play();
                play();
             } else {
                if (stranger == "ESTOUAQUI") {
                    stranger = "";
                    play();
                };
             };


            if ( (stranger == "pedra" || stranger == "papel" || stranger == "tesoura") && (me == "pedra" || me == "papel" || me == "tesoura") ) 
                {
                    embat(me,stranger);
                    resultado = EvalMatch(me,stranger);

                    if (resultado=='GANHOU') {document.getElementById('vitoria').play();
                        } else {
                            if (resultado=='EMPATE') {
                                document.getElementById('empate').play();
                            } else{
                                document.getElementById('derrota').play();
                            };

}
                    log("Você " + resultado);
                    me ="";
                    stranger = "";

                };

        //} else{};
            

            break;
    }
};

function onConnected(ortc) {
    log('CONNECTED TO: ' + ortc.getUrl());
    log('CONNECTION METADATA: ' + ortc.getConnectionMetadata());
    log('SESSION ID: ' + ortc.getSessionId());
    log('USING: ' + ortc.getProtocol());
    log('HEART BEAT DETAILS: ' + " Active - " + ortc.getHeartbeatActive() + " | Time - " + ortc.getHeartbeatTime() + " | Fails - " + ortc.getHeartbeatFails());
    Subscribe();

};

function Connect() {
    var url = "http://ortc-developers.realtime.co/server/2.1";

    var heartbeatTime = "15";
    var heartbeatFails = "3";
    var heartbeatActive = false;

    ortcObj.setConnectionMetadata("UserConnectionMetadata");
    ortcObj.setAnnouncementSubChannel(null);
    ortcObj.setClusterUrl(url);


    log('CONNECTING TO: ' + ortcObj.getClusterUrl() + '...');

    appKey = "v2HqOx";
    authToken = "YOUR_AUTENTICATION_TOKEN";

    ortcObj.setHeartbeatTime(heartbeatTime);
    ortcObj.setHeartbeatFails(heartbeatFails);
    ortcObj.setHeartbeatActive(heartbeatActive);

    ortcObj.connect(appKey, authToken);
    Subscribe();
};

function Send(msg) {
    var channel = "myChannel";
    //var message = mycode+"#"+$('#' + controlsPrefix + 'txtMessage').val();
    var message = mycode+"#"+msg;

    log('SEND: ' + message + ' TO ' + channel);

    ortcObj.send(channel, message);
};

function ClearLog() {
    $('#logger').html('');
};

function Subscribe() {
    var channel = "myChannel";
    
    log('SUBSCRIBING TO: ' + channel + '...');

    ortcObj.subscribe(channel, true, function (ortc, channel, message) { onMessage(ortc, channel, message); });
    setTimeout(function() {
        freeToSend=true;
    }, 10);
};

function EvalMatch(player1 , player2) {
    if (!player1) { return "PERDEU";};
    if (!player2) { return "GANHOU";};
    if (player1==player2) {
        return "EMPATE";
    } 
    else {
        if (player1=="pedra") {
            if (player2=="papel") {
                return "PERDEU";
            } 
            else{
                return "GANHOU";
            };

        }
        else {
            if (player1=="papel") {
                if (player2=="tesoura") {
                    return "PERDEU";
                } 
                else {
                    return "GANHOU";
                };
            }
            else {
                if (player1=="tesoura") {
                    if (player2=="pedra") {
                        return "PERDEU";
                    } 
                    else {
                        return "GANHOU";
                    };

                }
            }

        }
        
    };
    

};

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

log = function (m) {
    var loggerChildren = $('#logger').children();
    var totalLines = loggerChildren.length;

    if (totalLines > 300) {
        $("#logger").children().slice(totalLines - 1).detach();
        $("#logger").children().slice(totalLines - 2).detach();
    }


    var logText = $('#logger').html();
    var now = new Date();

    $('#logger').html('');

    $('#logger').append($('<code>').text(now.format('HH:mm:ss') + ' - ' + m));
    $('#logger').append($('<br>'));
    $('#logger').append(logText);
};



