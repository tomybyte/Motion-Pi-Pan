//
// Interface
//
function getID(e) {
    return document.getElementById(e) || false;
}

function toggle_fullscreen(e) {
    var background = getID("background");
    if (!background) {
        background = document.createElement("div");
        background.id = "background";
        document.body.appendChild(background);
    }

    if (e.className == "fullscreen") {
        e.className = "";
        background.style.display = "none";
    } else {
        e.className = "fullscreen";
        background.style.display = "block";
    }
}

function set_display(value) {
    var show_hide;
    var d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();

    if (value == "Simple") {
        show_hide = "none";
        getID("toggle_display").value = "Full";
    } else {
        show_hide = "block";
        getID("toggle_display").value = "Simple";
    }
    getID("main-buttons").style.display = show_hide;
    getID("secondary-buttons").style.display = show_hide;
    getID("accordion").style.display = show_hide;
    document.cookie = "display_mode=" + value + "; " + expires;
}

function set_stream_mode(value) {
    var d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();

    if (value == "DefaultStream") {
        getID("toggle_stream").value = "MJPEG-Stream";
    } else {
        getID("toggle_stream").value = "Default-Stream";
    }
    document.cookie = "stream_mode=" + value + "; " + expires;
    document.location.reload(true);
}

function schedule_rows() {
    var sun, day, fixed, mode;
    mode = parseInt(getID("DayMode").value);
    switch (mode) {
        case 0:
            sun = 'table-row';
            day = 'none';
            fixed = 'none';
            break;
        case 1:
            sun = 'none';
            day = 'table-row';
            fixed = 'none';
            break;
        case 2:
            sun = 'none';
            day = 'none';
            fixed = 'table-row';
            break;
        default:
            sun = 'table-row';
            day = 'table-row';
            fixed = 'table-row';
            break;
    }
    var rows;
    rows = document.getElementsByClassName('sun');
    for (i = 0; i < rows.length; i++)
        rows[i].style.display = sun;
    rows = document.getElementsByClassName('day');
    for (i = 0; i < rows.length; i++)
        rows[i].style.display = day;
    rows = document.getElementsByClassName('fixed');
    for (i = 0; i < rows.length; i++)
        rows[i].style.display = fixed;
}

function set_preset(value) {
    var values = value.split(" ");
    getID("video_width").value = values[0];
    getID("video_height").value = values[1];
    getID("video_fps").value = values[2];
    getID("MP4Box_fps").value = values[3];
    getID("image_width").value = values[4];
    getID("image_height").value = values[5];
    set_res();
}

function set_res() {
    send_cmd("px " + getID("video_width").value + " " + getID("video_height").value + " " + getID("video_fps").value + " " + getID("MP4Box_fps").value + " " + getID("image_width").value + " " + getID("image_height").value);
    update_preview_delay();
    updatePreview(true);
}

function set_ce() {
    send_cmd("ce " + getID("ce_en").value + " " + getID("ce_u").value + " " + getID("ce_v").value);
}

function set_preview() {
    send_cmd("pv " + getID("quality").value + " " + getID("width").value + " " + getID("divider").value);
    update_preview_delay();
}

function set_roi() {
    send_cmd("ri " + getID("roi_x").value + " " + getID("roi_y").value + " " + getID("roi_w").value + " " + getID("roi_h").value);
}

function set_at() {
    send_cmd("at " + getID("at_en").value + " " + getID("at_y").value + " " + getID("at_u").value + " " + getID("at_v").value);
}

function set_ac() {
    send_cmd("ac " + getID("ac_en").value + " " + getID("ac_y").value + " " + getID("ac_u").value + " " + getID("ac_v").value);
}

function set_ag() {
    send_cmd("ag " + getID("ag_r").value + " " + getID("ag_b").value);
}

//
// Shutdown
//
function sys_shutdown() {
    ajax_status.open("GET", "cmd_func.php?cmd=shutdown", true);
    ajax_status.send();
}

function sys_reboot() {
    ajax_status.open("GET", "cmd_func.php?cmd=reboot", true);
    ajax_status.send();
}

//
// MJPEG
//
var mjpeg_img;
var halted = 0;
var previous_halted = 99;
var mjpeg_mode = 0;
var preview_delay = 0;

function reload_img() {
    if (!halted) mjpeg_img.src = "cam_pic.php?time=" + new Date().getTime() + "&pDelay=" + preview_delay;
    else setTimeout("reload_img()", 500);
}

function error_img() {
    setTimeout("mjpeg_img.src = 'cam_pic.php?time=' + new Date().getTime();", 100);
}

function updatePreview(cycle) {
    if (mjpegmode) {
        if (cycle !== undefined && cycle == true) {
            mjpeg_img.src = "/updating.jpg";
            setTimeout("mjpeg_img.src = \"cam_pic_new.php?time=\" + new Date().getTime()  + \"&pDelay=\" + preview_delay;", 1000);
            return;
        }

        if (previous_halted != halted) {
            if (!halted) {
                mjpeg_img.src = "cam_pic_new.php?time=" + new Date().getTime() + "&pDelay=" + preview_delay;
            } else {
                mjpeg_img.src = "/unavailable.jpg";
            }
        }
        previous_halted = halted;
    }
}

