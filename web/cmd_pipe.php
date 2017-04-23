<?php
define('BASE_DIR', dirname(__FILE__));
define('PIPAN_MOTION', BASE_DIR . '/' . 'pipan_motion');
require_once(BASE_DIR . '/config.php');

$pipe = fopen('FIFO', 'w');
fwrite($pipe, $_GET["cmd"] . "\n");
fclose($pipe);

if (isset($_GET['cmd'])) {
	switch ($_GET['cmd']) {
		case 'md 1':
		case 'tr 1':
			file_put_contents(PIPAN_MOTION, 'ON');
			break;
		case 'md 0':
		case 'tr 0':
			file_put_contents(PIPAN_MOTION, 'OFF');
			break;
	} 
} 

if (isset($_GET['tracking_status'])) {
	echo file_get_contents(PIPAN_MOTION);
} 

?>
