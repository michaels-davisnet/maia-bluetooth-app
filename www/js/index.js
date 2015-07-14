// 2015
// UPDATE FROM COM.MEGSTER.CORDOVA.BLE 0.1.1 TO 0.1.6

/* global mainPage, deviceList, refreshButton */
/* global detailPage, resultDiv, testButton1, testButton0, testButton2, disconnectButton */
/* global ble, cordova  */
/* jshint browser: true , devel: true*/

'use strict'; // need to be included for ble write

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// Converts a string to array buffer
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

/* BUG: Client remembers the UUIDs and does not change until device is restarted */
var serial = {
    serviceUUID: "0000DA00-384C-0787-5024-F95B53F8CB75",
    rxCharacteristic: "0000DA01-384C-0787-5024-F95B53F8CB75"  // receive is from the phone's perspective
};

var cmd = {
	serviceUUID: "0000DA10-384C-0787-5024-F95B53F8CB75",
	txCharacteristic: "0000DA11-384C-0787-5024-F95B53F8CB75" // transmit is from the phone's perspective
};

var app = {
	currentDeviceId: "",
	initialize: function() {
        this.bindEvents();
        detailPage.hidden = true;
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
        disconnectButton.addEventListener('touchstart', this.disconnect, false);
        testButton0.addEventListener('touchstart', this.test, false);
        testButton1.addEventListener('touchstart', this.testConfigSensor, false);
        testButton2.addEventListener('touchstart', this.testThroughput, false);
    },
    onDeviceReady: function() {
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empties the list
        if (cordova.platformId === 'android') { // Android filtering is broken
            ble.scan([], 10, app.onDiscoverDevice, app.onError);
        } else {
            ble.scan([], 10, app.onDiscoverDevice, app.onError);
        }
    },
    onDiscoverDevice: function(device) {
        var listItem = document.createElement('li'),
            html = '<b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                device.id;

        listItem.dataset.deviceId = device.id;
        listItem.innerHTML = html;
        deviceList.appendChild(listItem);
    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId,
		onConnect = function() {
        	/* XXX function object needs deviceID */
        	testButton0.dataset.deviceId = deviceId;
        	testButton1.dataset.deviceId = deviceId;
        	testButton2.dataset.deviceId = deviceId;
			disconnectButton.dataset.deviceId = deviceId;
			app.currentDeviceId = deviceId;
			app.showDetailPage();
			app.printout("Connected to:" + deviceId + "\n");
		};

        ble.connect(deviceId, onConnect, app.onError);
    },
    printout: function(string) { 
    	resultDiv.innerHTML += string;
    	resultDiv.scrollTop = resultDiv.scrollHeight;
    },
    test: function(packet) {
    	var arraybuf = new ArrayBuffer(20);
    	var view = new Uint8Array(arraybuf);
    	
    	var finished = function() {
    		app.printout("finished\n");
    	};
    	var success = function() {
    		app.printout("Write success\n");
    		view.set([0xff, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], 0);
    		ble.write(deviceId, cmd.serviceUUID, cmd.txCharacteristic, arraybuf, finished, failure);
    	};
    	
    	var failure = function() {
    		app.printout("Failed writing data to 0000DA11\n");
    	};
    	app.printout("starting test, Node ID\n");
		
		view.set([0x00, 0x01, 0x19, 0x00, 0x06, 0x16, 0x00, 0x05, 0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], 0);
		
    	var deviceId = event.target.dataset.deviceId;
    	ble.write(deviceId, cmd.serviceUUID, cmd.txCharacteristic, arraybuf, success, failure);
    },
    testConfigSensor: function(packet) {
    	var arraybuf = new ArrayBuffer(20);
    	var view = new Uint8Array(arraybuf);
    	
    	var finished = function() {
    		app.printout("finished\n");
    	};
    	var success = function() {
    		view.set([0x01, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe, 0x01, 0x03, 0x00, 0x14, 0x02, 0x31, 0x41, 0xd8, 0x93, 0x16, 0x17, 0x81, 0x99], 0);
    		ble.write(deviceId, cmd.serviceUUID, cmd.txCharacteristic, arraybuf, success1, failure);
    	};
    	var success1 = function() {
    		view.set([0xff, 0xfa, 0xbc, 0x72, 0x77, 0x17, 0x83, 0xa7, 0xb8, 0xd2, 0xf3, 0xcd, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], 0);
    		ble.write(deviceId, cmd.serviceUUID, cmd.txCharacteristic, arraybuf, finished, failure);
    	};
    	
    	var failure = function() {
    		app.printout("Failed writing data to 0000DA11\n");
    	};
    	
    	app.printout("starting test, Config Sensor\n");
    	
    	view.set([0x00, 0x01, 0x00, 0x30, 0x11, 0x00, 0x2D, 0x00, 0x07, 0x6B, 0x77, 0x55, 0x10, 0x00, 0x80, 0x0A, 0x1D, 0x00, 0xDE, 0xAD], 0);
    	
    	var deviceId = event.target.dataset.deviceId;
    	ble.write(deviceId, cmd.serviceUUID, cmd.txCharacteristic, arraybuf, success, failure);
    },
    testThroughput: function() {
    	var bytes = new ArrayBuffer(20);
    	var handle = new Uint8Array(bytes);
    	var deviceAddr = event.target.dataset.deviceId;
    	var count = 100;
    	handle.set([0xFF, 0x01, 0x19, 0x00, 0x06, 0x16, 0x00, 0x05, 0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF], 0);
    	var fail = function() {
    		app.printout("Write failed\n");
    	};
    	var success = function() {
    		if (count > 0) {
    			ble.write(deviceAddr, cmd.serviceUUID, cmd.txCharacteristic, bytes, success, fail);
    			count--;
    		}
    		else {
    			var elapsed = Date.now() - starttime;
    			app.printout("Finshed elapsed (ms) " + elapsed + "\n");
    		}
    	};
    	
    	app.printout("throughput test 2000 bytes\n");
    	var starttime = Date.now();
    	ble.write(deviceAddr, cmd.serviceUUID, cmd.txCharacteristic, bytes, success, fail);
    },
    disconnect: function(event) {
        var deviceId = event.target.dataset.deviceId;
        ble.disconnect(deviceId, app.showMainPage, app.onError);
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    onError: function(reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }
};