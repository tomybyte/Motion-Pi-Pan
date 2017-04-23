## Raspberry Pi 2 - RPi-Cam-Web-Interface - Sensor / Servo Motion Tracking Extension

***Uses sensors & python & Opencv to Track x,y position of moving object in camera view***

### Install

    cd ~
    git clone https://github.com/tomybyte/Motion-Pi-Pan.git
    cd Motion-Pi-Pan
    chmod u+x *.sh
    sudo ./Motion-Pi-Pan-install.sh

### How to Run

After installation Motion-Pi-Pan is part of the RPi-Cam-Web-Interface.
You can change the configuration in:

    /var/www/html/Motion-Pi-Pan.py

You can run Motion-Pi-Pan.py with command line debug:

    sudo kill $(ps aux | grep -v grep | grep Motion-Pi-Pan.py | awk '{ print $2 }') 
    sudo /var/www/html/Motion-Pi-Pan.py

### Prerequisites

* Raspberry Pi 2
* Camera Module e.g.: http://amzn.to/2oizp6k
* 3 HC-SR501 Sensors e.g: http://amzn.to/2oiw0Va
* Pan/Tilt Camera Mount with 2 SG-90 Servos e.g.: http://amzn.to/2pTY8hr
* installed RPi-Cam-Web-Interface https://github.com/silvanmelchior/RPi_Cam_Web_Interface.git

### Credits

This programm is highly inspired by face-track ver 0.63 
written by Claude Pageau https://github.com/pageauc/face-track-demo/

##

Have Fun

![ScreenShot](https://github.com/tomybyte/Motion-Pi-Pan/blob/master/img/wall-e.jpg)
