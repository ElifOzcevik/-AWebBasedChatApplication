var http = require('http');
var mysql = require('mysql');
var url = require('url');
var fs = require('fs');

//slide 5
var WebSocketServer = require('websocket').server;

var count = 0;
var clients = {};
var onlineClientsCount=1;
//asagida JSON icerisinde userList olustururken bazı sorunlar yasadim
//ornegin:  "userList":[,"client1","client2"], "message":"11"}
//yukaridaki gibi userListin ilk elemanından once virgul geliyor
//bunun sebebi bagli kullanıcı kopar veya refresh edip farklı ve yeni bir socketten baglanirsa
//clients arrayinden silinse bile for loopun i indexi 0dan baslamayabilir.
//farzedelim ki clientsın 0. indexine giren koptu. bu durumda for loop i=1 den itibaren islem yaparsanız
//i>0 kontrolu bir ise yaramayacaktır. Kesin sonuc icin harici bir degisken tanimliyorum.
var firstLoop=0;



//slide 4
//http server olustuurldu
var server = http.createServer(function(request, response) {
	//index.html (login) sayfasinin 127.0.0.1:1234 urli ile direkt olarak gelebilmesi icin:
var q = url.parse(request.url, true);
var filename = "." + q.pathname;
console.log("createServer...");
if( q.pathname=="/"){
	console.log("/");
	filename="./index.html";
  }
fs.readFile(filename, "utf-8", function(err, data) {
	if (err) {
		response.writeHead(404, {'Content-Type': 'text/html'});
		console.log("404");
		return response.end("404 Not Found");
	} 
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(data);
	return response.end();
	});
  //
});

//1234 dinleyecek skilde baslatildi
server.listen(1234, function() {
	console.log((new Date()) + ' Server is listening on port 1234');
});
//slide4 end


//slide 5
//ws olsuturduk
wsServer = new WebSocketServer({
	//http servera gonderdik
	httpServer: server
});