//
// Ajax Status
//
var ajax_status;

if (window.XMLHttpRequest) {
    ajax_status = new XMLHttpRequest();
} else {
    ajax_status = new ActiveXObject("Microsoft.XMLHTTP");
}

ajax_status.onreadystatechange = function() {
    if (ajax_status.readyState == 4 && ajax_status.status == 200) {
        switch (ajax_status.responseText) {
            case "ready":
                getID("video_button").disabled = false;
                getID("video_button").value = "record video start";
                getID("video_button").onclick = function() {
                    send_cmd("ca 1");
                };
                getID("image_button").disabled = false;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {
                    send_cmd("im");
                };
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse start";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 1");
                };
                getID("md_button").disabled = false;
                getID("md_button").value = "motion detection start";
                getID("md_button").onclick = function() {
                    send_cmd("md 1");
                };
                getID("halt_button").disabled = false;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {
                    send_cmd("ru 0");
                };
                getID("preview_select").disabled = false;
                halted = 0;
                updatePreview();
                break;
            case "md_ready":
                getID("video_button").disabled = true;
                getID("video_button").value = "record video start";
                getID("video_button").onclick = function() {};
                getID("image_button").disabled = false;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {
                    send_cmd("im");
                };
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse start";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 1");
                };
                getID("md_button").disabled = false;
                getID("md_button").value = "motion detection stop";
                getID("md_button").onclick = function() {
                    send_cmd("md 0");
                };
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = false;
                halted = 0;
                updatePreview();
                break;
            case "timelapse":
                getID("video_button").disabled = false;
                getID("video_button").value = "record video start";
                getID("video_button").onclick = function() {
                    send_cmd("ca 1");
                };
                getID("image_button").disabled = true;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {};
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse stop";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 0");
                };
                getID("md_button").disabled = true;
                getID("md_button").value = "motion detection start";
                getID("md_button").onclick = function() {};
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = false;
                break;
            case "tl_md_ready":
                getID("video_button").disabled = true;
                getID("video_button").value = "record video start";
                getID("video_button").onclick = function() {};
                getID("image_button").disabled = false;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {
                    send_cmd("im");
                };
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse stop";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 0");
                };
                getID("md_button").disabled = false;
                getID("md_button").value = "motion detection stop";
                getID("md_button").onclick = function() {
                    send_cmd("md 0");
                };
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = false;
                halted = 0;
                updatePreview();
                break;
            case "video":
                getID("video_button").disabled = false;
                getID("video_button").value = "record video stop";
                getID("video_button").onclick = function() {
                    send_cmd("ca 0");
                };
                getID("image_button").disabled = false;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {
                    send_cmd("im");
                };
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse start";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 1");
                };
                getID("md_button").disabled = true;
                getID("md_button").value = "motion detection start";
                getID("md_button").onclick = function() {};
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = true;
                break;
            case "md_video":
                getID("video_button").disabled = true;
                getID("video_button").value = "record video stop";
                getID("video_button").onclick = function() {};
                getID("image_button").disabled = false;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {
                    send_cmd("im");
                };
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse start";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 1");
                };
                getID("md_button").disabled = true;
                getID("md_button").value = "recording video...";
                getID("md_button").onclick = function() {};
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = true;
                break;
            case "tl_video":
                getID("video_button").disabled = false;
                getID("video_button").value = "record video stop";
                getID("video_button").onclick = function() {
                    send_cmd("ca 0");
                };
                getID("image_button").disabled = true;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {
                    send_cmd("im");
                };
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse stop";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 0");
                };
                getID("md_button").disabled = true;
                getID("md_button").value = "motion detection start";
                getID("md_button").onclick = function() {};
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = false;
                break;
            case "tl_md_video":
                getID("video_button").disabled = true;
                getID("video_button").value = "record video stop";
                getID("video_button").onclick = function() {};
                getID("image_button").disabled = true;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {};
                getID("timelapse_button").disabled = false;
                getID("timelapse_button").value = "timelapse stop";
                getID("timelapse_button").onclick = function() {
                    send_cmd("tl 0");
                };
                getID("md_button").disabled = true;
                getID("md_button").value = "recording video...";
                getID("md_button").onclick = function() {};
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = false;
                break;
            case "image":
                getID("video_button").disabled = true;
                getID("video_button").value = "record video start";
                getID("video_button").onclick = function() {};
                getID("image_button").disabled = true;
                getID("image_button").value = "recording image";
                getID("image_button").onclick = function() {};
                getID("timelapse_button").disabled = true;
                getID("timelapse_button").value = "timelapse start";
                getID("timelapse_button").onclick = function() {};
                getID("md_button").disabled = true;
                getID("md_button").value = "motion detection start";
                getID("md_button").onclick = function() {};
                getID("halt_button").disabled = true;
                getID("halt_button").value = "stop camera";
                getID("halt_button").onclick = function() {};
                getID("preview_select").disabled = false;
                break;
            case "halted":
                getID("video_button").disabled = true;
                getID("video_button").value = "record video start";
                getID("video_button").onclick = function() {};
                getID("image_button").disabled = true;
                getID("image_button").value = "record image";
                getID("image_button").onclick = function() {};
                getID("timelapse_button").disabled = true;
                getID("timelapse_button").value = "timelapse start";
                getID("timelapse_button").onclick = function() {};
                getID("md_button").disabled = true;
                getID("md_button").value = "motion detection start";
                getID("md_button").onclick = function() {};
                getID("halt_button").disabled = false;
                getID("halt_button").value = "start camera";
                getID("halt_button").onclick = function() {
                    send_cmd("ru 1");
                };
                getID("preview_select").disabled = false;
                halted = 1;
                updatePreview();
        }
        if (ajax_status.responseText.substr(0, 5) == "Error") {
            alert("Error in RaspiMJPEG: " + ajax_status.responseText.substr(7) + "\nRestart RaspiMJPEG (./RPi_Cam_Web_Interface_Installer.sh start) or the whole RPi.");
        }
        if (getID("motion_button")) {
            getID("motion_button").disabled = false;
            getID("motion_button").value = motion_status;
            getID("motion_button").onclick = function() {
                toggle_motion_status("toggle");
            };
        }
        reload_ajax(ajax_status.responseText);
    }
}

