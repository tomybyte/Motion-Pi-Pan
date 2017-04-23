#!/bin/bash
# Motion-Pi-Pan-install.sh script written by Thomas Mühlberg 23-Apr-2017

script_path=$(dirname $(readlink -f "$0"))

if [ "$(whoami)" != "root" ]; then
    echo "please run this script: sudo ./$0"
    exit
fi

echo -e "\n------------------------------------------------\n"
rpi_path="/var/www/html/"
read -p "Enter the RPi-Cam-Web-Interface document root path, followed by [ENTER]: " -i "$rpi_path" -e install_path
if [ ! -f $install_path"cmd_pipe.php" ]; then
    echo "RPi-Cam-Web-Interface not found. Please check Your path."
    exit
fi

echo -e "\n------------------------------------------------\n"

default="Y"
read -p "Do You want update and upgrade Your system now? [Y/n]" -n 1 -s -r input
input=${input:-${default}}

if [[ "$input" =~ ^[yY]$ ]]; then
    # check if system was updated today
    echo -e "\n------------------------------------------------\n"
    NOW="$( date +%d-%m-%y )"
    LAST="$( date -r /var/cache/apt/ +%d-%m-%y )"
    if [ "$NOW" != "$LAST" ] ; then
        echo "Raspbian System is Up To Date"
    else
        echo "Performing Raspbian System Update"
        echo "This Will Take Some Time ...."
        apt-get clean
        apt-get update -y
        echo -e "\n------------------------------------------------\n"
        echo "Performing Raspbian System Upgrade"
        echo "This Will Take Some Time ...."
        apt-get upgrade -y --force-yes
        apt-get dist-upgrade -y --forec-yes
        apt-get autoremove -y
    fi
fi

echo -e "\n------------------------------------------------\n"

rev_exp="4.0.9-v7+"
rev_rec=$(uname -r)

if [ "$rev_exp" != "$rev_rec" ]; then
    default="Y"
    echo "If You have Rapsberry Pi 2 python GIPO works not with kernel version greater than $rev_exp but You have $rev_rec"
    read -p "Do You want downgrade Your kernel version? [Y/n]" -n 1 -s -r input
    input=${input:-${default}}
        if [[ "$input" =~ ^[yY]$ ]]; then
            echo ""
            echo "Downgrade Your kernel version to $rev_exp now"
            apt-get install -y rpi-update
            rpi-update 46d179597370c5145c7452796acbee0f1ff93392
        fi
fi

do_install=false
if hash servod 2>/dev/null ; then
    default="Y"
    read -p "Do You want install again ServoBlaster? [Y/n]" -n 1 -s -r input
    input=${input:-${default}}
        if [[ "$input" =~ ^[yY]$ ]]; then
            do_install=true
        fi
else
do_install=true
fi

if [ "$do_install" = true ] ; then
    echo -e "\n------------------------------------------------\n"
    echo "Install ServoBlaster"
    cd ~
    rm -rf ServoBlaster
    git clone https://github.com/richardghirst/PiBits
    mv PiBits/ServoBlaster/ . && rm -rf PiBits
    cd ServoBlaster/user
    sudo make install
    cd ~
fi

do_install=false
if python -c "import pipan" > /dev/null 2>&1 ; then
    default="Y"
    read -p "Do You want install again Pi-Pan? [Y/n]" -n 1 -s -r input
    input=${input:-${default}}
        if [[ "$input" =~ ^[yY]$ ]]; then
            do_install=true
        fi
else
do_install=true
fi

if [ "$do_install" = true ] ; then
    echo -e "\n------------------------------------------------\n"
    echo "Install Pi-Pan"
    cd ~
    rm -rf pi-pan
    wget http://www.mindsensors.com/largefiles/pi-pan-2015-Jessie.tar.gz
    tar -zxvf pi-pan-2015-Jessie.tar.gz
    rm pi-pan-2015-Jessie.tar.gz
    cd pi-pan
    ./install-pi-pan.bash
    cd ~
    sudo apt-get install -y python-setuptools
    sudo easy_install pip
    sudo pip install pipan
fi

echo -e "\n------------------------------------------------\n"
echo "Install OpenCV and python-picamera Libraries"
apt-get install -y python-picamera python-imaging python-pyexiv2 libgl1-mesa-dri
apt-get install -y libopencv-dev python-opencv

echo -e "\n------------------------------------------------\n"
echo "Check if camera is enabled"
grep "start_x=1" /boot/config.txt
if grep "start_x=1" /boot/config.txt
then
        echo "Camera is enabled"
else
        sed -i "s/start_x=0/start_x=1/g" /boot/config.txt
        echo "Camera is NOW enabled"
fi

echo -e "\n------------------------------------------------\n"
echo "Fix RPi-Cam-Web-Interface user rights for www-data"
chsh -s /bin/sh www-data

echo -e "\n------------------------------------------------\n"
echo "Install Motion-Pi-Pan"
cd $install_path
chown -R www-data:www-data "$script_path/web/"
find "$script_path/web/" -type d -print0 | xargs -0 chmod 755
find "$script_path/web/" -type f -print0 | xargs -0 chmod 644
find "$script_path/web/" -name "*.py" -print0 | xargs -0 chmod 666
find "$script_path/web/" -type f -name "*.py" -print0 | xargs -0 chmod 744

cp -av "$script_path/web/." "$install_path"

echo -e "\n------------------------------------------------\n"
echo "Add Motion-Pi-Pan.py autostart"
sed -i '/.py &/d' /etc/rc.local
# i - add before | a - after
sed -i '/exit 0/i \python /var/www/html/Motion-Pi-Pan.py &' /etc/rc.local

echo -e "\n------------------------------------------------\n"
echo "Install done"
    default="Y"
    read -p "Do You want reboot now? [Y/n]" -n 1 -s -r input
    input=${input:-${default}}
        if [[ "$input" =~ ^[yY]$ ]]; then
            reboot
        fi
echo -e "\n------------------------------------------------\n"

exit



echo "3 - Install pi-pan files to /home/pi/pi-pan"
cd ~
rm pi-pan-2016-Jessie.tar.gz 
echo "Downloading http://www.mindsensors.com/largefiles/pi-pan-2016-Jessie.tar.gz"
wget http://www.mindsensors.com/largefiles/pi-pan-2016-Jessie.tar.gz
echo "Extracting files to /home/pi/pi-pan folder"
tar -zxvf pi-pan-2016-Jessie.tar.gz
echo "Download and Install pi-pan python library"
sudo apt-get install python-setuptools -y
sudo easy_install pip
sudo pip install pipan