//connection requesti gelirse ->
wsServer.on('request', function(r){
	//yeni request geldigi zaman
    
	console.log((new Date()) + ' New connection request received' + r.remoteAddress);
	//ya kabul ya red
	//r.origin herhangi bir ipden gelsin mi gibi. kısıt yani. bu durumda ellemiyoruz
	//null olan da protokol icin. herhangi bi protokol kullanacak mıyızoptional
	var connection = r.accept(null, r.origin);
	
	//slide 12
	var id=count++;
	clients[id] = connection
	console.log((new Date()) + ' Connection accepted');

	//slide 16 
	
	
	//connectiondan mesaj gelidigi zaman calisacak ->
	//snedUTF ile connectiondaki herkese mesaj gonderiyor
	//sendutf, sendbytes vs vs (slide 14te var)
	/*connection.on('message', function incoming(message,ToWhom) {
		console.log("To: " + ToWhom);
	var msgString = message.utf8Data;
	for(var i in clients){
     clients[i].sendUTF(msgString);
    }
	});*/
	
	connection.on("message", function(str) {
		
		var obj = JSON.parse(str.utf8Data);
		
		if ( obj.to == "public"){
			console.log("Message to Public from " + id);
			
			//forming clients list
			var userListJSON = '[';
			for(var i in clients){
				//Loop bitince en sona virgul eklenmesini engellemek icin
				//loop dongusunun en basinda stringin sonuna virgul eklenir
				//Fakat browserda refresh yaparsanız yeni bir socketten connection acacak (keepalive off varsayılıyor)
				//Bu durumda yasayan connectionlardan emin olmalıyız
				console.log("Before IF: " +  clients[i] + " AND i: " + i );
				if ( typeof clients[i] != 'undefined'   && firstLoop>0 ){
					console.log("i: " + i + " Lenght: " + clients.length);
					userListJSON += ',';
					onlineClientsCount++;
				}
				
				console.log("Client"+i+ " : " + clients[i]);
				//userListJSON += '"client'+i+'"' ;
				userListJSON += '"'+i+'"' ;
				
				
				firstLoop++;
				
			}
			
			userListJSON += ']';		
			
			//sending public message (broadcast)
			
			for(var j in clients){
				//clients[j].sendUTF(obj.text);
				var data = '{ "userList":'+ userListJSON +', "from":"'+id+'","to":"public","message":"' + obj.text + '","userTotal":"'+count+'","purpose":"refresh","userID":"'+id+'"}';
				//mesaji herkese gonderiyoruz
				clients[j].sendUTF(data);
			}
			
			//sifirlamazsa ikinci turda kaldidi degerden devam eder. Bu durumda daha onceden en az bir client varsa zaten 
			//sifirdan buyuk olacaktir ve if'e girer. bu da istemedigimiz bir duruma yol acar
			firstLoop=0;
			

			userListJSON="";
		}
		else if( obj.to == "server"){
			//user listi refresh etmek icin servera javascript tarafindan daha light bir istek gonderiyorum.
			console.log("User List refresh request from " + id );
			var userListJSON = '[';
			for(var i in clients){
			if ( typeof clients[i] != 'undefined'   && firstLoop>0 ){
				//console.log("i: " + i + " Lenght: " + clients.length);
				userListJSON += ',';
				onlineClientsCount++;
				}
				
			userListJSON += '"'+i+'"' ;
			firstLoop++;
			}
			//client tarafta gelen mesajdaki amacin refresh oldugunu bildiriyorum. Boylece ek bir is yapmayacak
			//sadece user listi refresh edecek
			userListJSON += ']';
			var data= '{ "userList":'+ userListJSON +',"purpose":"refresh","userTotal":"'+count+'","userID":"'+id+'"}';
			//istek yapan clienta mesaj gonderilir. Aslinda bu durumda her client 2 saniyede bir istek gonderiyor. 
			//Bunun yerine sunucu da iki saniyede bi public veya broadcast gonderebilirdi
			clients[id].sendUTF(data);
			//console.log(data);
			firstLoop=0;
			userListJSON="";
			
		}
		else if (obj.to == "passwordcheck"){
			//login ekranindan buraya dusuyor
			//username password kontrolu yapilacak
			//username password eslesirse response:valid olarak bir JSON donecek
			console.log("user here for login check");
			var con = mysql.createConnection({
				host: "localhost",
				user: "root",
				password: "",
				database: "secureweb"
			});
			con.connect(function(err) {
			if (err) {
				console.log("Check MySQL Connection!!!");
				throw err;
				
			}
			var sql="SELECT * FROM login where username='"+ obj.textid+ "'" + " and " + "password='" + obj.textpass  + "'";
			console.log(sql);
			var data;
				con.query(sql, function (err, result, fields) {
					if (err) throw err;
					console.log(result);
					if (result != ""){
						
					//basarili sonuc var
					data= '{ "response":"valid"}';
					}
					else
						data= '{ "response":"invalid"}';
						
					clients[id].sendUTF(data);
				});
				
					
			});
			
		}
		else if (obj.to == "register"){
			//user register linkine tiklarsa mesaj buraya gelir
			console.log("user here for register");
			//connection bilgisi farklilik gosterebilir
			var con = mysql.createConnection({
				host: "localhost",
				user: "root",
				password: "",
				database: "secureweb"
			});
			con.connect(function(err) {
			if (err) throw err;
			var sql="INSERT INTO  login (USERNAME,PASSWORD) VALUES('"+ obj.textid + "'" + "," + "'"+  obj.textpass + "'" + ")";
			console.log(sql);
			
				con.query(sql, function (err, result, fields) {
					var data;
					if (err) { 
					//tabloda username kolono unique. Unique consraint hatasi alirsa buraya duser.
						console.log("INVALID");
						data=  '{ "response":"invalid"}'; 
						//throw err; 
					}
					else {
					
						//insert basarili
						data=  '{ "response":"valid"}';
					}
					console.log(result);
					clients[id].sendUTF(data);
				});
				
					
			});
			
		}
		else{
			//else kesin private bir mesajdır. GOnderenin kim oldugunu biliyoruz. id bunu tutuyor.
			//to bilgisi ise client tarafindan JSON ile geliyor
			
			var obj = JSON.parse(str.utf8Data);
			//alici ilgisi JSONdan alinir
			var toUserID = obj.to;
			
			console.log("Message to Private from " + id + " to : " + toUserID);
			console.log("Message is: " + obj.text );
			
			//response icin JSON obj hazirlanmaya basliyor
			var userListJSON = '[';
			for(var i in clients){
			if ( typeof clients[i] != 'undefined'   && firstLoop>0 ){
					console.log("i: " + i + " Lenght: " + clients.length);
					//her online userin listeye eklenmesi icin
					userListJSON += ',';
					//kac adet online user var bunun bilgisini de ayri bir degiskende tutuyoruz
					onlineClientsCount++;
				}
			//userin idsi listeye eklenir  -> 1,2,3...6,9..	
			userListJSON += '"'+i+'"' ;
			//ilk dongude basa virgul koymamak icin 0 olması gerekiyordu. Boylece for loopun ilk dongusunde ife giremeyecek
			firstLoop++;
			}
			
			userListJSON += ']';
			
			var data= '{ "userList":'+ userListJSON +', "from":"'+id+'","to":'+ toUserID +',"message":"' + obj.text + '","userTotal":"'+count+'","purpose":"chat","userID":"'+id+'"}';
			
			//eger alici userin kendisi ise..
			if ( id == toUserID) {
				console.log("User tries to send a private message to himself/herself. Not allowed.");
			}
			else {
				//asagidakine gore mesaj sadece alicinin ekraninda gorunur.
				//bu if checke gerek var cunku eger mesaj gonderilene kadar client disconnected olursa node crash olur
				if ( typeof clients[toUserID] != 'undefined' &&  typeof clients[id] != 'undefined'){
				clients[toUserID].sendUTF(data);
			
				//Fakat chat ortamında ne yazdıgımızı gorebilmeliyiz. Client tarafta gelen mesajlar ekrana basildigi icin
				//Gonderici tarafa mesajın aynisini geri gonderiyoruz.
				clients[id].sendUTF(data);
				}
			}
			firstLoop=0;
			userListJSON="";
			
		}


/*
  if("id" in obj) {
    // New client, add it to the id/client object
    clients[obj.id] = client;
  } else {
    // Send data to the client requested
    clients[obj.to].send(obj.data);
  }*/
});

	//slide 16 end

	connection.on('close', function(reasonCode, description) {
    delete clients[id];
    console.log((new Date()) + connection.remoteAddress + ' is disconnected.');
	});


	

});
//slide5 end