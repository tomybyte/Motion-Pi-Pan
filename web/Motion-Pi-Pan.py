#!/usr/bin/env python

"""
Raspberry (Pi) - python opencv2 motion tracking using RPi-Cam-Web-Interface

this programm is highly inspired by face-track ver 0.63 written by Claude Pageau
pageauc@gmail.com
https://github.com/pageauc/face-track-demo/

"""

#-----------------------------------------------------------------------------------------------
# Display Settings
debug = True        # Show detailed information output
circle_size = 8     # diameter of circle to show motion location in window
line_thickness = 1  # thickness of bounding line in pixels

# set sensor GPIO ports
middle = 22
left = 17
right = 27
sensor_min_detection = 2

# Camera Settings
#camera_width = 972
#camera_height = 851
camera_width = 320
camera_height = 240
# generated by RPi-Cam-Web-Interface
camera_source = '/dev/shm/mjpeg/cam.jpg'
# to display in by RPi-Cam-Web-Interface
camera_target = '/dev/shm/mjpeg/motion_cam.jpg'

# Pan Tilt Settings
pan_servo_delay = 0.05
pan_servo_sleep = 0.6
pan_steps = 5
pan_start_x = 150   # Initial x start postion
pan_start_y = 160  # initial y start position
# for RPi-Cam-Web-Interface remote control
pan_temp_target = '/var/www/html/pipan_on'
pan_fifo_target = '/var/www/html/FIFO_pipan'
# for RPi-Cam-Web-Interface contained ON or OFF
pan_motion_target = '/var/www/html/pipan_motion'

# Bounds checking for pan/tilt Movements.
pan_min_x = 65
pan_max_x = 245
pan_min_y = 80
pan_max_y = 240
pan_move_x = int(camera_width / 6)  # Amount to pan left/right in search mode
pan_move_y = int(camera_height / 8) # Amount to pan up/down in search mode

# OpenCV Motion Tracking Settings
#min_area = 1000       # sq pixels - exclude all motion contours less than or equal to this Area
min_area = 250
threshold_sensitivity = 25
blur_size = 10

# OpenCV haarcascade Settings
fface1_haar_path = '/usr/share/opencv/haarcascades/haarcascade_frontalface_default.xml'  # default face frontal detection
fface2_haar_path = '/usr/share/opencv/haarcascades/haarcascade_frontalface_alt2.xml'  # frontal face pattern detection
pface1_haar_path = '/usr/share/opencv/haarcascades/haarcascade_profileface.xml'	# side face pattern detection

#-----------------------------------------------------------------------------------------------

# import the necessary python libraries
import os
import io
import time
import cv2
import pipan
import RPi.GPIO as GPIO
import datetime
import sys
import stat
from threading import Thread

progName = os.path.basename(__file__)

print("===================================")
print("%s using python2 and OpenCV2" % (progName))
print("Loading Libraries  Please Wait ....")

# check RPi-Cam-Web-Interface control files
try:
    os.mknod(pan_fifo_target, 0666|stat.S_IRUSR)
except:
    pass
os.chmod(pan_fifo_target, 0o666)

if not os.path.isfile(pan_temp_target):
    open(pan_temp_target, 'w').close()
os.chmod(pan_temp_target, 0o666)

if not os.path.isfile(pan_motion_target):
    open(pan_motion_target, 'w').close()
os.chmod(pan_motion_target, 0o666)

# Initialize pipan driver
p = pipan.PiPan()

if not os.path.isfile(camera_source):
    print("RPi-Cam-Web-Interface seems not run: missing %s" % (camera_source))
    exit()

pos_x = 0
pos_y = 0
# try to open pan status file
pan_file = open(pan_temp_target, 'r')
if pan_file:
    pan_file_pos = pan_file.read().split(' ')
    if pan_file_pos[0] and pan_file_pos[1]:
        pos_x = int(pan_file_pos[0].strip())
        pos_y = int(pan_file_pos[1].strip())
