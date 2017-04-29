## Raspberry Pi 2 - RPi-Cam-Web-Interface - Sensor / Servo Motion Tracking Plugin

***Uses sensors & python & Opencv to Track x,y position of moving faces or objects in camera view***

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
* Jumper Wire 20cm Female-Female e.g.: http://amzn.to/2pvtIBk
* Camera Flex 30cm Cable e.g.: http://amzn.to/2oVW7gV
* installed RPi-Cam-Web-Interface https://github.com/silvanmelchior/RPi_Cam_Web_Interface.git

### Adjustments

#### Raspberry Pi 2 GPIO ports

![ScreenShot](https://github.com/tomybyte/Motion-Pi-Pan/blob/master/img/raspberry-gpio-pin-belegung.jpg)

#### HC-SR501

    Left / Right Sensor = half sensity and min delay
    Middle Sensor = min sensity and min delay

Sensor GPIO ports

    middle = 22
    left = 17
    right = 27

![ScreenShot](https://github.com/tomybyte/Motion-Pi-Pan/blob/master/img/HC-SR501_potis.jpg)

#### SG-90 Servos

GPIO ports

    X / pan = 23
    Y / tilt = 24

![ScreenShot](https://github.com/tomybyte/Motion-Pi-Pan/blob/master/img/SG90_Servo.jpg)

### Credits

This programm is highly inspired by face-track ver 0.63 
written by Claude Pageau https://github.com/pageauc/face-track-demo/

##

Have Fun

![ScreenShot](https://github.com/tomybyte/Motion-Pi-Pan/blob/master/img/wall-e.jpg)
