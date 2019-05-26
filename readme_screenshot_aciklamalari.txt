Merhaba Hocam,
index.html -> Login screen
	Eger register butonuna tiklanirsa -> register.html (bkz. 4_1_register.PNG)
	chat.html de dogrudan aciliyor
	not: login screen, register arka tarafta websocket aciyor. isleri bitince offline olacaklar.
	
Login ekraninda en tepede DB'de kayitli ornek kayit var (test test ile girilebilir. SQLler asagida)

Eger id veya parola hatali girilirse "Wrong username or password" hatasi basilir (bkz. 2_unsuccessful_login.png)

Eğer id ve parola doğru ise doğrudan chat ekranına geçiş olur (bkz. 3.1_successful_login.png VE 3.2_successful_login_and_chat_Screen.png)

4_1_register.png'deki gibi Register ekranına gidilebilir
	Eğer Register olurken id bolumune daha once kayit edilmis bir id girilirse (bkz. 4_2_unsuccessful_register_before.PNG) hata donecek. 
	Cunku id kolonu, DB tarafinda unique yapildi (bkz. 4_2_unsuccessful_register_after.PNG)
	
	Eger daha once kayitli olmayan bir id girilirse sorunsuz bir sekilde register olunur (bkz. 4.4_successful_register_before.png)
	Ve doğrudan chat ekranina yonlendirilir (4.5_successful_register_after.png)
	
En onemli kisima geldik: CHAT
Kirmizi renkler: Offline
Yesil renkler  : Online
Mavi  renk     : Userin kendisi

Kurallar: 
1- private messageta bir receiver belirlemek icin, User List alaninda bir connection id uzerine tiklanmalı.
		Bu durumda private chat altındaki ilk text alan otomatik olarak bu id ile dolar.
		Ardindan message alanına özel mesaj yazılır ve Send butonuna basilir.
2- Offline userlara mesaj gonderilemez (uyarı, hata mesajı alacak)
3- User kendisine mesaj gonderemez (hata alacak)

5_chat2_private_1_to_3.png -> 1 nolu connectionı almış olan user 3'e private mesaj yollamak ister.
								Bunun icin User List alanında 3'un uzerine tiklar ve mesajini yazip gonderir.
								Dikkat edilecegi uzere mavi renkli olan 1 numaradır

5_chat3_private_for_3_from_1.png -> 3 nolu connectiono almış olan userın ekraninda 1'den gelen mesaj gorunuyor. 
									Dikkat edilecegi uzere mavi renkli olan 3 numaradır.
									
5_chat4_no_anymessage_to_5.png -> 1-3 arasında private message gerceklesti. Yani 5 numaralinin ekraninda herhangi bir
								sey gorunmeyecek
								
5_chat5_public_from_3.png		 -> 3 public mesaj yayinlar

5_chat6_public_visible_from_5.png -> 3'un mesajı 5'in public alaninda gorunur


5_chat7_public_visible_from_7 -> 	Ayni mesaj public oldugu icin 7'nin de public alaninda gorunur

5_chat8_public_from_7.png		-> 7 nolu user public mesaj yayinlar

5_chat9_public_from_7.png		-> 1 nolu userın ekraninda gorunme sekli




SQLler
-------------------------------------------------------------------------------------------------------
CREATE TABLE `login` (
  `username` varchar(25) NOT NULL,
  `password` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



INSERT INTO `login` (`username`, `password`) VALUES
('test', 'test'),
('test2', 'test2'),
('test3', 'test3');


ALTER TABLE `login`
  ADD UNIQUE KEY `username` (`username`);