if pos_x == 0 or pos_y == 0:
    # neutral the pan servo
    p.neutral_pan()
    # neutral the tilt servo
    p.neutral_tilt()
    time.sleep(pan_servo_sleep)
    # init last servo position
    pos_x = pan_start_x
    pos_y = pan_start_y

print("Position pan/tilt to (%i, %i)" % (pos_x, pos_y))
# init servo_active
servo_active = False

# BCM GPIO-Referenen verwenden (anstelle der Pin-Nummern)
GPIO.setmode(GPIO.BCM)
GPIO_PIRS = (middle, left, right)
motion_temp = {}
loc = {}
loc[middle] = 'center'
loc[left] = 'left'
loc[right] = 'right'
pan_win = round((pan_max_x - pan_min_x) / 8)
pan = {}
pan[middle] = pan_start_x
pan[left] = pan_max_x - pan_win
pan[right] = pan_min_x + pan_win

# Create Calculated Variables
cam_cx = camera_width / 2
cam_cy = camera_height / 2

# Color data for OpenCV Markings
blue = (255,0,0)
green = (0,255,0)
red = (0,0,255)

# Setup haar_cascade variables
face_cascade = cv2.CascadeClassifier(fface1_haar_path)
frontalface = cv2.CascadeClassifier(fface2_haar_path)
profileface = cv2.CascadeClassifier(pface1_haar_path)

#-----------------------------------------------------------------------------------------------
def fifo_listener(): # listen to RPi-Cam-Web-Interface FIFO
    while True:
        pipein = open(pan_fifo_target, 'r')
        line_array = pipein.read().split(' ')
        if line_array and line_array[0] == 'servo' and line_array[1] and line_array[2]:
            x = int(line_array[1].strip())
            y = int(line_array[2].strip())
            motion_move(x, y)
            if debug:
                print("%s fifo_listener(): move x form: %i to: %i | y from: %i to: %i" % (datetime.datetime.now(), pos_x, x, pos_y, y))
        pipein.close()

#-----------------------------------------------------------------------------------------------
def motion_listener(): # listen to RPi-Cam-Web-Interface remote control
    time.sleep(1)
    motion_active = False
    if os.path.isfile(pan_motion_target):
        pipein = open(pan_motion_target, 'r')
        line = pipein.readline()
        if line == 'ON':
            motion_active = True
    return motion_active

#-----------------------------------------------------------------------------------------------
def motion_move(x, y): # smoothly move the pan/tilt to a specific location
    global pos_x, pos_y, servo_active
    if servo_active == True:
        return
    servo_active = True
    x = int(x)
    y = int(y)
    if x <  pan_min_x:
        x = pan_min_x
    elif x > pan_max_x:
        x = pan_max_x
    if pos_x <> x:
        m = pos_x
        if m < x:
            while (m + pan_steps) < x:
                m += pan_steps
                if m < x:
                    p.do_pan(m)
                    time.sleep(pan_servo_delay)
        else:
            while (m - pan_steps) > x:
                m -= pan_steps
                if m > x:
                    p.do_pan(m)
                    time.sleep(pan_servo_delay)
        if m <> x:
            p.do_pan(x)
    if y < pan_min_y:
        y = pan_min_y
    elif y > pan_max_y:
        y = pan_max_y
    if pos_y <> y:
        m = pos_y
        if m < y:
            while (m + pan_steps) < y:
                m += pan_steps
                if m < y:
                    p.do_tilt(m)
                    time.sleep(pan_servo_delay)
        else:
            while (m - pan_steps) > y:
                m -= pan_steps
                if m > y:
                    p.do_tilt(m)
                    time.sleep(pan_servo_delay)
        if m <> y:
            p.do_tilt(y)
    if pos_x <> x or pos_y <> y:
        time.sleep(pan_servo_sleep)  # give the servo's some time to move
        if os.path.isfile(pan_temp_target):
            text_file = open(pan_temp_target, 'w')
            text_file.write("%s %s" % (x, y))
            text_file.close()
    if debug:
        print("%s motion_move(): move camera - x from %i to %i | y from %i to %i" % (datetime.datetime.now(), pos_x, x, pos_y, y))
    pos_x = x
    pos_y = y
    servo_active = False
    return