var motion_status = "motion tracking start";

function toggle_motion_status(cmd) {
    if (!getID("motion_button")) {
        return;
    }
    var run = "",
        stop = "motion tracking stop",
        start = "motion tracking start",
        ajax_motion = window.XMLHttpRequest ? new XMLHttpRequest() : ActiveXObject("Microsoft.XMLHTTP");
    ajax_motion.onreadystatechange = function() {
        if (ajax_motion.readyState == 4 && ajax_motion.status == 200) {
            console.log("motion status: " + ajax_motion.responseText);
            if (ajax_motion.responseText == "ON") {
                motion_status = stop;
                run = "tr 0";
            } else {
                motion_status = start;
                run = "tr 1";
            }
            if (cmd == "toggle") {
                motion_status = (motion_status == start ? stop : start);
                send_cmd(run);
            }
            getID("motion_button").value = motion_status;
        }
    }
    ajax_motion.open("GET", "cmd_pipe.php?tracking_status=true");
    ajax_motion.send();
}

function reload_ajax(last) {
    ajax_status.open("GET", "status_mjpeg.php?last=" + last, true);
    ajax_status.send();
}

function get_zip_progress(zipname) {
    var ajax_zip;
    if (window.XMLHttpRequest) {
        ajax_zip = new XMLHttpRequest();
    } else {
        ajax_zip = new ActiveXObject("Microsoft.XMLHTTP");
    }
    ajax_zip.onreadystatechange = function() {
        if (ajax_zip.readyState == 4 && ajax_zip.status == 200) {
            if (process_zip_progress(ajax_zip.responseText)) {
                setTimeout(function() {
                    get_zip_progress(zipname);
                }, 1000);
            } else {
                getID("zipdownload").value = zipname;
                getID("zipform").submit();
                getID("progress").style.display = "none";
            }
        }
    }
    ajax_zip.open("GET", "preview.php?zipprogress=" + zipname);
    ajax_zip.send();
}

function process_zip_progress(str) {
    var arr = str.split("/");
    if (str.indexOf("Done") != -1) {
        return false;
    }
    if (arr.length == 2) {
        var count = parseInt(arr[0]);
        var total = parseInt(arr[1]);
        var progress = getID("progress");
        var caption = " ";
        if (count > 0) caption = str;
        progress.innerHTML = caption + "<div style=\"width:" + (count / total) * 100 + "%;background-color:#0f0;\">&nbsp;</div>";
    }
    return true;
}
//
// Ajax Commands
//
var ajax_cmd;

if (window.XMLHttpRequest) {
    ajax_cmd = new XMLHttpRequest();
} else {
    ajax_cmd = new ActiveXObject("Microsoft.XMLHTTP");
}

function send_cmd(cmd) {
    ajax_cmd.open("GET", "cmd_pipe.php?cmd=" + cmd, true);
    ajax_cmd.send();
}

function update_preview_delay() {
    var video_fps = parseInt(getID("video_fps").value);
    var divider = parseInt(getID("divider").value);
    preview_delay = Math.floor(divider / Math.max(video_fps, 1) * 1000000);
}

//
// Init
//
function init(mjpeg, video_fps, divider) {
    mjpeg_img = getID("mjpeg_dest");
    preview_delay = Math.floor(divider / Math.max(video_fps, 1) * 1000000);
    if (mjpeg) {
        mjpegmode = 1;
    } else {
        mjpegmode = 0;
        mjpeg_img.onload = reload_img;
        mjpeg_img.onerror = error_img;
        reload_img();
    }
    toggle_motion_status("");
    reload_ajax("");
}