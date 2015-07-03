// 2015
// UPDATE FROM COM.MEGSTER.CORDOVA.BLE 0.1.1 TO 0.1.6

/* global mainPage, deviceList, refreshButton */
/* global detailPage, resultDiv, messageInput, sendButton, disconnectButton */
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
        sendButton.addEventListener('click', this.sendData, false);
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
			sendButton.dataset.deviceId = deviceId;
			disconnectButton.dataset.deviceId = deviceId;
			app.currentDeviceId = deviceId;
			app.showDetailPage();
			app.printout("Connected to:" + deviceId);
		};

        ble.connect(deviceId, onConnect, app.onError);
    },
    onData: function(data) { // data received from bluetooth preformatted ascii encoded.
        //console.log(data);
        resultDiv.innerHTML += bytesToString(data);
        resultDiv.scrollTop = resultDiv.scrollHeight;
    },
    printout: function(string) { 
    	resultDiv.innerHTML += string;
    	resultDiv.scrollTop = resultDiv.scrollHeight;
    },
    sendData: function(event) { // send data to bluetooth
        var success = function() {
            console.log("success");
            //resultDiv.innerHTML = resultDiv.innerHTML + "Sent: " + messageInput.value + "<br/>";
            resultDiv.scrollTop = resultDiv.scrollHeight;
        };

        var failure = function() {
            alert("Failed writing data to 0000DA11");
        };

        var data = stringToBytes(messageInput.value);
        var deviceId = event.target.dataset.deviceId;
        ble.writeWithoutResponse(deviceId, cmd.serviceUUID, cmd.txCharacteristic, data, success, failure);

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