#-----------------------------------------------------------------------------------------------
def sensor_detect(pin):
    global motion_temp, motion_inactive
    if servo_active == True:
        return
    for i in GPIO_PIRS:
        if i == pin:
            motion_temp[i] += 1
        else:
            motion_temp[i] = 0
    dis_now = abs(pan[pin] - pos_x)
    dis_min = pan_win * 2
    if debug:
        print "%s sensor_detect(): %s since: %i of: %i times | motion inactive %i times | distance now: %i min: %i" % (datetime.datetime.now(), loc[pin], motion_temp[pin], sensor_min_detection, motion_inactive, dis_now, dis_min)
    # motion_detect() runs about 20 times per second
    if motion_temp[pin] >= sensor_min_detection and motion_inactive > 80 and dis_now > dis_min:
        if debug:
            print "%s sensor_detect(): sensor moving - %s" % (datetime.datetime.now(), loc[pin])
        motion_move(pan[pin], pan_start_y)
        motion_inactive = 0
        for i in GPIO_PIRS:
            motion_temp[i] = 0

#-----------------------------------------------------------------------------------------------
def motion_detect(gray_img_1, gray_img_2):
    motion_found = False
    motion_center = ()
    if servo_active == True:
        return motion_center
    biggest_area = min_area
    # Process images to see if there is motion
    differenceimage = cv2.absdiff(gray_img_1, gray_img_2)
    differenceimage = cv2.blur(differenceimage,(blur_size,blur_size))
    # Get threshold of difference image based on threshold_sensitivity variable
    retval, thresholdimage = cv2.threshold(differenceimage, threshold_sensitivity, 255, cv2.THRESH_BINARY)
    # Get all the contours found in the thresholdimage
    try:
        thresholdimage, contours, hierarchy = cv2.findContours(thresholdimage, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    except:
        contours, hierarchy = cv2.findContours(thresholdimage, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours != ():    # Check if Motion Found
        for c in contours:
            found_area = cv2.contourArea(c) # Get area of current contour
            #if debug:
                #print("%s motion_detect(): found_area %i" % (datetime.datetime.now(), found_area))
            # if found_area bigger 20000 servos are in motion
            if found_area > biggest_area and found_area < 20000:   # Check if it has the biggest area
                biggest_area = found_area   # If bigger then update biggest_area
                (x, y, w, h) = cv2.boundingRect(c)    # get motion contour data
                motion_found = True
        if motion_found:
            cx = int(x + w/2)
            cy = int(y + h/2)
            motion_center = (cx, cy)
            # wirte image
            cv2.rectangle(img_frame, (x, y), (x + w, y + h), green, line_thickness)
            #cv2.circle(img_frame, (cx,cy), circle_size, green, line_thickness)
            cv2.imwrite(camera_target, img_frame)
            if debug:
                print("%s motion_detect(): found motion at px cx,cy (%i, %i) Area w%i x h%i = %i sq px" % (datetime.datetime.now(), int(x + w/2), int(y + h/2), w, h, biggest_area))
    return motion_center

#-----------------------------------------------------------------------------------------------
def face_detect(image):
    face = ()
    # Look for Frontal Face
    ffaces = face_cascade.detectMultiScale(image, scaleFactor=1.3, minNeighbors=5, minSize=(60, 60), flags=cv2.cv.CV_HAAR_SCALE_IMAGE)
    if ffaces != ():
        for f in ffaces:
            face = f
        source = 'face cascade'
    else:
        # Look for Profile Face if Frontal Face Not Found
        pfaces = profileface.detectMultiScale(image, scaleFactor=1.3, minNeighbors=5, minSize=(60, 60), flags=cv2.cv.CV_HAAR_SCALE_IMAGE)
        if pfaces != ():  # Check if Profile Face Found
            for f in pfaces:  # f in pface is an array with a rectangle representing a face
                face = f
            source = 'profile face'
        else:
            ffaces = frontalface.detectMultiScale(image, scaleFactor=1.3, minNeighbors=5, minSize=(60, 60), flags=cv2.cv.CV_HAAR_SCALE_IMAGE)
            if ffaces != ():  # Check if Frontal Face Found
                for f in ffaces:  # f in fface is an array with a rectangle representing a face
                    face = f
                source = 'fronta face'
    if face != ():
        (x, y, w, h) = face
        cx = int(x + w/2)
        cy = int(y + h/2)
        # wirte image
        cv2.rectangle(img_frame, (x, y), (x + w, y + h), red, line_thickness)
        cv2.imwrite(camera_target, img_frame)
        if debug:
            print("%s face_detect(): found face by: %s at px cx,cy (%i, %i) Area w%i x h%i" % (datetime.datetime.now(), source, int(x + w/2), int(y + h/2), w, h))
    return face

#-----------------------------------------------------------------------------------------------  
def motion_track():
    global motion_temp, motion_inactive, img_frame
    print("Initializing Pi Camera ....") 
    print("press ctrl-c to quit SSH or terminal session")

    motion_inactive = 0
    motion_center = ()
    face_center = ()
    # init sensors
    for i in GPIO_PIRS:
        GPIO.setup(i,GPIO.IN)
        GPIO.add_event_detect(i, GPIO.RISING, callback=sensor_detect)
        motion_temp[i] = 0

    img_frame = cv2.imread(camera_source)
    # img_frame = cv2.flip(img_frame, 0) # horizontal
    # img_frame = cv2.flip(img_frame, 1) # vertical
    # wirte image
    cv2.imwrite(camera_target, img_frame)
    grayimage1 = cv2.cvtColor(img_frame, cv2.COLOR_BGR2GRAY)
    # start listen to RPi-Cam-Web-Interface FIFO
    fl = Thread(target=fifo_listener)
    fl.daemon = True
    fl.start()
    print("===================================")
    print("Start Tracking Motion....")
    print("")
    while True:
        if motion_listener():
            img_frame = cv2.imread(camera_source)
            # Search for Motion and Track
            grayimage2 = cv2.cvtColor(img_frame, cv2.COLOR_BGR2GRAY)
            if motion_center == () and face_center == ():
                motion_center = motion_detect(grayimage1, grayimage2)
                face_center = face_detect(grayimage2)
            else:
                # after moving reset grayimage2 first
                motion_center = ()
                face_center = ()
            motion_inactive += 1
            grayimage1 = grayimage2  # Reset grayimage1 for next loop
            if face_center != () or motion_center != ():
                motion_inactive = 0
                if servo_active == False:
                    if face_center != ():
                        (fx, fy, fw, fh) = face_center
                        cx = int(fx + fw/2)
                        cy = int(fy + fh/2)
                        source = 'face'
                    else:
                        cx = motion_center[0]
                        cy = motion_center[1]
                        source = 'motion'
                    Nav_LR = int((cam_cx - cx) / 7)
                    Nav_UD = int((cam_cy - cy) / 6)
                    # use + instead - otherwise use cv2.flip image vertical
                    pan_cx = pos_x + Nav_LR 
                    pan_cy = pos_y - Nav_UD
                    if debug:
                        print("%s motion_track(): %s at cx=%3i cy=%3i | pan to pan_cx=%3i pan_cy=%3i | Nav_LR=%3i Nav_UD=%3i " % (datetime.datetime.now(), source, cx, cy, pan_cx, pan_cy, Nav_LR, Nav_UD))
                    motion_move(pan_cx, pan_cy)

#-----------------------------------------------------------------------------------------------
try:
    motion_track()
finally:
    print("")
    print("+++++++++++++++++++++++++++++++++++")
    print("%s - Exiting" % (progName))
    print("+++++++++++++++++++++++++++++++++++")
    print("")
